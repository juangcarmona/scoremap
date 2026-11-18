import type { HarmonyIdentity } from "../../shared/music/harmony";
import { harmonyIdentity } from "../../shared/music/harmony";
import { theoreticalHarmony } from "../../shared/music/theory";
import { formatChordSymbol, type Notation } from "../../shared/music/notation";
const names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
export function pitchClass(root: string): number {
  return theoreticalHarmony({ root, quality: "major" }).tones[0]!.pitchClass;
}
export function chordNotes(chord: HarmonyIdentity): number[] {
  return theoreticalHarmony(harmonyIdentity(chord)).tones.map(
    (tone) => tone.pitchClass,
  );
}
export function chordLabel(
  chord: HarmonyIdentity,
  notation?: Notation,
): string {
  return formatChordSymbol(harmonyIdentity(chord), notation);
}
export function spelledChordNotes(chord: HarmonyIdentity): string[] {
  return theoreticalHarmony(harmonyIdentity(chord)).tones.map(
    (tone) => tone.spelling,
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
    firstOctave < -1 ||
    firstOctave > 9 ||
    !Number.isInteger(octaves) ||
    octaves < 1 ||
    octaves > 3 ||
    firstOctave + octaves > 10
  )
    throw new Error("Unsupported keyboard octave range.");
  let whites = 0;
  return Array.from(
    { length: Math.min(12 * octaves, 128 - (firstOctave + 1) * 12) },
    (_, i) => {
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
    },
  );
}
