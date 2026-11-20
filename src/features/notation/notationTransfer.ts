import { validNotation, type Notation } from "../../shared/music/notation";

export const MAX_NOTATION_TRANSFER_BYTES = 4096;

type Transfer = {
  format: "scoremap-notation-preference";
  version: 1;
  sourceRevision: number | null;
  preference: Notation;
};

export function exportNotationPreference(
  preference: Notation,
  sourceRevision: number | null,
): string {
  if (
    !validNotation(preference) ||
    (sourceRevision !== null &&
      (!Number.isSafeInteger(sourceRevision) || sourceRevision < 0))
  )
    throw new Error("The note-name preference cannot be exported.");
  return JSON.stringify(
    {
      format: "scoremap-notation-preference",
      version: 1,
      sourceRevision,
      preference: { mode: preference.mode, primary: preference.primary },
    } satisfies Transfer,
    null,
    2,
  );
}

export function importNotationPreference(text: string): Transfer {
  if (new TextEncoder().encode(text).byteLength > MAX_NOTATION_TRANSFER_BYTES)
    throw new Error(
      "This note-name file is too large. Your settings are unchanged.",
    );
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error(
      "This note-name file is not valid JSON. Your settings are unchanged.",
    );
  }
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error(
      "This is not a supported note-name file. Your settings are unchanged.",
    );
  const object = value as Record<string, unknown>;
  if (
    Object.keys(object).sort().join(",") !==
      "format,preference,sourceRevision,version" ||
    object.format !== "scoremap-notation-preference" ||
    object.version !== 1 ||
    !validNotation(object.preference) ||
    !object.preference ||
    Object.keys(object.preference).sort().join(",") !== "mode,primary" ||
    !(
      object.sourceRevision === null ||
      (Number.isSafeInteger(object.sourceRevision) &&
        (object.sourceRevision as number) >= 0)
    )
  )
    throw new Error(
      "This note-name file has an unsupported format or value. Your settings are unchanged.",
    );
  return object as Transfer;
}
