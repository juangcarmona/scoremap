import type { LegacySong, Library } from "./domain";
import { migrationKeys, migrateSong } from "./scoreMigration";
import { isRichSong, type MigrationMapping } from "./score";
export function occupiedIdentities(value: unknown): Set<string> {
  const ids = new Set<string>();
  function visit(value: unknown) {
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    for (const [key, child] of Object.entries(value)) {
      if (key === "id" && typeof child === "string") ids.add(child);
      else visit(child);
    }
  }
  visit(value);
  return ids;
}
export async function planSongMigration(
  song: LegacySong,
  occupied: Set<string>,
): Promise<MigrationMapping> {
  const identities: Record<string, string> = {};
  for (const key of migrationKeys(song)) {
    let counter = 0;
    let id: string;
    do {
      const input = `scoremap-v1\0${song.id.length}:${song.id}\0${key}\0${counter++}`;
      const bytes = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(input),
      );
      id =
        "sm-" +
        [...new Uint8Array(bytes)]
          .map((byte) => byte.toString(16).padStart(2, "0"))
          .join("");
    } while (occupied.has(id));
    occupied.add(id);
    identities[key] = id;
  }
  return { sourceVersion: 1, identities };
}
export async function planImportedMigration(
  library: Library,
): Promise<Library> {
  const result = structuredClone(library);
  const occupied = occupiedIdentities(result);
  for (let i = 0; i < result.songs.length; i++) {
    const song = result.songs[i]!;
    if (!isRichSong(song))
      result.songs[i] = migrateSong(
        song,
        await planSongMigration(song, occupied),
      );
  }
  result.schemaVersion = 2;
  return result;
}
