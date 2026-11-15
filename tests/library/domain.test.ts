import { describe, expect, it } from "vitest";
import {
  applyCommand,
  emptyLibrary,
  validateLibrary,
  type Command,
  type Library,
} from "../../src/features/library/domain";
const run = (l: Library, c: Command) => applyCommand(l, "edit", c);
function fixture() {
  let l = emptyLibrary();
  l = run(l, { type: "createSong", id: "song-a", title: "Synthetic sketch A" });
  l = run(l, { type: "createSong", id: "song-b", title: "Synthetic sketch B" });
  l = run(l, { type: "createRepertoire", id: "rep", title: "Pintatónica" });
  return run(l, {
    type: "addMembership",
    songId: "song-a",
    repertoireId: "rep",
  });
}
describe("Personal library commands", () => {
  it("SB-SONG-CREATE SB-SONG-ADD SB-REPERTOIRE-CREATE SB-MEMBERSHIP-ADD: creates independent identities without invented content", () => {
    const l = fixture();
    expect(l.songs).toHaveLength(2);
    expect(l.songs[0]?.sections).toEqual([]);
    expect(l.repertoires[0]?.songIds).toEqual(["song-a"]);
  });
  it("SB-SONG-EDIT SB-REPERTOIRE-RENAME: metadata edits retain identity and membership", () => {
    let l = fixture();
    l = run(l, {
      type: "updateSong",
      songId: "song-a",
      patch: { title: "New title", artist: "Synthetic artist" },
    });
    l = run(l, {
      type: "renameRepertoire",
      repertoireId: "rep",
      title: "Combo",
    });
    expect(l.songs[0]).toMatchObject({
      id: "song-a",
      title: "New title",
      artist: "Synthetic artist",
    });
    expect(l.repertoires[0]).toMatchObject({
      id: "rep",
      title: "Combo",
      songIds: ["song-a"],
    });
  });
  it("SB-REPERTOIRE-DELETE: repertoire deletion preserves complete songs", () => {
    const l = fixture();
    const next = run(l, { type: "deleteRepertoire", repertoireId: "rep" });
    expect(next.songs).toEqual(l.songs);
    expect(next.repertoires).toEqual([]);
    expect(l.repertoires).toHaveLength(1);
  });
  it("SB-MEMBERSHIP-REMOVE SB-MEMBERSHIP-DUPLICATE: membership is independent and unique", () => {
    const l = fixture();
    expect(() =>
      run(l, { type: "addMembership", songId: "song-a", repertoireId: "rep" }),
    ).toThrow(/already/);
    const next = run(l, {
      type: "removeMembership",
      songId: "song-a",
      repertoireId: "rep",
    });
    expect(next.songs).toEqual(l.songs);
    expect(next.repertoires[0]?.songIds).toEqual([]);
  });
  it("SB-SONG-DELETE SB-SONG-DELETE-LAST: deleting songs removes memberships, retaining repertoire", () => {
    let l = fixture();
    l = run(l, { type: "deleteSong", songId: "song-a" });
    expect(l.songs.map((s) => s.id)).toEqual(["song-b"]);
    expect(l.repertoires[0]?.songIds).toEqual([]);
    l = run(l, { type: "deleteSong", songId: "song-b" });
    expect(l.songs).toEqual([]);
    expect(l.repertoires).toHaveLength(1);
  });
  it("SB-BLANK-NAME SB-MISSING-IDENTITY: refuses invalid targets and titles without changing input", () => {
    const l = fixture();
    const before = structuredClone(l);
    expect(() =>
      run(l, { type: "createSong", id: "blank", title: "  " }),
    ).toThrow(/required/);
    expect(() =>
      run(l, { type: "updateSong", songId: "absent", patch: { title: "A" } }),
    ).toThrow(/no longer/);
    expect(l).toEqual(before);
  });
});
describe("Stable song structure", () => {
  function arranged() {
    let l = fixture();
    l = run(l, {
      type: "insertSection",
      songId: "song-a",
      id: "intro",
      name: "Intro",
    });
    l = run(l, {
      type: "insertSection",
      songId: "song-a",
      id: "custom",
      name: "Custom section",
    });
    return run(l, {
      type: "updateSection",
      songId: "song-a",
      sectionId: "intro",
      patch: {
        chords: [{ root: "Db", quality: "minor" }],
        notes: "Synthetic reminder",
        repeat: 3,
      },
    });
  }
  it("SB-SECTION-FIRST SB-SECTION-INSERT SB-SECTION-MODIFY SB-SECTION-REORDER: reorder preserves all associated data", () => {
    const l = arranged();
    const before = structuredClone(l.songs[0]!.sections);
    const next = run(l, {
      type: "reorderSections",
      songId: "song-a",
      order: ["custom", "intro"],
    });
    expect(next.songs[0]!.sections).toEqual([before[1], before[0]]);
    expect(l.songs[0]!.sections).toEqual(before);
  });
  it("SB-SECTION-REMOVE SB-SECTION-REMOVE-LAST: removes only the selected owner and allows an empty song", () => {
    let l = arranged();
    const keep = structuredClone(l.songs[0]!.sections[0]);
    l = run(l, {
      type: "removeSection",
      songId: "song-a",
      sectionId: "custom",
    });
    expect(l.songs[0]!.sections).toEqual([keep]);
    l = run(l, { type: "removeSection", songId: "song-a", sectionId: "intro" });
    expect(l.songs[0]!.sections).toEqual([]);
  });
  it.each([["intro", "intro"], ["intro"], ["intro", "missing"]])(
    "SB-SECTION-INVALID-ORDER: rejects invalid permutation %j",
    (...order) => {
      const l = arranged();
      expect(() =>
        run(l, { type: "reorderSections", songId: "song-a", order }),
      ).toThrow(/exactly once/);
    },
  );
  it.each([0, -1, 100, 1.5, NaN])(
    "SB-SECTION-REPEAT-BOUNDARY: rejects count %s",
    (repeat) => {
      const l = arranged();
      expect(() =>
        run(l, {
          type: "updateSection",
          songId: "song-a",
          sectionId: "intro",
          patch: { repeat },
        }),
      ).toThrow(/1 to 99/);
    },
  );
  it.each([1, 99])("SB-SECTION-MODIFY: accepts count boundary %s", (repeat) => {
    expect(
      run(arranged(), {
        type: "updateSection",
        songId: "song-a",
        sectionId: "intro",
        patch: { repeat },
      }).songs[0]!.sections[0]!.repeat,
    ).toBe(repeat);
  });
  it("SB-ANNOTATIONS: notes stay with owners through edits and reorder", () => {
    let l = arranged();
    l = run(l, {
      type: "updateSong",
      songId: "song-a",
      patch: { notes: "<personal reminder>" },
    });
    l = run(l, {
      type: "reorderSections",
      songId: "song-a",
      order: ["custom", "intro"],
    });
    expect(l.songs[0]!.notes).toBe("<personal reminder>");
    expect(l.songs[0]!.sections[1]!.notes).toBe("Synthetic reminder");
  });
  it("SB-PERFORMANCE-REJECT: every content command refuses a direct performance call", () => {
    const l = arranged();
    const commands: Command[] = [
      { type: "createSong", id: "x", title: "X" },
      { type: "deleteSong", songId: "song-a" },
      { type: "createRepertoire", id: "x", title: "X" },
      { type: "deleteRepertoire", repertoireId: "rep" },
      { type: "addMembership", songId: "song-b", repertoireId: "rep" },
      { type: "removeMembership", songId: "song-a", repertoireId: "rep" },
      { type: "updateSong", songId: "song-a", patch: { notes: "Accidental" } },
      { type: "insertSection", songId: "song-a", id: "x", name: "X" },
      { type: "removeSection", songId: "song-a", sectionId: "intro" },
      { type: "reorderSections", songId: "song-a", order: ["custom", "intro"] },
      {
        type: "updateSection",
        songId: "song-a",
        sectionId: "intro",
        patch: { chords: [{ root: "C", quality: "major" }] },
      },
      {
        type: "addReference",
        songId: "song-a",
        reference: { id: "url", title: "X", url: "https://example.com" },
      },
      { type: "removePdf", songId: "song-a" },
    ];
    for (const c of commands)
      expect(() => applyCommand(l, "performance", c)).toThrow(
        /Performance mode/,
      );
  });
  it("SB-CHORD-INVALID: rejects invalid root, quality and unexpected fields", () => {
    for (const chord of [
      { root: "H", quality: "major" },
      { root: "C", quality: "seventh" },
      { root: "C##", quality: "minor" },
    ]) {
      const l = arranged();
      const bad = structuredClone(l);
      bad.songs[0]!.sections[0]!.chords = [chord as never];
      expect(() => validateLibrary(bad)).toThrow();
    }
  });
});
it("LC-STRUCTURE boundary: zero/one section cannot perform a reorder transition", () => {
  const empty = applyCommand(emptyLibrary(), "edit", {
    type: "createSong",
    id: "single",
    title: "Synthetic",
  });
  expect(() =>
    applyCommand(empty, "edit", {
      type: "reorderSections",
      songId: "single",
      order: [],
    }),
  ).toThrow(/two sections/);
  const one = applyCommand(empty, "edit", {
    type: "insertSection",
    songId: "single",
    id: "only",
    name: "Only",
  });
  expect(() =>
    applyCommand(one, "edit", {
      type: "reorderSections",
      songId: "single",
      order: ["only"],
    }),
  ).toThrow(/two sections/);
});
it("SB-CHORD-ASSIGN SB-CHORD-MODIFY: an ordered section sequence keeps its owner and unrelated chord entries", () => {
  let l = applyCommand(emptyLibrary(), "edit", {
    type: "createSong",
    id: "s",
    title: "Synthetic chords",
  });
  l = applyCommand(l, "edit", {
    type: "insertSection",
    songId: "s",
    id: "sec",
    name: "Verse",
  });
  const chords = [
    { root: "C", quality: "major" as const },
    { root: "Db", quality: "minor" as const },
    { root: "F#", quality: "major" as const },
  ];
  l = applyCommand(l, "edit", {
    type: "updateSection",
    songId: "s",
    sectionId: "sec",
    patch: { chords },
  });
  expect(l.songs[0]!.sections[0]!.chords).toEqual(chords);
  const modified = [
    chords[0]!,
    { root: "Db", quality: "major" as const },
    chords[2]!,
  ];
  const next = applyCommand(l, "edit", {
    type: "updateSection",
    songId: "s",
    sectionId: "sec",
    patch: { chords: modified },
  });
  expect(next.songs[0]!.sections[0]!.id).toBe("sec");
  expect(next.songs[0]!.sections[0]!.chords).toEqual(modified);
  expect(l.songs[0]!.sections[0]!.chords).toEqual(chords);
});
