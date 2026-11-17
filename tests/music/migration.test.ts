import { describe, expect, it } from "vitest";
import legacy from "../fixtures/library-v1.json";
import expected from "../fixtures/library-v1-migrated.json";
import performed from "../fixtures/library-v2.json";
import { validateLibrary } from "../../src/features/library/domain";
import {
  planImportedMigration,
  occupiedIdentities,
} from "../../src/features/library/migrationPlanning";
import {
  copyBackupLibrary,
  exportBackup,
  importBackup,
} from "../../src/features/library/backup";
import { isRichSong, type RichSong } from "../../src/features/library/score";
function song() {
  const library = structuredClone(validateLibrary(performed));
  const song = library.songs[0]!;
  if (!isRichSong(song)) throw new Error("Expected rich fixture");
  return { library, song };
}
describe("Cross-language migration and backup contract", () => {
  it("matches the independently calculated SHA-256 mapping and complete approved legacy output", async () => {
    const source = validateLibrary(legacy);
    const original = structuredClone(source);
    expect(await planImportedMigration(source)).toEqual(expected);
    expect(source).toEqual(original);
    expect(await planImportedMigration(validateLibrary(expected))).toEqual(
      expected,
    );
  });
  it("retains every supported v2 field through export/import and remaps copies without changing performed music or external preset provenance", () => {
    const { library, song: original } = song();
    expect(importBackup(exportBackup(library))).toEqual(library);
    const copy = copyBackupLibrary(library);
    const copied = copy.songs[0] as RichSong;
    const beforeIds = occupiedIdentities(library);
    const afterIds = occupiedIdentities(copy);
    beforeIds.delete("preset-independent");
    afterIds.delete("preset-independent");
    expect([...beforeIds].some((id) => afterIds.has(id))).toBe(false);
    expect(
      copied.arrangements.map((a) =>
        a.parts.map((p) => p.events.map((e) => [e.pitch, e.start, e.duration])),
      ),
    ).toEqual(
      original.arrangements.map((a) =>
        a.parts.map((p) => p.events.map((e) => [e.pitch, e.start, e.duration])),
      ),
    );
    expect(copied.arrangements[0]!.voicings[0]!.sourcePreset).toEqual(
      original.arrangements[0]!.voicings[0]!.sourcePreset,
    );
    expect(copied.arrangements[0]!.bindings[1]!.eventIds).toEqual(
      copied.arrangements[0]!.parts[1]!.events.map((e) => e.id),
    );
    expect(copy.repertoires[0]!.songIds).toEqual([copied.id]);
    expect(library).toEqual(performed);
  });
  it("checks exact fractional timing, overlap, physical ranges, and ties across identified measures", () => {
    const { library, song: s } = song();
    const section = s.sections[0]!;
    const first = s.arrangements[0]!.parts[0]!.events[0]!;
    first.start = { n: 7, d: 2 };
    first.duration = { n: 1, d: 2 };
    const next = {
      ...structuredClone(first),
      id: "tied",
      measureId: section.measures[1]!.id,
      start: { n: 0, d: 1 },
      duration: { n: 1, d: 3 },
    };
    first.tieNextId = next.id;
    s.arrangements[0]!.parts[0]!.events.push(next);
    expect(validateLibrary(library)).toEqual(library);
    const invalid = structuredClone(library);
    (invalid.songs[0] as RichSong).arrangements[0]!.parts[0]!.events.at(
      -1,
    )!.start = { n: 1, d: 3 };
    expect(() => validateLibrary(invalid)).toThrow(/consecutive/);
    first.duration = { n: 2, d: 3 };
    expect(() => validateLibrary(library)).toThrow(/within/);
  });
  it.each([
    (s: RichSong) => {
      s.sections[0]!.chords[1]!.start = { n: 1, d: 2 };
    },
    (s: RichSong) => {
      s.sections[0]!.chords[0]!.start = {
        n: Number.MAX_SAFE_INTEGER + 1,
        d: 1,
      };
    },
    (s: RichSong) => {
      s.arrangements[0]!.bindings[1]!.eventIds = ["c2"];
    },
    (s: RichSong) => {
      s.arrangements[0]!.parts[0]!.events[0]!.pitch.spelling = "C\n";
    },
    (s: RichSong) => {
      s.sections[0]!.chords[0]!.root = "C\n";
    },
    (s: RichSong) => {
      s.arrangements[0]!.bindings[0]!.range = [50, 60];
    },
  ])(
    "refuses invalid rich content before it can replace durable data",
    (mutate) => {
      const { library, song: s } = song();
      mutate(s);
      expect(() => validateLibrary(library)).toThrow();
    },
  );
});
