import { describe, expect, it } from "vitest";
import {
  defaultNotation,
  formatChordSymbol,
  formatNote,
  validNotation,
  type Notation,
} from "../../src/shared/music/notation";
import { spelledChordNotes } from "../../src/features/sketch/chords";
const latin: Notation = { mode: "latin", primary: "latin" };
const dualLatin: Notation = { mode: "dual", primary: "latin" };
const dualAnglo: Notation = { mode: "dual", primary: "anglo" };
describe("Spelling-preserving presentation", () => {
  it.each([
    ["C", "Do"],
    ["D", "Re"],
    ["E", "Mi"],
    ["F", "Fa"],
    ["G", "Sol"],
    ["A", "La"],
    ["B", "Si"],
  ])("formats %s as %s without storing translated data", (source, expected) => {
    expect(formatNote(source!, latin)).toBe(expected);
    expect(formatNote(source!, dualLatin)).toBe(`${expected} (${source})`);
    expect(formatNote(source!, dualAnglo)).toBe(`${source} (${expected})`);
    expect(formatNote(source!)).toBe(source);
  });
  it("preserves accidental spelling, absolute octave labels and dual primary", () => {
    expect(formatNote("Db3", dualLatin)).toBe("Re♭3 (D♭3)");
    expect(formatNote("C#3", dualLatin)).toBe("Do♯3 (C♯3)");
    expect(formatNote("Bbb-1", latin)).toBe("Si♭♭-1");
    expect(formatNote("F##4", dualAnglo)).toBe("F♯♯4 (Fa♯♯4)");
    expect(formatNote("Db", latin, true)).toBe("Reb");
    expect(() => formatNote("H4", latin)).toThrow();
    expect(() => formatNote("C#b4", latin)).toThrow();
  });
  it("formats complete extended/slash symbols in each notation without mutating the source", () => {
    const chord = { root: "C", quality: "major-seventh", bass: "E" };
    const original = structuredClone(chord);
    expect(formatChordSymbol(chord)).toBe("Cmaj7/E");
    expect(formatChordSymbol(chord, latin)).toBe("Domaj7/Mi");
    expect(formatChordSymbol(chord, dualAnglo)).toBe("Cmaj7/E (Domaj7/Mi)");
    expect(formatChordSymbol(chord, dualLatin)).toBe("Domaj7/Mi (Cmaj7/E)");
    expect(chord).toEqual(original);
    expect(
      formatChordSymbol({ root: "F#", quality: "suspended-fourth" }, latin),
    ).toBe("Fa♯sus4");
    expect(
      formatChordSymbol(
        { root: "Bb", quality: "diminished-seventh" },
        dualLatin,
      ),
    ).toBe("Si♭dim7 (B♭dim7)");
    expect(() =>
      formatChordSymbol({ root: "C", quality: "unknown" }),
    ).toThrow();
    expect(() =>
      formatChordSymbol({ root: "C", quality: "toString" }),
    ).toThrow();
  });
  it("validates finite preferences and refuses inherited or contradictory settings", () => {
    expect(validNotation(defaultNotation)).toBe(true);
    expect(validNotation(latin)).toBe(true);
    expect(validNotation(dualLatin)).toBe(true);
    for (const invalid of [
      null,
      [],
      "latin",
      { mode: "latin", primary: "anglo" },
      { mode: "other", primary: "latin" },
      { mode: "dual", primary: "other" },
      { ...latin, owner: "other" },
      Object.create(defaultNotation),
    ])
      expect(validNotation(invalid)).toBe(false);
  });
  it("derives existing triad spellings independently of physical-key enharmonic names", () => {
    expect(spelledChordNotes({ root: "Db", quality: "major" })).toEqual([
      "Db",
      "F",
      "Ab",
    ]);
    expect(spelledChordNotes({ root: "C#", quality: "minor" })).toEqual([
      "C#",
      "E",
      "G#",
    ]);
    expect(spelledChordNotes({ root: "F#", quality: "major" })).toEqual([
      "F#",
      "A#",
      "C#",
    ]);
    expect(spelledChordNotes({ root: "Gb", quality: "major" })).toEqual([
      "Gb",
      "Bb",
      "Db",
    ]);
    expect(spelledChordNotes({ root: "B#", quality: "major" })).toEqual([
      "B#",
      "D##",
      "F##",
    ]);
    expect(spelledChordNotes({ root: "Cb", quality: "minor" })).toEqual([
      "Cb",
      "Ebb",
      "Gb",
    ]);
  });
});
