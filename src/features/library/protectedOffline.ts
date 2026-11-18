import { openDB } from "idb";
import { validateLibrary, type Library } from "./domain";
import { savedPreset } from "./presetStorage";
import type { SavedPreset } from "./voicingPresets";
import {
  savedDeviceConfiguration,
  type SavedDeviceConfiguration,
} from "./deviceConfigurations";
import {
  notationSettings,
  type NotationSettings,
} from "../../shared/music/notation";
import { requireValue, sameData } from "./validation";
import type {
  OfflineLeaseInfo,
  OfflineAuthority,
} from "../../shared/auth/offlineLease";
export interface OfflineEnvelope extends OfflineLeaseInfo {
  view: {
    library: Library;
    versions: Record<string, number>;
    capabilities: Record<string, "owner" | "editor" | "viewer">;
  };
  personal: {
    notation: NotationSettings;
    presets: SavedPreset[];
    deviceConfigurations: SavedDeviceConfiguration[];
  };
  keys: {
    songs: { id: string; key: string };
    personal: { id: string; key: string };
  };
}
const database = () =>
  openDB("scoremap-protected-offline", 1, {
    upgrade(db) {
      db.createObjectStore("copies");
    },
  });
export async function removeOfflineCopies(principal: string) {
  const db = await database();
  try {
    const tx = db.transaction("copies", "readwrite");
    let cursor = await tx.store.openCursor();
    while (cursor) {
      if (Array.isArray(cursor.key) && cursor.key[0] === principal)
        await cursor.delete();
      cursor = await cursor.continue();
    }
    await tx.done;
  } finally {
    db.close();
  }
}
export class ProtectedOfflineCache {
  private readonly context = crypto.randomUUID();
  private generation = 0;
  private snapshot: Pick<OfflineEnvelope, "view" | "personal"> | null = null;
  constructor(readonly principal: string) {}
  private check(generation: number) {
    if (generation !== this.generation)
      throw new Error("The offline preparation was closed before activation.");
  }
  async protect(envelope: OfflineEnvelope) {
    const generation = this.generation;
    requireValue(
      envelope.principal === this.principal,
      "This offline copy belongs to another principal.",
    );
    const library = validateLibrary(envelope.view.library);
    requireValue(
      sameData(envelope.view.capabilities, envelope.scope.songs) &&
        Object.keys(envelope.view.capabilities).length ===
          library.songs.length &&
        Object.keys(envelope.view.versions).length === library.songs.length &&
        library.songs.every(
          (song) =>
            Object.hasOwn(envelope.view.capabilities, song.id) &&
            Number.isSafeInteger(envelope.view.versions[song.id]) &&
            envelope.view.versions[song.id]! > 0,
        ),
      "The offline resource scope does not cover the complete selected songs.",
    );
    notationSettings(envelope.personal.notation);
    requireValue(
      Array.isArray(envelope.personal.presets) &&
        Array.isArray(envelope.personal.deviceConfigurations),
      "Invalid personal offline snapshot.",
    );
    envelope.personal.presets.forEach(savedPreset);
    envelope.personal.deviceConfigurations.forEach(savedDeviceConfiguration);
    const frames: Record<
      string,
      { keyId: string; iv: Uint8Array; cipher: ArrayBuffer }
    > = {};
    for (const purpose of ["songs", "personal"] as const) {
      const material = envelope.keys[purpose];
      requireValue(
        typeof material.id === "string" && material.id.length > 0,
        "The offline copy has no protected recovery key.",
      );
      const key = await crypto.subtle.importKey(
        "raw",
        Uint8Array.from(atob(material.key), (letter) => letter.charCodeAt(0)),
        "AES-GCM",
        false,
        ["encrypt"],
      );
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const payload = purpose === "songs" ? envelope.view : envelope.personal;
      const cipher = await crypto.subtle.encrypt(
        {
          name: "AES-GCM",
          iv,
          additionalData: new TextEncoder().encode(
            JSON.stringify([
              this.principal,
              this.context,
              envelope.id,
              envelope.sessionId,
              purpose,
            ]),
          ),
        },
        key,
        new TextEncoder().encode(JSON.stringify(payload)),
      );
      this.check(generation);
      frames[purpose] = { keyId: material.id, iv, cipher };
    }
    const info: OfflineLeaseInfo = {
      id: envelope.id,
      principal: envelope.principal,
      sessionId: envelope.sessionId,
      checkedAt: envelope.checkedAt,
      expiresAt: envelope.expiresAt,
      authorizationExpiresAt: envelope.authorizationExpiresAt,
      configuredMinutes: envelope.configuredMinutes,
      scope: structuredClone(envelope.scope),
    };
    const db = await database();
    try {
      this.check(generation);
      const tx = db.transaction("copies", "readwrite");
      void tx.done.catch(() => undefined);
      try {
        await tx.store.put({ formatVersion: 1, info, frames }, [
          this.principal,
          this.context,
        ]);
        await tx.done;
      } catch (error) {
        await tx.done.catch(() => undefined);
        throw error;
      }
      this.check(generation);
      this.snapshot = structuredClone({
        view: envelope.view,
        personal: envelope.personal,
      });
    } finally {
      db.close();
    }
  }
  read(path: string): unknown {
    const snapshot = this.snapshot;
    requireValue(
      snapshot !== null,
      "No protected offline copy is active. Check online again.",
    );
    if (path === "/api/library") return structuredClone(snapshot.view);
    if (path === "/api/preferences/notation")
      return structuredClone(snapshot.personal.notation);
    if (path === "/api/voicing-presets")
      return structuredClone(snapshot.personal.presets);
    if (path === "/api/device-configurations")
      return structuredClone(snapshot.personal.deviceConfigurations);
    throw new Error(
      "This operation requires fresh online authorization. Your protected work is kept.",
    );
  }
  admit(candidate: Library, authority: OfflineAuthority) {
    const baseline = this.snapshot?.view.library,
      info = authority.info;
    requireValue(
      baseline && info,
      "Offline authorization is no longer available.",
    );
    const originals = new Map(baseline.songs.map((song) => [song.id, song]));
    requireValue(
      baseline.songs.every((song) =>
        candidate.songs.some((retained) => retained.id === song.id),
      ),
      "Deleting private music requires fresh online owner authorization.",
    );
    for (const song of candidate.songs) {
      const before = originals.get(song.id);
      requireValue(
        before
          ? sameData(before, song) || authority.allowsSong(song.id, true)
          : info.scope.createSongs,
        "This song has no current offline editing permission.",
      );
    }
    requireValue(
      sameData(baseline.repertoires, candidate.repertoires) ||
        info.scope.repertoires,
      "Repertoire changes are outside this offline authorization.",
    );
  }
  clearMemory() {
    this.generation++;
    this.snapshot = null;
  }
}
