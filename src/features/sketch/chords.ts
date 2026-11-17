import { assertChord, type Chord } from "../../shared/music/chord";
const naturals: Record<string, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};
const names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
export function pitchClass(root: string): number {
  assertChord({ root, quality: "major" });
  return (
    (naturals[root[0]!]! +
      (root[1] === "#" ? 1 : root[1] === "b" ? -1 : 0) +
      12) %
    12
  );
}
export function chordNotes(chord: Chord): number[] {
  assertChord(chord);
  const root = pitchClass(chord.root);
  return [0, chord.quality === "major" ? 4 : 3, 7].map((n) => (root + n) % 12);
}
export function chordLabel(chord: Chord): string {
  assertChord(chord);
  return (
    chord.root.replace("b", "♭").replace("#", "♯") +
    (chord.quality === "minor" ? "m" : "")
  );
}
export type PianoKey = {
  midi: number;
  pitchClass: number;
  name: string;
  black: boolean;
  x: number;
  width: number;
};
export function pianoKeys(firstOctave = 3, octaves = 2): PianoKey[] {
  if (
    !Number.isInteger(firstOctave) ||
    firstOctave < 0 ||
    firstOctave > 7 ||
    !Number.isInteger(octaves) ||
    octaves < 1 ||
    octaves > 3 ||
    firstOctave + octaves > 10
  )
    throw new Error("Unsupported keyboard octave range.");
  let whites = 0;
  return Array.from({ length: 12 * octaves }, (_, i) => {
    const pc = i % 12;
    const black = [1, 3, 6, 8, 10].includes(pc);
    const x = black ? whites - 0.31 : whites++;
    return {
      midi: (firstOctave + 1) * 12 + i,
      pitchClass: pc,
      name: `${names[pc]}${firstOctave + Math.floor(i / 12)}`,
      black,
      x,
      width: black ? 0.62 : 1,
    };
  });
}
