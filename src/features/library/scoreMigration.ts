import type { LegacySong, Library } from "./domain";
import { requireValue } from "./validation";
import type { MigrationMapping, RichSong } from "./score";
export function migrationKeys(song: LegacySong) {
  const keys = ["arrangement", "part"];
  for (const section of song.sections) {
    for (
      let measure = 0;
      measure < Math.ceil(section.chords.length / 4);
      measure++
    )
      keys.push(`section/${section.id}/measure/${measure}`);
    for (let event = 0; event < section.chords.length; event++)
      keys.push(`section/${section.id}/event/${event}`);
  }
  return keys;
}
export function prepareSongMigration(
  song: LegacySong,
  newId: () => string,
): MigrationMapping {
  return {
    sourceVersion: 1,
    identities: Object.fromEntries(
      migrationKeys(song).map((key) => [key, newId()]),
    ),
  };
}
export function migrateSong(
  song: LegacySong,
  mapping: MigrationMapping,
): RichSong {
  const expected = migrationKeys(song);
  requireValue(
    mapping.sourceVersion === 1 &&
      Object.keys(mapping.identities).length === expected.length &&
      expected.every((key) => Object.hasOwn(mapping.identities, key)) &&
      new Set(Object.values(mapping.identities)).size === expected.length &&
      Object.values(mapping.identities).every(
        (id) => typeof id === "string" && id.trim(),
      ),
    "Migration needs the complete stable generated-identity mapping.",
  );
  const id = (key: string) => mapping.identities[key]!;
  return {
    ...structuredClone(song),
    schemaVersion: 2,
    migration: structuredClone(mapping),
    sections: song.sections.map((section) => ({
      ...structuredClone(section),
      measures: Array.from(
        { length: Math.ceil(section.chords.length / 4) },
        (_, index) => ({
          id: id(`section/${section.id}/measure/${index}`),
          meter: { numerator: 4, denominator: 4 },
          length: { n: 4, d: 1 },
        }),
      ),
      chords: section.chords.map((chord, index) => ({
        ...structuredClone(chord),
        id: id(`section/${section.id}/event/${index}`),
        measureId: id(`section/${section.id}/measure/${Math.floor(index / 4)}`),
        start: { n: index % 4, d: 1 },
        duration: { n: 1, d: 1 },
      })),
    })),
    arrangements: [
      {
        id: id("arrangement"),
        name: "Default arrangement",
        parts: [
          { id: id("part"), name: "Unassigned part", role: "", events: [] },
        ],
        devices: [],
        bindings: [],
        voicings: [],
      },
    ],
  };
}
export function migrateImportedLibrary(
  library: Library,
  newId: () => string,
): Library {
  return {
    ...structuredClone(library),
    schemaVersion: 2,
    songs: library.songs.map((song) =>
      "schemaVersion" in song
        ? structuredClone(song)
        : migrateSong(song, prepareSongMigration(song, newId)),
    ),
  };
}
