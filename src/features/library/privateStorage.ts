import { openDB } from "idb";
import { QueryClient } from "@tanstack/react-query";
import { validateLibrary, type Library } from "./domain";
import type { LibraryStore } from "./storage";

import type { SessionInfo } from "../../shared/auth/session";

interface LibraryView {
  library: Library;
  versions: Record<string, number>;
  capabilities: Record<string, "owner" | "editor" | "viewer">;
}
interface RecoveryKey {
  id: string;
  key: string;
}
interface PendingRecord {
  keyId: string;
  iv: Uint8Array;
  cipher: ArrayBuffer;
  commandId: string;
}
const query = new QueryClient({
  defaultOptions: { queries: { retry: false, staleTime: 0 } },
});
const pendingDb = () =>
  openDB("scoremap-protected-pending", 1, {
    upgrade(db) {
      db.createObjectStore("pending");
    },
  });
export class PrivateLibraryStore implements LibraryStore {
  readonly scope = "private";
  private versions: Record<string, number> = {};
  capabilities: LibraryView["capabilities"] = {};
  private key: CryptoKey | null = null;
  private keyId = "";
  private retry: { candidate: string; commandId: string } | null = null;
  pendingRecovery = false;
  constructor(
    readonly identity: SessionInfo,
    private lock: () => void,
  ) {}
  async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await fetch(path, {
      ...init,
      credentials: "same-origin",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        "X-ScoreMap-CSRF": this.identity.csrf,
        ...init.headers,
      },
    });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        this.key = null;
        this.lock();
      }
      let detail =
        "The server could not acknowledge this operation. Your saved music is unchanged.";
      try {
        detail =
          ((await response.json()) as { detail?: string }).detail ?? detail;
      } catch {
        /* A transport error may have no body. */
      }
      throw new Error(detail);
    }
    return response.status === 204
      ? (undefined as T)
      : ((await response.json()) as T);
  }
  async load() {
    const view = await query.fetchQuery({
      queryKey: ["private-library", this.identity.principal],
      queryFn: () => this.request<LibraryView>("/api/library"),
    });
    this.versions = view.versions;
    this.capabilities = view.capabilities;
    const db = await pendingDb();
    this.pendingRecovery = !!(await db.get("pending", this.identity.principal));
    db.close();
    const recovery = await this.request<RecoveryKey>("/api/recovery-keys", {
      method: "POST",
    });
    this.keyId = recovery.id;
    this.key = await this.importKey(recovery.key);
    return validateLibrary(view.library);
  }
  private importKey(value: string) {
    return crypto.subtle.importKey(
      "raw",
      Uint8Array.from(atob(value), (c) => c.charCodeAt(0)),
      "AES-GCM",
      false,
      ["encrypt", "decrypt"],
    );
  }
  async checkAccess() {
    const view = await this.request<LibraryView>("/api/library");
    if (
      Object.entries(this.capabilities).some(
        ([id, role]) => view.capabilities[id] !== role,
      )
    ) {
      this.key = null;
      this.lock();
    }
  }
  async commit(
    candidate: Library,
    expectedRevision: number,
    intent?: "import",
  ): Promise<Library> {
    validateLibrary(candidate);
    if (!this.key)
      throw new Error("Sign in again before saving private music.");
    const serialized = JSON.stringify({
      library: candidate,
      expectedRevision,
      versions: this.versions,
      import: intent === "import",
    });
    const commandId =
      this.retry?.candidate === serialized
        ? this.retry.commandId
        : crypto.randomUUID();
    this.retry = { candidate: serialized, commandId };
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const cipher = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      this.key,
      new TextEncoder().encode(serialized),
    );
    const db = await pendingDb();
    // Retain only ciphertext and an opaque key/command reference across session termination.
    await db.put(
      "pending",
      { keyId: this.keyId, iv, cipher, commandId } satisfies PendingRecord,
      this.identity.principal,
    );
    db.close();
    const saved = await this.request<LibraryView>("/api/library", {
      method: "PUT",
      body: JSON.stringify({
        library: candidate,
        expectedRevision,
        versions: this.versions,
        commandId,
        mode: "edit",
        recoveryKeyId: this.keyId,
        import: intent === "import",
      }),
    });
    this.versions = saved.versions;
    this.capabilities = saved.capabilities;
    this.retry = null;
    const completed = await pendingDb();
    await completed.delete("pending", this.identity.principal);
    completed.close();
    return validateLibrary(saved.library);
  }
  async recoverPending(): Promise<Library> {
    const db = await pendingDb();
    const pending = (await db.get("pending", this.identity.principal)) as
      PendingRecord | undefined;
    db.close();
    if (!pending) throw new Error("No protected pending work was found.");
    const key = await this.request<RecoveryKey>(
      `/api/recovery-keys/${pending.keyId}/unlock`,
      { method: "POST" },
    );
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: new Uint8Array(pending.iv) },
      await this.importKey(key.key),
      pending.cipher,
    );
    const record = JSON.parse(new TextDecoder().decode(plaintext)) as {
      library: unknown;
    };
    return validateLibrary(record.library);
  }
  close() {
    this.key = null;
    query.removeQueries({
      queryKey: ["private-library", this.identity.principal],
    });
    return Promise.resolve();
  }
}
