import { describe, expect, it } from "vitest";
import {
  assertHarmony,
  harmonyDegrees,
  type HarmonyIdentity,
} from "../../src/shared/music/harmony";
import {
  identifyHarmony,
  theoreticalHarmony,
} from "../../src/shared/music/theory";
import {
  harmonyCatalogue,
  type ChordQuality,
} from "../../src/shared/music/catalogue";
import { formatChordSymbol } from "../../src/shared/music/notation";
const cases: [HarmonyIdentity, string[], number[]][] = [
  [
    { root: "C", quality: "major-seventh" },
    ["C", "E", "G", "B"],
    [0, 4, 7, 11],
  ],
  [{ root: "F#", quality: "major" }, ["F#", "A#", "C#"], [6, 10, 1]],
  [{ root: "Gb", quality: "major" }, ["Gb", "Bb", "Db"], [6, 10, 1]],
  [{ root: "G", quality: "minor" }, ["G", "Bb", "D"], [7, 10, 2]],
  [
    { root: "D", quality: "dominant-seventh" },
    ["D", "F#", "A", "C"],
    [2, 6, 9, 0],
  ],
  [
    { root: "Bb", quality: "dominant-ninth" },
    ["Bb", "D", "F", "Ab", "C"],
    [10, 2, 5, 8, 0],
  ],
  [
    { root: "G", quality: "dominant-eleventh" },
    ["G", "B", "D", "F", "A", "C"],
    [7, 11, 2, 5, 9, 0],
  ],
  [{ root: "D", quality: "suspended-second" }, ["D", "E", "A"], [2, 4, 9]],
  [{ root: "A", quality: "suspended-fourth" }, ["A", "D", "E"], [9, 2, 4]],
  [{ root: "F#", quality: "diminished" }, ["F#", "A", "C"], [6, 9, 0]],
  [
    { root: "B", quality: "half-diminished-seventh" },
    ["B", "D", "F", "A"],
    [11, 2, 5, 9],
  ],
  [
    { root: "C", quality: "diminished-seventh" },
    ["C", "Eb", "Gb", "Bbb"],
    [0, 3, 6, 9],
  ],
  [
    { root: "C", quality: "dominant-thirteenth" },
    ["C", "E", "G", "Bb", "D", "F", "A"],
    [0, 4, 7, 10, 2, 5, 9],
  ],
  [
    { root: "C", quality: "dominant-seventh", alterations: ["b9", "#11"] },
    ["C", "E", "G", "Bb", "Db", "F#"],
    [0, 4, 7, 10, 1, 6],
  ],
];
describe("Finite product harmony over pinned provider primitives", () => {
  it.each(cases)(
    "derives independently specified %j without provider dictionary omissions",
    (identity, notes, pitchClasses) => {
      const before = structuredClone(identity);
      const actual = theoreticalHarmony(identity);
      expect(actual.tones.map((tone) => tone.spelling)).toEqual(notes);
      expect(actual.tones.map((tone) => tone.pitchClass)).toEqual(pitchClasses);
      expect(identity).toEqual(before);
    },
  );
  it("keeps every complete catalogue degree and replaces altered extension degrees once", () => {
    const semitones: Record<string, number> = {
      "1": 0,
      "2": 2,
      "3": 4,
      "4": 5,
      "5": 7,
      "6": 9,
      "7": 11,
      "9": 14,
      "11": 17,
      "13": 21,
    };
    for (const quality of Object.keys(harmonyCatalogue) as ChordQuality[]) {
      const expected = harmonyCatalogue[quality].degrees.map((degree) => {
        const [, accidental, number] = /^(bb|b|#)?(\d+)$/u.exec(degree)!;
        return (
          (semitones[number!]! +
            (accidental === "bb"
              ? -2
              : accidental === "b"
                ? -1
                : accidental === "#"
                  ? 1
                  : 0) +
            12) %
          12
        );
      });
      expect(
        theoreticalHarmony({ root: "C", quality }).tones.map(
          (tone) => tone.pitchClass,
        ),
      ).toEqual(expected);
    }
    expect(
      harmonyDegrees({
        root: "C",
        quality: "dominant-thirteenth",
        alterations: ["b9", "#11"],
      }),
    ).toEqual(["1", "3", "5", "b7", "b9", "#11", "13"]);
  });
  it("treats explicit non-chord slash bass separately from theoretical degrees", () => {
    const actual = theoreticalHarmony({
      root: "C",
      quality: "major-seventh",
      bass: "Db",
    });
    expect(actual.tones.map((tone) => tone.spelling)).toEqual([
      "C",
      "E",
      "G",
      "B",
    ]);
    expect(actual.bass).toEqual({ spelling: "Db", pitchClass: 1 });
    expect(
      formatChordSymbol(
        {
          root: "C",
          quality: "dominant-seventh",
          alterations: ["b9", "#11"],
          bass: "E",
        },
        { mode: "dual", primary: "latin" },
      ),
    ).toBe("Do7(♭9,♯11)/Mi (C7(♭9,♯11)/E)");
  });
  it("refuses unknown, contradictory, unowned and quality-incompatible harmonic fields", () => {
    for (const invalid of [
      { root: "C", quality: "unbounded-provider-type" },
      { root: "C", quality: "major", alterations: ["b9"] },
      { root: "C", quality: "dominant-seventh", alterations: ["b9", "#9"] },
      { root: "C", quality: "dominant-seventh", alterations: ["b5", "b5"] },
      { root: "C", quality: "major", owner: "forged" },
      { root: "C##", quality: "major" },
      Object.assign(Object.create({ bass: "E" }), {
        root: "C",
        quality: "major",
      }),
    ])
      expect(() => assertHarmony(invalid)).toThrow();
    expect(() =>
      formatChordSymbol({ root: "C", quality: "major", bass: "" }),
    ).toThrow();
  });
  it("returns explicit ambiguity or unknown without changing original performed spellings or register", () => {
    const played = ["C2", "E4", "G4", "A4"];
    const original = [...played];
    const candidates = identifyHarmony(played);
    expect(candidates).toContainEqual({
      identity: { root: "C", quality: "major-sixth" },
    });
    expect(candidates).toContainEqual({
      identity: { root: "A", quality: "minor-seventh" },
      detectedBass: "C",
    });
    expect(played).toEqual(original);
    expect(identifyHarmony(["C", "C#", "D", "F#"])).toEqual([]);
    expect(identifyHarmony([])).toEqual([]);
    expect(() => identifyHarmony(["H4"])).toThrow();
  });
  it("identifies the product's complete thirteenth including its required eleventh", () => {
    expect(
      identifyHarmony(["C", "E", "G", "Bb", "D", "F", "A"]),
    ).toContainEqual({
      identity: { root: "C", quality: "dominant-thirteenth" },
    });
  });
});
