import { harmonyCatalogue, type ChordQuality } from "./catalogue";
import { assertHarmony } from "./harmony";
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
  discard?(request: NotationRequest): Promise<void>;
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
export function notationSettings(value: unknown): NotationSettings {
  if (
    !validNotation(value) ||
    !Number.isSafeInteger((value as NotationSettings).revision) ||
    (value as NotationSettings).revision < 0
  )
    throw new Error("The server did not acknowledge valid notation settings.");
  return value as NotationSettings;
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
  chord: {
    root: string;
    quality: string;
    bass?: string;
    alterations?: string[];
  },
  preference: Notation = defaultNotation,
) {
  if (!Object.hasOwn(harmonyCatalogue, chord.quality))
    throw new Error("Unsupported chord quality.");
  const identity = {
    root: chord.root,
    quality: chord.quality,
    ...(chord.bass !== undefined ? { bass: chord.bass } : {}),
    ...(chord.alterations !== undefined
      ? { alterations: chord.alterations }
      : {}),
  };
  assertHarmony(identity);
  const suffix =
    harmonyCatalogue[chord.quality as ChordQuality].symbol +
    ((chord.alterations?.length ?? 0) > 0
      ? "(" +
        chord
          .alterations!.map((alteration) =>
            alteration.replace("b", "♭").replace("#", "♯"),
          )
          .join(",") +
        ")"
      : "");
  return representations(
    (mode) =>
      note(chord.root, mode, false) +
      suffix +
      (chord.bass ? "/" + note(chord.bass, mode, false) : ""),
    preference,
  );
}
