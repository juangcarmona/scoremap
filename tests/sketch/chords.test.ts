import { describe, expect, it } from "vitest";
import {
  chordLabel,
  chordNotes,
  pianoKeys,
  pitchClass,
} from "../../src/features/sketch/chords";
describe("Deterministic musical relationships", () => {
  const expected: Record<string, number> = {
    C: 0,
    "C#": 1,
    Db: 1,
    D: 2,
    "D#": 3,
    Eb: 3,
    E: 4,
    Fb: 4,
    "E#": 5,
    F: 5,
    "F#": 6,
    Gb: 6,
    G: 7,
    "G#": 8,
    Ab: 8,
    A: 9,
    "A#": 10,
    Bb: 10,
    B: 11,
    Cb: 11,
    "B#": 0,
  };
  for (const [root, pc] of Object.entries(expected))
    it(`SB-CHORD-ASSIGN SB-CHORD-MODIFY: ${root} major/minor retain correct intervals and spelling`, () => {
      expect(pitchClass(root)).toBe(pc);
      expect(chordNotes({ root, quality: "major" })).toEqual([
        pc,
        (pc + 4) % 12,
        (pc + 7) % 12,
      ]);
      expect(chordNotes({ root, quality: "minor" })).toEqual([
        pc,
        (pc + 3) % 12,
        (pc + 7) % 12,
      ]);
      expect(chordLabel({ root, quality: "minor" })).toBe(
        root.replace("b", "♭").replace("#", "♯") + "m",
      );
    });
  it.each(["H", "c", "C##", "Dbb", "", " C"])(
    "SB-CHORD-INVALID: rejects root %j",
    (root) => {
      expect(() => pitchClass(root)).toThrow();
    },
  );
  it("SB-KEYBOARD: real white/black geometry and MIDI octave relationships", () => {
    const keys = pianoKeys();
    expect(keys).toHaveLength(24);
    expect(keys.filter((k) => !k.black).map((k) => k.x)).toEqual(
      Array.from({ length: 14 }, (_, i) => i),
    );
    expect(keys.filter((k) => k.black).map((k) => k.x)).toEqual([
      0.69, 1.69, 3.69, 4.69, 5.69, 7.69, 8.69, 10.69, 11.69, 12.69,
    ]);
    expect(keys.map((k) => k.midi)).toEqual(
      Array.from({ length: 24 }, (_, i) => i + 48),
    );
    expect(keys.find((k) => k.midi === 60)?.name).toBe("C4");
    expect(keys.filter((k) => k.black).map((k) => k.pitchClass)).toEqual([
      1, 3, 6, 8, 10, 1, 3, 6, 8, 10,
    ]);
  });
  it("SB-KEYBOARD: notes wrap pitch class, never octave labels", () => {
    expect(chordNotes({ root: "B", quality: "major" })).toEqual([11, 3, 6]);
    expect(pianoKeys(2, 1)[0]).toMatchObject({ midi: 36, name: "C2" });
    expect(() => pianoKeys(-1)).toThrow();
  });
});

it("Chord boundaries reject inherited or unexpected fields", async () => {
  const { assertChord } = await import("../../src/shared/music/chord");
  const inherited = Object.assign(Object.create({ root: "C" }), {
    quality: "major",
    unexpected: "field",
  });
  expect(() => assertChord(inherited)).toThrow(
    "Missing or unexpected data fields.",
  );
});
