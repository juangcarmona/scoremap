import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { selectImport } from "../../src/features/library/importSelection";
import {
  validateLibrary,
  type Library,
} from "../../src/features/library/domain";
import { copySongIdentities } from "../../src/features/library/identityCopy";
const rich = JSON.parse(
  readFileSync("tests/fixtures/library-v2.json", "utf8"),
) as Library;
function fixture() {
  const library = structuredClone(rich);
  const ids = new Map<string, string>();
  const second = copySongIdentities(library.songs[0]!, (id) => {
    if (!ids.has(id)) ids.set(id, `second-${id}`);
    return ids.get(id)!;
  });
  library.songs.push(second);
  library.repertoires = [
    {
      id: "selected-set",
      title: "Selected source set",
      songIds: library.songs.map((song) => song.id),
    },
  ];
  return validateLibrary(library);
}
describe("Complete bounded import selection", () => {
  it("selects complete rich songs and limits memberships without changing the source or their content", () => {
    const source = fixture(),
      original = structuredClone(source);
    const selected = selectImport(source, [source.songs[1]!.id], true, false);
    expect(selected.songs).toEqual([original.songs[1]]);
    expect(selected.repertoires).toEqual([
      { ...original.repertoires[0], songIds: [original.songs[1]!.id] },
    ]);
    expect(selected.revision).toBe(source.revision);
    expect(source).toEqual(original);
    expect(
      selectImport(source, [source.songs[1]!.id], false, false).repertoires,
    ).toEqual([]);
  });
  it("explicit copies remap selected owned graphs and memberships while preserving independent musical content", () => {
    const source = fixture();
    const original = structuredClone(source);
    const selected = selectImport(source, [source.songs[1]!.id], true, true);
    expect(selected.songs[0]!.id).not.toBe(source.songs[1]!.id);
    expect(selected.repertoires[0]!.songIds).toEqual([selected.songs[0]!.id]);
    expect(selected.songs[0]!.title).toBe(source.songs[1]!.title);
    expect(selected.songs[0]!.notes).toBe(source.songs[1]!.notes);
    expect(source).toEqual(original);
  });
  it("refuses empty, duplicate and unknown selections before producing any destination candidate", () => {
    const source = fixture(),
      original = structuredClone(source);
    for (const ids of [
      [],
      [source.songs[0]!.id, source.songs[0]!.id],
      ["missing"],
    ])
      expect(() => selectImport(source, ids, true, false)).toThrow();
    expect(source).toEqual(original);
  });
});
