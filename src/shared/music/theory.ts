import * as Note from "@tonaljs/note";
import * as ChordType from "@tonaljs/chord-type";
import { detect } from "@tonaljs/chord-detect";
import { harmonyCatalogue, type ChordQuality } from "./catalogue";
import {
  assertHarmony,
  harmonyDegrees,
  type Alteration,
  type HarmonyIdentity,
} from "./harmony";

function interval(degree: string) {
  const parsed = /^(bb|b|#)?(\d+)$/u.exec(degree);
  if (!parsed) throw new Error("Unsupported catalogue degree.");
  const [, accidental, value] = parsed;
  const perfect = [1, 4, 5, 11].includes(Number(value));
  return (
    value! +
    (accidental === "bb"
      ? "d"
      : accidental === "b"
        ? perfect
          ? "d"
          : "m"
        : accidental === "#"
          ? "A"
          : perfect
            ? "P"
            : "M")
  );
}
export function theoreticalHarmony(identity: HarmonyIdentity) {
  assertHarmony(identity);
  const degrees = harmonyDegrees(identity);
  const tones = degrees.map((degree) => {
    const spelling = Note.transpose(identity.root, interval(degree));
    const pitchClass = Note.chroma(spelling);
    if (!spelling || pitchClass === undefined)
      throw new Error("The accepted harmony could not be derived.");
    return { degree, spelling, pitchClass };
  });
  return {
    tones,
    ...(identity.bass
      ? {
          bass: {
            spelling: identity.bass,
            pitchClass: Note.chroma(identity.bass)!,
          },
        }
      : {}),
  };
}
export function performedPitchAt(midi: number, spelling?: string) {
  if (!Number.isInteger(midi) || midi < 0 || midi > 127)
    throw new Error("Performed pitch is outside C-1 through G9.");
  spelling ??= Note.get(Note.fromMidi(midi)).pc;
  const reference = Note.midi(spelling + "4");
  if (reference === null || !Number.isInteger((midi - reference) / 12))
    throw new Error("The selected spelling does not match this key.");
  return { spelling, octave: 4 + (midi - reference) / 12, midi };
}
type CandidateDefinition = { quality: ChordQuality; alterations: Alteration[] };
const candidates = new Map<string, CandidateDefinition>();
for (const quality of Object.keys(harmonyCatalogue) as ChordQuality[]) {
  let combinations: Alteration[][] = [[]];
  if (quality.startsWith("dominant-")) {
    for (const choices of [
      ["b5", "#5"],
      ["b9", "#9"],
      ["#11"],
      ["b13"],
    ] as Alteration[][])
      combinations = combinations.flatMap((current) => [
        current,
        ...choices.map((choice) => [...current, choice]),
      ]);
  }
  for (const alterations of combinations) {
    const alias = `scoremapq${candidates.size}`;
    const intervals = harmonyDegrees({ root: "C", quality, alterations }).map(
      interval,
    );
    if (ChordType.get(alias).empty) ChordType.add(intervals, [alias], quality);
    candidates.set(alias, { quality, alterations });
  }
}
export type HarmonyCandidate = {
  identity: HarmonyIdentity;
  detectedBass?: string;
};
export function identifyHarmony(
  spellings: readonly string[],
): HarmonyCandidate[] {
  if (spellings.length === 0) return [];
  const selected = spellings.map((spelling) => {
    const note = Note.get(spelling);
    if (note.empty || note.chroma === undefined)
      throw new Error("A selected pitch could not be identified.");
    return { pitchClass: note.chroma, midi: Note.midi(spelling) };
  });
  if (selected.every((note) => note.midi !== null))
    selected.sort((left, right) => left.midi! - right.midi!);
  // Detection proposes labels only; original performed spelling/register is never rewritten.
  const normalized = selected.map(
    (note) => Note.get(Note.fromMidi(60 + note.pitchClass)).pc,
  );
  return detect(normalized, { assumePerfectFifth: false }).flatMap((symbol) => {
    const parsed = /^([A-G][#b]?)(scoremapq\d+)(?:\/([A-G][#b]?))?$/u.exec(
      symbol,
    );
    if (!parsed) return [];
    const definition = candidates.get(parsed[2]!);
    if (!definition) return [];
    return [
      {
        identity: {
          root: parsed[1]!,
          quality: definition.quality,
          ...(definition.alterations.length
            ? { alterations: [...definition.alterations] }
            : {}),
        },
        ...(parsed[3] ? { detectedBass: parsed[3] } : {}),
      },
    ];
  });
}
