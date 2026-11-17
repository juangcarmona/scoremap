import { openDB } from "idb";
import { validateLibrary, type Library } from "./domain";
import type { LibraryStore } from "./storage";

import type { SessionInfo } from "../../shared/auth/session";
import type {
  NotationStore,
  NotationSettings,
} from "../../shared/music/notation";

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
const pendingDb = () =>
  openDB("scoremap-protected-pending", 1, {
    upgrade(db) {
      db.createObjectStore("pending");
    },
  });
// Explicit local deletion grants neither decryption nor server write authority.
export async function discardProtectedPending(principal: string) {
  const db = await pendingDb();
  await db.delete("pending", principal);
  db.close();
}
export class PrivateLibraryStore implements LibraryStore {
  readonly scope = "private";
  readonly notation: NotationStore = {
    read: () => this.request<NotationSettings>("/api/preferences/notation"),
    save: (request) =>
      this.request<NotationSettings>("/api/preferences/notation", {
        method: "PUT",
        body: JSON.stringify(request),
      }),
  };
  private versions: Record<string, number> = {};
  capabilities: LibraryView["capabilities"] = {};
  private key: CryptoKey | null = null;
  private keyId = "";
  private retry: { candidate: string; commandId: string } | null = null;
  private recoveryRetry: { candidate: string; commandId: string } | null = null;
  pendingRecovery = false;
  private controller = new AbortController();
  private generation = 0;
  private terminated = false;
  constructor(
    readonly identity: SessionInfo,
    private lock: () => void,
    private authorized: () => boolean,
  ) {}
  version(songId: string) {
    return this.versions[songId] ?? 0;
  }
  updateAuthorization(authorized: () => boolean) {
    this.authorized = authorized;
  }
  lockAccess() {
    if (this.terminated) return;
    this.terminated = true;
    void this.close();
    this.lock();
  }
  private assertAccess(generation = this.generation) {
    if (this.terminated || !this.authorized()) this.lockAccess();
    if (this.controller.signal.aborted || generation !== this.generation)
      throw new Error(
        "Your private library is locked. Sign in again to recover protected pending work.",
      );
  }
  async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    this.assertAccess();
    const generation = this.generation;
    const response = await fetch(path, {
      ...init,
      credentials: "same-origin",
      signal: this.controller.signal,
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        "X-ScoreMap-CSRF": this.identity.csrf,
        ...init.headers,
      },
    });
    this.assertAccess(generation);
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        this.lockAccess();
      }
      let detail =
        "The server could not confirm this operation. Keep your pending work and check the saved result before retrying.";
      try {
        detail =
          ((await response.json()) as { detail?: string }).detail ?? detail;
      } catch {
        /* A transport error may have no body. */
      }
      throw new Error(detail);
    }
    const result =
      response.status === 204
        ? (undefined as T)
        : ((await response.json()) as T);
    this.assertAccess(generation);
    return result;
  }
  async load() {
    if (this.controller.signal.aborted && !this.terminated && this.authorized())
      this.controller = new AbortController();
    this.assertAccess();
    const generation = this.generation;
    const view = await this.request<LibraryView>("/api/library");
    this.versions = view.versions;
    this.capabilities = view.capabilities;
    const db = await pendingDb();
    this.pendingRecovery = !!(await db.get("pending", this.identity.principal));
    db.close();
    const recovery = await this.request<RecoveryKey>("/api/recovery-keys", {
      method: "POST",
    });
    const key = await this.importKey(recovery.key);
    this.assertAccess(generation);
    this.keyId = recovery.id;
    this.key = key;
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
      this.lockAccess();
      this.assertAccess();
    }
  }
  async commit(
    candidate: Library,
    expectedRevision: number,
    intent?: "import",
  ): Promise<Library> {
    this.assertAccess();
    const generation = this.generation;
    validateLibrary(candidate);
    if (this.pendingRecovery)
      throw new Error(
        "Review and retry, export, or explicitly remove your previous pending work before saving new changes.",
      );
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
    const keyId = this.keyId;
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
      { keyId, iv, cipher, commandId } satisfies PendingRecord,
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
    this.assertAccess(generation);
    await this.removePending(commandId);
    return validateLibrary(saved.library);
  }
  private async pendingRecord() {
    const db = await pendingDb();
    const pending = (await db.get("pending", this.identity.principal)) as
      PendingRecord | undefined;
    db.close();
    if (!pending) throw new Error("No protected pending work was found.");
    return pending;
  }
  private async unlockPending() {
    this.assertAccess();
    const generation = this.generation;
    const pending = await this.pendingRecord();
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
      expectedRevision: number;
      versions: Record<string, number>;
      import: boolean;
    };
    this.assertAccess(generation);
    const library = validateLibrary(record.library);
    return { record: { ...record, library }, pending };
  }
  async recoverPending(): Promise<Library> {
    return (await this.unlockPending()).record.library;
  }
  private async removePending(commandId: string) {
    const db = await pendingDb();
    const tx = db.transaction("pending", "readwrite");
    const existing = (await tx.store.get(this.identity.principal)) as
      PendingRecord | undefined;
    if (existing?.commandId === commandId)
      await tx.store.delete(this.identity.principal);
    await tx.done;
    db.close();
    this.pendingRecovery = false;
  }
  async discardPending() {
    const pending = await this.pendingRecord();
    await this.removePending(pending.commandId);
  }
  async retryPending() {
    const { record, pending } = await this.unlockPending();
    const saved = await this.request<LibraryView>("/api/library", {
      method: "PUT",
      body: JSON.stringify({
        ...record,
        commandId: pending.commandId,
        mode: "edit",
        recoveryKeyId: pending.keyId,
      }),
    });
    this.versions = saved.versions;
    this.capabilities = saved.capabilities;
    await this.removePending(pending.commandId);
    return validateLibrary(saved.library);
  }
  recoverSong(
    songId: string,
    operation: "restore" | "purge",
    expectedRevision: number,
    revision?: number,
    confirmation?: string,
  ) {
    const request = {
      expectedRevision,
      revision,
      confirmation,
      confirmed: true,
      mode: "edit",
    };
    const candidate = JSON.stringify({ songId, operation, request });
    const commandId =
      this.recoveryRetry?.candidate === candidate
        ? this.recoveryRetry.commandId
        : crypto.randomUUID();
    this.recoveryRetry = { candidate, commandId };
    return this.request(
      `/api/songs/${encodeURIComponent(songId)}/${operation}`,
      {
        method: "POST",
        body: JSON.stringify({ ...request, commandId }),
      },
    ).then((acknowledgement) => {
      this.recoveryRetry = null;
      return acknowledgement;
    });
  }
  close() {
    this.key = null;
    this.keyId = "";
    this.retry = null;
    this.recoveryRetry = null;
    this.controller.abort();
    this.generation += 1;
    this.versions = {};
    this.capabilities = {};
    return Promise.resolve();
  }
}
