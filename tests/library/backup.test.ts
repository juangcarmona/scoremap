import { describe, expect, it } from "vitest";
import { exportBackup, importBackup } from "../../src/features/library/backup";
import { applyCommand, emptyLibrary } from "../../src/features/library/domain";
function fixture() {
  let l = applyCommand(emptyLibrary(), "edit", {
    type: "createSong",
    id: "song",
    title: "Synthetic backup song",
  });
  l = applyCommand(l, "edit", {
    type: "createRepertoire",
    id: "rep",
    title: "Combo",
  });
  l = applyCommand(l, "edit", {
    type: "addMembership",
    songId: "song",
    repertoireId: "rep",
  });
  l = applyCommand(l, "edit", {
    type: "insertSection",
    songId: "song",
    id: "section",
    name: "Custom",
  });
  return applyCommand(l, "edit", {
    type: "updateSection",
    songId: "song",
    sectionId: "section",
    patch: {
      chords: [{ root: "F#", quality: "minor" }],
      notes: "Literal <personal> notes",
      repeat: 3,
    },
  });
}
describe("Complete validated backups", () => {
  it("SB-BACKUP-EXPORT SB-BACKUP-IMPORT: round trip preserves all identities and associations", () => {
    const l = fixture();
    expect(importBackup(exportBackup(l))).toEqual(l);
  });
  it("SB-BACKUP-IMPORT-EMPTY: valid empty data is intentional", () => {
    expect(importBackup(exportBackup(emptyLibrary())).songs).toEqual([]);
  });
  it.each([
    "{",
    "null",
    "[]",
    "{}",
    JSON.stringify({
      format: "scoremap-backup",
      version: 999,
      library: emptyLibrary(),
    }),
  ])("SB-BACKUP-REJECT: rejects malformed/unsupported envelope %s", (text) => {
    expect(() => importBackup(text)).toThrow();
  });
  it("SB-BACKUP-REJECT: duplicate identities and dangling membership are refused", () => {
    for (const mutate of [
      (l: ReturnType<typeof fixture>) =>
        l.songs.push(structuredClone(l.songs[0]!)),
      (l: ReturnType<typeof fixture>) =>
        l.repertoires[0]!.songIds.push("missing"),
      (l: ReturnType<typeof fixture>) => l.repertoires[0]!.songIds.push("song"),
    ]) {
      const l = fixture();
      mutate(l);
      expect(() =>
        importBackup(
          JSON.stringify({ format: "scoremap-backup", version: 1, library: l }),
        ),
      ).toThrow();
    }
  });
  it("SB-REFERENCE-INVALID SB-REFERENCE: only absolute web references enter a library", () => {
    const l = fixture();
    for (const url of ["javascript:alert(1)", "data:text/html,a", "/relative"])
      expect(() =>
        applyCommand(l, "edit", {
          type: "addReference",
          songId: "song",
          reference: { id: "ref", title: "Synthetic resource", url },
        }),
      ).toThrow();
    const next = applyCommand(l, "edit", {
      type: "addReference",
      songId: "song",
      reference: {
        id: "ref",
        title: "Synthetic resource",
        url: "https://example.com/resource",
      },
    });
    expect(importBackup(exportBackup(next)).songs[0]!.references[0]!.url).toBe(
      "https://example.com/resource",
    );
  });
});
