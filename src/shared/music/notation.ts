export type Notation = {
  mode: "anglo" | "latin" | "dual";
  primary: "anglo" | "latin";
};
export type NotationSettings = Notation & { revision: number };
export type NotationRequest = Notation & {
  expectedRevision: number;
  commandId: string;
};
export interface NotationStore {
  read(): Promise<NotationSettings>;
  save(request: NotationRequest): Promise<NotationSettings>;
}
export const defaultNotation: Notation = { mode: "anglo", primary: "anglo" };
export function validNotation(value: unknown): value is Notation {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    !Object.hasOwn(value, "mode") ||
    !Object.hasOwn(value, "primary") ||
    Object.keys(value).some(
      (key) => !["mode", "primary", "revision"].includes(key),
    )
  )
    return false;
  const preference = value as Record<string, unknown>;
  return (
    (preference.mode === "dual" &&
      (preference.primary === "anglo" || preference.primary === "latin")) ||
    ((preference.mode === "anglo" || preference.mode === "latin") &&
      preference.primary === preference.mode)
  );
}
const latin: Record<string, string> = {
  C: "Do",
  D: "Re",
  E: "Mi",
  F: "Fa",
  G: "Sol",
  A: "La",
  B: "Si",
};
const suffixes: Record<string, string> = {
  major: "",
  minor: "m",
  diminished: "dim",
  augmented: "aug",
  "suspended-second": "sus2",
  "suspended-fourth": "sus4",
  fifth: "5",
  "major-sixth": "6",
  "minor-sixth": "m6",
  "major-sixth-ninth": "6/9",
  "minor-sixth-ninth": "m6/9",
  "dominant-seventh": "7",
  "major-seventh": "maj7",
  "minor-seventh": "m7",
  "half-diminished-seventh": "m7b5",
  "diminished-seventh": "dim7",
  "minor-major-seventh": "mMaj7",
  "augmented-seventh": "aug7",
  "augmented-major-seventh": "augMaj7",
  "suspended-second-seventh": "7sus2",
  "suspended-fourth-seventh": "7sus4",
  "dominant-ninth": "9",
  "major-ninth": "maj9",
  "minor-ninth": "m9",
  "dominant-eleventh": "11",
  "major-eleventh": "maj11",
  "minor-eleventh": "m11",
  "dominant-thirteenth": "13",
  "major-thirteenth": "maj13",
  "minor-thirteenth": "m13",
  "major-added-ninth": "add9",
  "minor-added-ninth": "madd9",
};
function note(value: string, mode: "anglo" | "latin", ascii: boolean) {
  const parsed = /^([A-G])((?:#+|b+)?)(-?\d+)?$/u.exec(value);
  if (!parsed) throw new Error("Unsupported spelled note.");
  const [, letter, accidentals = "", octave = ""] = parsed;
  return (
    (mode === "latin" ? latin[letter!] : letter) +
    (ascii
      ? accidentals
      : accidentals.replaceAll("#", "♯").replaceAll("b", "♭")) +
    octave
  );
}
function representations(
  render: (mode: "anglo" | "latin") => string,
  preference: Notation,
) {
  if (!validNotation(preference))
    throw new Error("Unsupported notation preference.");
  return preference.mode === "dual"
    ? `${render(preference.primary)} (${render(preference.primary === "anglo" ? "latin" : "anglo")})`
    : render(preference.mode);
}
export function formatNote(
  value: string,
  preference: Notation = defaultNotation,
  ascii = false,
) {
  return representations((mode) => note(value, mode, ascii), preference);
}
export function formatChordSymbol(
  chord: { root: string; quality: string; bass?: string },
  preference: Notation = defaultNotation,
) {
  if (!Object.hasOwn(suffixes, chord.quality))
    throw new Error("Unsupported chord quality.");
  return representations(
    (mode) =>
      note(chord.root, mode, false) +
      suffixes[chord.quality] +
      (chord.bass ? "/" + note(chord.bass, mode, false) : ""),
    preference,
  );
}
