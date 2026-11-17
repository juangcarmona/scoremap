import { validateLibrary, type Library } from "./domain";
import { copyBackupLibrary } from "./backup";
import { requireValue } from "./validation";

export type ImportProvenance = {
  kind: "backup" | "anonymous";
  schemaVersion: 1 | 2;
  revision: number;
  songCount: number;
  repertoireCount: number;
  copied: boolean;
};
export function selectImport(
  source: Library,
  songIds: readonly string[],
  includeRepertoires: boolean,
  copied: boolean,
) {
  validateLibrary(source);
  const selected = new Set(songIds);
  requireValue(selected.size === songIds.length, "Select each song once.");
  requireValue(selected.size > 0, "Select at least one song to import.");
  requireValue(
    songIds.every((id) => source.songs.some((song) => song.id === id)),
    "A selected source song is unavailable. Reopen the import preview.",
  );
  const library = validateLibrary({
    ...structuredClone(source),
    songs: source.songs.filter((song) => selected.has(song.id)),
    repertoires: includeRepertoires
      ? source.repertoires
          .map((repertoire) => ({
            ...repertoire,
            songIds: repertoire.songIds.filter((id) => selected.has(id)),
          }))
          .filter((repertoire) => repertoire.songIds.length > 0)
      : [],
  });
  return copied ? copyBackupLibrary(library) : library;
}
