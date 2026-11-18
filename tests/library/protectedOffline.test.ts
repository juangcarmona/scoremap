// @vitest-environment node
import { expect, it } from "vitest";
import { openDB } from "idb";
import {
  ProtectedOfflineCache,
  removeOfflineCopies,
  type OfflineEnvelope,
} from "../../src/features/library/protectedOffline";
import { OfflineAuthority } from "../../src/shared/auth/offlineLease";
import { emptyLibrary } from "../../src/features/library/domain";
import type { SessionInfo } from "../../src/shared/auth/session";
const key = () =>
  Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString("base64");
function fixture() {
  const principal = crypto.randomUUID(),
    now = Date.now();
  const song = {
    id: "S",
    title: "Synthetic private song",
    artist: "",
    notes: "Protected complete reminder",
    sections: [],
    references: [],
  };
  const view = {
    library: { ...emptyLibrary(), revision: 7, songs: [song] },
    versions: { S: 4 },
    capabilities: { S: "viewer" as const },
  };
  const envelope: OfflineEnvelope = {
    id: crypto.randomUUID(),
    principal,
    sessionId: crypto.randomUUID(),
    checkedAt: new Date(now).toISOString(),
    expiresAt: new Date(now + 60000).toISOString(),
    authorizationExpiresAt: new Date(now + 300000).toISOString(),
    configuredMinutes: 1,
    scope: {
      songs: { S: "viewer" },
      personal: true,
      createSongs: true,
      repertoires: true,
    },
    view,
    personal: {
      notation: { mode: "anglo", primary: "anglo", revision: 0 },
      presets: [],
      deviceConfigurations: [],
    },
    keys: {
      songs: { id: crypto.randomUUID(), key: key() },
      personal: { id: crypto.randomUUID(), key: key() },
    },
  };
  const identity: SessionInfo = {
    authenticated: true,
    principal,
    name: "Synthetic",
    sessionId: envelope.sessionId,
    checkedAt: envelope.checkedAt,
    expiresAt: envelope.authorizationExpiresAt,
    csrf: "synthetic",
  };
  return {
    principal,
    envelope,
    identity,
    cache: new ProtectedOfflineCache(principal),
  };
}
it("commits separate encrypted song/personal snapshots without usable keys, preserves full content and keeps restart locked", async () => {
  const f = fixture();
  await f.cache.protect(f.envelope);
  const db = await openDB("scoremap-protected-offline", 1);
  const keys = await db.getAllKeys("copies"),
    rows = await db.getAll("copies");
  db.close();
  const index = keys.findIndex(
    (key) => Array.isArray(key) && key[0] === f.principal,
  );
  const row = rows[index];
  expect(row.frames.songs.cipher).toBeInstanceOf(ArrayBuffer);
  expect(row.frames.personal.cipher).toBeInstanceOf(ArrayBuffer);
  expect(JSON.stringify(row)).not.toContain("Protected complete reminder");
  expect(JSON.stringify(row)).not.toContain(f.envelope.keys.songs.key);
  expect(JSON.stringify(row)).not.toContain(f.envelope.keys.personal.key);
  expect(f.cache.read("/api/library")).toEqual(f.envelope.view);
  expect(f.cache.read("/api/device-configurations")).toEqual([]);
  expect(() => f.cache.read("/api/songs/T/history")).toThrow(
    "fresh online authorization",
  );
  const restarted = new ProtectedOfflineCache(f.principal);
  expect(() => restarted.read("/api/library")).toThrow(
    "No protected offline copy",
  );
  f.cache.clearMemory();
  expect(() => f.cache.read("/api/library")).toThrow(
    "No protected offline copy",
  );
  await removeOfflineCopies(f.principal);
});
it("refuses viewer edits, offline deletion and incomplete scopes while preserving other principals' ciphertext", async () => {
  const f = fixture(),
    other = fixture();
  await f.cache.protect(f.envelope);
  await other.cache.protect(other.envelope);
  const authority = new OfflineAuthority();
  authority.activate(f.envelope, f.identity, {
    wall: Date.now(),
    elapsed: performance.now(),
  });
  const candidate = structuredClone(f.envelope.view.library);
  candidate.songs[0]!.notes = "Viewer mutation";
  expect(() => f.cache.admit(candidate, authority)).toThrow(
    "no current offline editing permission",
  );
  expect(() => f.cache.admit({ ...candidate, songs: [] }, authority)).toThrow(
    "fresh online owner authorization",
  );
  await expect(
    new ProtectedOfflineCache(f.principal).protect({
      ...f.envelope,
      scope: { ...f.envelope.scope, songs: { T: "owner" } },
    }),
  ).rejects.toThrow("scope");
  await removeOfflineCopies(f.principal);
  const db = await openDB("scoremap-protected-offline", 1);
  const keys = await db.getAllKeys("copies");
  db.close();
  expect(
    keys.some((key) => Array.isArray(key) && key[0] === other.principal),
  ).toBe(true);
  expect(keys.some((key) => Array.isArray(key) && key[0] === f.principal)).toBe(
    false,
  );
  authority.stop();
  f.cache.clearMemory();
  other.cache.clearMemory();
  await removeOfflineCopies(other.principal);
});
