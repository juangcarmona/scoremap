import type {
  CommitLibrary as ApiCommitLibrary,
  NotationRequest as ApiNotationRequest,
} from "../../shared/api/private-api.gen";
import { OfflineAuthority } from "../../shared/auth/offlineLease";
import { sessionRequestAnchor } from "../../shared/auth/sessionDeadline";
import {
  ProtectedOfflineCache,
  removeOfflineCopies,
  type OfflineEnvelope,
} from "./protectedOffline";
import {
  pendingDatabase as pendingDb,
  retainedDrafts,
  readPending,
  writePending,
  removePending as removeStoredPending,
  discardProtectedPending as discardSongPending,
  type PendingKey,
  type PendingRecord,
  type RetainedDraft,
} from "./protectedPending";
import { PersonalPending, discardPersonalPending } from "./personalPending";
import { notationSettings } from "../../shared/music/notation";
export async function discardProtectedPending(principal: string) {
  await discardSongPending(principal);
  await discardPersonalPending(principal);
  await removeOfflineCopies(principal);
}
import type { ImportProvenance } from "./importSelection";
import { validateLibrary, type Library, type Song } from "./domain";
import { copySongIdentities } from "./identityCopy";
import { isRichSong } from "./score";
import { migrateSong } from "./scoreMigration";
import { sameData } from "./validation";
import type { LibraryStore, PreparedLibrarySave } from "./storage";

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
export class PrivateLibraryStore implements LibraryStore {
  readonly scope = "private";
  readonly notation: NotationStore = {
    subscribe: (listener) => {
      this.notationListeners.add(listener);
      return () => {
        this.notationListeners.delete(listener);
      };
    },
    read: () =>
      this.request<unknown>("/api/preferences/notation").then(notationSettings),
    save: (request) =>
      this.personal.mutate(
        "notation",
        request satisfies ApiNotationRequest,
        notationSettings,
      ),
    discard: (request) =>
      this.personal.discardOwn("notation", "notation", request.commandId),
  };
  private notationListeners = new Set<(settings: NotationSettings) => void>();
  readonly personal: PersonalPending;
  readonly offline: OfflineAuthority;
  private currentIdentity: SessionInfo;
  private offlineCache: ProtectedOfflineCache;
  private unsubscribeOffline: () => void;
  get offlineReady() {
    return (
      !this.terminated &&
      this.authorized() &&
      this.offline.matches(this.currentIdentity)
    );
  }
  private versions: Record<string, number> = {};
  capabilities: LibraryView["capabilities"] = {};
  private key: CryptoKey | null = null;
  private keyId = "";
  private readonly contextId = crypto.randomUUID();
  private sequence = 0;
  private protectedSequence = 0;
  private protectionError: unknown = null;
  private acknowledgedRevision = 0;
  private stageTail: Promise<void> = Promise.resolve();
  private unconfirmed: PreparedLibrarySave | null = null;
  private lastPrepared: {
    candidate: Library;
    intent: "import" | undefined;
    source?: ImportProvenance;
    write: PreparedLibrarySave;
  } | null = null;
  private drafts: RetainedDraft[] = [];
  private selected: PendingKey | null = null;
  private reviewOwnDraft = false;
  get pendingRecovery() {
    return this.drafts.length > 0;
  }
  get protectedOnDevice() {
    return this.sequence > 0 && this.protectedSequence === this.sequence;
  }
  get pendingChoices() {
    return this.drafts.map((draft, index) => ({
      id: JSON.stringify(draft.key),
      name: `Draft ${index + 1}`,
    }));
  }
  get selectedPending() {
    return this.selected ? JSON.stringify(this.selected) : "";
  }
  selectPending(id: string) {
    const draft = this.drafts.find((draft) => JSON.stringify(draft.key) === id);
    if (!draft)
      throw new Error("This protected draft is unavailable for this account.");
    this.selected = draft.key;
  }
  private get ownKey(): PendingKey {
    return [this.identity.principal, this.contextId];
  }
  private async refreshDrafts() {
    this.drafts = (await retainedDrafts(this.identity.principal)).filter(
      (draft) =>
        typeof draft.key === "string" ||
        draft.key[1] !== this.contextId ||
        this.reviewOwnDraft,
    );
    if (
      !this.drafts.some(
        (draft) => JSON.stringify(draft.key) === JSON.stringify(this.selected),
      )
    )
      this.selected = this.drafts[0]?.key ?? null;
  }
  private recoveryRetry: { candidate: string; commandId: string } | null = null;
  private controller = new AbortController();
  private generation = 0;
  private terminated = false;
  constructor(
    readonly identity: SessionInfo,
    private lock: () => void,
    private authorized: () => boolean,
    offline = new OfflineAuthority(),
  ) {
    this.offline = offline;
    this.currentIdentity = identity;
    this.offlineCache = new ProtectedOfflineCache(identity.principal);
    this.unsubscribeOffline = offline.subscribe(() => {
      this.offlineCache.clearMemory();
      if (navigator.onLine === false) this.lockAccess();
    });
    this.personal = new PersonalPending(
      identity.principal,
      (path, init) => this.request(path, init),
      () => !this.terminated && this.authorized(),
    );
  }
  version(songId: string) {
    return Object.hasOwn(this.versions, songId) ? this.versions[songId]! : 0;
  }
  updateAuthorization(
    authorized: () => boolean,
    identity = this.currentIdentity,
  ) {
    if (
      identity.principal !== this.identity.principal ||
      identity.sessionId !== this.identity.sessionId
    ) {
      this.lockAccess();
      return;
    }
    this.currentIdentity = identity;
    this.authorized = authorized;
  }
  async prepareOffline(candidate: Library) {
    this.assertAccess();
    if (navigator.onLine === false)
      throw new Error("Prepare offline access while connected to the service.");
    if (!this.currentIdentity.privateOfflineMinutes)
      throw new Error("Private offline access is disabled on this server.");
    await this.whenProtected();
    if (this.pendingRecovery || (await this.personal.list()).length)
      throw new Error(
        "Recover your existing protected changes before preparing offline access.",
      );
    const generation = this.generation,
      sequence = this.sequence,
      personalVersion = this.personal.version;
    const anchor = sessionRequestAnchor();
    const unchanged = () =>
      this.sequence === sequence &&
      this.personal.version === personalVersion &&
      this.acknowledgedRevision === candidate.revision;
    try {
      const envelope = await this.request<OfflineEnvelope>(
        "/api/offline-lease",
        {
          method: "POST",
          body: JSON.stringify({
            songIds: candidate.songs.map((song) => song.id),
          }),
        },
      );
      this.assertAccess(generation);
      this.assertViewPermissions(envelope.view, candidate);
      if (
        !unchanged() ||
        !sameData(validateLibrary(envelope.view.library), candidate)
      )
        throw new Error(
          "Saved music changed while preparing. Wait for confirmation and reload before trying again.",
        );
      await this.offlineCache.protect(envelope);
      const key = await this.importKey(envelope.keys.songs.key);
      await this.personal.installPreparedKey(envelope.keys.personal);
      this.assertAccess(generation);
      if (!unchanged() || (await this.personal.list()).length)
        throw new Error(
          "Personal or musical changes began while preparing. Finish or recover them before trying again.",
        );
      this.key = key;
      this.keyId = envelope.keys.songs.id;
      this.offline.activate(envelope, this.currentIdentity, anchor);
      for (const listener of this.notationListeners)
        listener(envelope.personal.notation);
      return this.offline.info!;
    } catch (error) {
      this.offlineCache.clearMemory();
      this.offline.stop();
      throw error;
    }
  }
  preparedPersonal() {
    this.assertAccess();
    if (!this.offlineReady)
      throw new Error("Offline preparation is no longer active.");
    return {
      presets: this.offlineCache.read("/api/voicing-presets"),
      deviceConfigurations: this.offlineCache.read(
        "/api/device-configurations",
      ),
    };
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
    if (navigator.onLine === false) {
      if (!this.offlineReady) {
        this.lockAccess();
        this.assertAccess();
      }
      if ((init.method ?? "GET") !== "GET")
        throw new Error(
          "Your change is protected on this device but has no service acknowledgement. Reconnect and review it explicitly.",
        );
      if (path !== "/api/library" && !this.offline.info?.scope.personal)
        throw new Error("This personal resource has no offline authorization.");
      return this.offlineCache.read(path) as T;
    }
    const generation = this.generation;
    const response = await fetch(path, {
      ...init,
      credentials: "same-origin",
      signal: AbortSignal.any([
        this.controller.signal,
        AbortSignal.timeout(30000),
        ...(init.signal ? [init.signal] : []),
      ]),
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        "X-ScoreMap-CSRF": this.currentIdentity.csrf,
        ...init.headers,
      },
    });
    this.assertAccess(generation);
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        this.lockAccess();
      }
      const retryAfter = Number(response.headers.get("Retry-After"));
      let detail =
        response.status === 429
          ? `Too many operations at once. ${Number.isFinite(retryAfter) && retryAfter > 0 ? `Wait ${Math.ceil(retryAfter)} seconds and try again.` : "Wait before trying again."} This request was not processed.`
          : "The server could not confirm this operation. Keep your pending work and check the saved result before retrying.";
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
    this.assertViewPermissions(view);
    this.versions = view.versions;
    this.capabilities = view.capabilities;
    this.acknowledgedRevision = view.library.revision;
    await this.refreshDrafts();
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
  private assertViewPermissions(view: LibraryView, intended?: Library) {
    const retained = intended
      ? new Set(intended.songs.map((song) => song.id))
      : null;
    if (
      Object.entries(this.capabilities).some(
        ([id, role]) =>
          view.capabilities[id] !== role &&
          !(
            role === "owner" &&
            !Object.hasOwn(view.capabilities, id) &&
            retained &&
            !retained.has(id)
          ),
      )
    ) {
      this.lockAccess();
      this.assertAccess();
    }
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
  async whenProtected() {
    await Promise.all([
      this.whenSongProtected(),
      this.personal.whenProtected(),
    ]);
  }
  private async whenSongProtected() {
    for (;;) {
      const latest = this.lastPrepared;
      if (!latest) {
        if (this.protectionError !== null) throw this.protectionError;
        return;
      }
      try {
        await latest.write.retained;
      } catch (error) {
        if (latest === this.lastPrepared) throw error;
      }
      if (latest === this.lastPrepared) return;
    }
  }
  prepare(
    candidate: Library,
    intent?: "import",
    source?: ImportProvenance,
  ): PreparedLibrarySave {
    this.assertAccess();
    validateLibrary(candidate);
    if (navigator.onLine === false) {
      if (!this.offlineReady) {
        this.lockAccess();
        this.assertAccess();
      }
      this.offlineCache.admit(candidate, this.offline);
    }
    if (this.pendingRecovery)
      throw new Error(
        "Review and retry, copy, export, or explicitly remove your previous pending work before saving new changes.",
      );
    if (!this.key)
      throw new Error("Sign in again before saving private music.");
    const previous = this.lastPrepared;
    if (
      previous &&
      previous.intent === intent &&
      sameData(previous.source, source) &&
      sameData(previous.candidate, candidate)
    )
      return previous.write;
    let library: Library | null = structuredClone(candidate);
    source = source ? structuredClone(source) : undefined;
    const key = this.key,
      keyId = this.keyId;
    const sequence = ++this.sequence;
    this.protectionError = null;
    const generation = this.generation;
    const commandId = crypto.randomUUID();
    const slot = this.ownKey;
    const initialRevision = this.acknowledgedRevision;
    const initialVersions = { ...this.versions };
    let sent: string | null = null;
    let acknowledged: Library | null = null;
    const retain = async (
      expectedRevision: number,
      versions: Record<string, number>,
    ) => {
      if (sequence !== this.sequence || !library) return;
      const serialized = JSON.stringify({
        library,
        expectedRevision,
        versions,
        import: intent === "import",
        ...(source ? { source } : {}),
      });
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const cipher = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        new TextEncoder().encode(serialized),
      );
      if (sequence !== this.sequence) return;
      const persisted = await writePending(slot, {
        keyId,
        iv,
        cipher,
        commandId,
        formatVersion: 2,
        generation: sequence,
      });
      if (!persisted && sequence === this.sequence)
        throw new Error(
          "A newer protected draft exists. Reopen it before continuing.",
        );
      if (sequence === this.sequence) this.protectedSequence = sequence;
    };
    const retained = this.stageTail.then(() =>
      retain(initialRevision, initialVersions),
    );
    this.stageTail = retained.catch(() => undefined);
    void retained.catch(() => undefined);
    const write: PreparedLibrarySave = {
      retained,
      save: async (expectedRevision) => {
        await this.whenSongProtected();
        this.assertAccess(generation);
        if (acknowledged) return structuredClone(acknowledged);
        if (navigator.onLine === false) {
          if (intent === "import" && sequence === this.sequence) {
            this.reviewOwnDraft = true;
            await this.refreshDrafts();
          }
          throw new Error(
            "Your latest music is protected on this device but has no service acknowledgement. Reconnect and review it explicitly.",
          );
        }
        if (!sent && intent !== "import") {
          await new Promise((resolve) => setTimeout(resolve, 500));
          this.assertAccess(generation);
          if (sequence !== this.sequence) {
            const latest = this.lastPrepared;
            if (!latest || latest.write === write)
              throw new Error(
                "The latest draft could not be protected. Keep your pending work.",
              );
            library = null;
            return latest.write.save(expectedRevision);
          }
        }
        if (!library)
          throw new Error(
            "This draft has been replaced by protected newer work.",
          );
        if (!sent) {
          if (this.unconfirmed && this.unconfirmed !== write) {
            await this.unconfirmed.save(this.acknowledgedRevision);
            this.assertAccess(generation);
            expectedRevision = this.acknowledgedRevision;
          }
          const versions = { ...this.versions };
          if (sequence === this.sequence)
            await retain(expectedRevision, versions);
          sent = JSON.stringify({
            library,
            expectedRevision,
            versions,
            commandId,
            mode: "edit",
            recoveryKeyId: keyId,
            import: intent === "import",
            ...(source ? { source } : {}),
          } satisfies ApiCommitLibrary);
        }
        let saved: LibraryView;
        this.unconfirmed = write;
        try {
          saved = await this.request<LibraryView>("/api/library", {
            method: "PUT",
            body: sent,
          });
        } catch (error) {
          if (
            intent === "import" &&
            sequence === this.sequence &&
            !this.terminated
          ) {
            this.reviewOwnDraft = true;
            await this.refreshDrafts();
          }
          throw error;
        }
        this.assertAccess(generation);
        this.assertViewPermissions(saved, library);
        this.versions = saved.versions;
        this.capabilities = saved.capabilities;
        this.acknowledgedRevision = saved.library.revision;
        await removeStoredPending(slot, commandId);
        if (sequence === this.sequence) this.protectedSequence = 0;
        acknowledged = structuredClone(validateLibrary(saved.library));
        if (this.unconfirmed === write) this.unconfirmed = null;
        return structuredClone(acknowledged);
      },
    };
    this.lastPrepared = {
      candidate: library,
      intent,
      write,
      ...(source ? { source } : {}),
    };
    void retained.catch((error: unknown) => {
      if (sequence === this.sequence) {
        this.protectionError = error;
        if (this.lastPrepared?.write === write) this.lastPrepared = null;
      }
    });
    return write;
  }
  commit(
    candidate: Library,
    expectedRevision: number,
    intent?: "import",
    source?: ImportProvenance,
  ) {
    return this.prepare(candidate, intent, source).save(expectedRevision);
  }
  async verifyImported(acknowledged: Library, imported: Library) {
    const view = await this.request<LibraryView>("/api/library").catch(
      (cause: unknown) => {
        throw new Error(
          "The import was acknowledged, but its current authorized readback is unavailable. The original source is kept. Reload and compare before importing again.",
          { cause },
        );
      },
    );
    this.assertViewPermissions(view);
    const actual = validateLibrary(view.library);
    for (const song of imported.songs) {
      const expected = acknowledged.songs.find((entry) => entry.id === song.id);
      if (
        !expected ||
        view.capabilities[song.id] !== "owner" ||
        !sameData(
          actual.songs.find((entry) => entry.id === song.id),
          expected,
        )
      )
        throw new Error(
          "The import was acknowledged, but its current authorized readback could not be confirmed. The original source is kept. Reload and compare before importing again.",
        );
    }
    for (const repertoire of imported.repertoires)
      if (
        !sameData(
          actual.repertoires.find((entry) => entry.id === repertoire.id),
          repertoire,
        )
      )
        throw new Error(
          "The imported repertoire readback could not be confirmed. Keep the original source and compare before trying again.",
        );
  }
  private async pendingRecord() {
    const key = this.selected ?? this.ownKey;
    return { key, pending: await readPending(key) };
  }
  private async unlockPending() {
    this.assertAccess();
    const generation = this.generation;
    const { pending, key: slot } = await this.pendingRecord();
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
      source?: ImportProvenance;
    };
    this.assertAccess(generation);
    const library = validateLibrary(record.library);
    return { record: { ...record, library }, pending, slot };
  }
  async recoverPending(): Promise<Library> {
    return (await this.unlockPending()).record.library;
  }
  async discardPending() {
    const slot = this.selected ?? this.ownKey;
    await removeStoredPending(slot);
    if (JSON.stringify(slot) === JSON.stringify(this.ownKey)) {
      this.reviewOwnDraft = false;
      this.lastPrepared = null;
      this.protectionError = null;
    }
    await this.refreshDrafts();
    this.protectedSequence = 0;
  }
  async retryPending() {
    const { record, pending, slot } = await this.unlockPending();
    const saved = await this.request<LibraryView>("/api/library", {
      method: "PUT",
      body: JSON.stringify({
        ...record,
        commandId: pending.commandId,
        mode: "edit",
        recoveryKeyId: pending.keyId,
      } satisfies ApiCommitLibrary),
    });
    this.versions = saved.versions;
    this.capabilities = saved.capabilities;
    await removeStoredPending(slot, pending.commandId);
    if (JSON.stringify(slot) === JSON.stringify(this.ownKey)) {
      this.reviewOwnDraft = false;
      this.lastPrepared = null;
      this.protectedSequence = 0;
      this.protectionError = null;
    }
    this.acknowledgedRevision = saved.library.revision;
    await this.refreshDrafts();
    return validateLibrary(saved.library);
  }
  private async copyPlan(pending: PendingRecord, song: Song, slot: PendingKey) {
    const identities: Record<string, string> = Object.create(null) as Record<
      string,
      string
    >;
    copySongIdentities(song, (id) => (identities[id] ??= crypto.randomUUID()));
    const plan = { commandId: crypto.randomUUID(), identities };
    const db = await pendingDb();
    const tx = db.transaction("pending", "readwrite");
    void tx.done.catch(() => undefined);
    try {
      const current = (await tx.store.get(slot)) as PendingRecord | undefined;
      if (!current || current.commandId !== pending.commandId)
        throw new Error(
          "The pending record changed. Reopen its review before copying.",
        );
      const existing =
        current.copies && Object.hasOwn(current.copies, song.id)
          ? current.copies[song.id]
          : undefined;
      if (!existing) {
        current.copies = Object.fromEntries([
          ...Object.entries(current.copies ?? {}),
          [song.id, plan],
        ]);
        await tx.store.put(current, slot);
      }
      await tx.done;
      return existing ?? plan;
    } catch (error) {
      try {
        tx.abort();
      } catch {
        /* An already completed transaction stays unchanged. */
      }
      await tx.done.catch(() => undefined);
      throw error;
    } finally {
      db.close();
    }
  }
  async copyPendingSong(songId: string) {
    const { record, pending, slot } = await this.unlockPending();
    const source = record.library.songs.find((song) => song.id === songId);
    if (!source) throw new Error("This song is not in the protected draft.");
    const view = await this.request<LibraryView>("/api/library");
    if (
      Object.hasOwn(record.versions, songId) &&
      !Object.hasOwn(view.capabilities, songId)
    ) {
      // Deleted content needs a fresh owner-only read; a revoked grantee fails here.
      await this.request(`/api/songs/${encodeURIComponent(songId)}/history`);
    }
    const plan = await this.copyPlan(pending, source, slot);
    const ids = new Map(Object.entries(plan.identities));
    let copy = copySongIdentities(source, (id) => {
      const mapped = ids.get(id);
      if (!mapped)
        throw new Error(
          "The retained copy mapping is incomplete. Keep the protected draft.",
        );
      return mapped;
    });
    copy.title += " (Recovered copy)";
    const existing = view.library.songs.find((song) => song.id === copy.id);
    if (existing) {
      if (!isRichSong(copy) && isRichSong(existing) && existing.migration)
        copy = migrateSong(copy, existing.migration);
      if (view.capabilities[copy.id] !== "owner" || !sameData(existing, copy))
        throw new Error(
          "The saved recovery copy has newer changes. Review it before continuing; your original pending work is kept.",
        );
      return validateLibrary(view.library);
    }
    const library = validateLibrary({
      ...view.library,
      schemaVersion:
        isRichSong(copy) || view.library.schemaVersion === 2 ? 2 : 1,
      songs: [...view.library.songs, copy],
    });
    const saved = await this.request<LibraryView>("/api/library", {
      method: "PUT",
      body: JSON.stringify({
        library,
        expectedRevision: view.library.revision,
        versions: view.versions,
        commandId: plan.commandId,
        mode: "edit",
        import: true,
        recoveryKeyId: pending.keyId,
      } satisfies ApiCommitLibrary),
    });
    // Keep the original encrypted draft. Only its opaque copy mapping is added;
    // an unknown response can be reconciled by the same destination identity.
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
    this.unsubscribeOffline();
    this.offline.stop();
    this.offlineCache.clearMemory();
    this.personal.close();
    this.notationListeners.clear();
    this.key = null;
    this.keyId = "";
    this.lastPrepared = null;
    this.unconfirmed = null;
    this.drafts = [];
    this.selected = null;
    this.recoveryRetry = null;
    this.controller.abort();
    this.generation += 1;
    this.versions = {};
    this.capabilities = {};
    return Promise.resolve();
  }
}
