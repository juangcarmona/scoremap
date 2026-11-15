import { validateLibrary, type Library } from "./domain";
export const MAX_IMPORT_BYTES = 64 * 1024 * 1024;
export function exportBackup(library: Library): string {
  validateLibrary(library);
  return JSON.stringify(
    { format: "scoremap-backup", version: 1, library },
    null,
    2,
  );
}
export function importBackup(text: string): Library {
  if (new TextEncoder().encode(text).byteLength > MAX_IMPORT_BYTES)
    throw new Error(
      "This backup exceeds the 64 MiB import limit. Your current library is unchanged.",
    );
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error(
      "This file is not valid JSON. Your current library is unchanged.",
    );
  }
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("This is not a ScoreMap backup.");
  const envelope = value as Record<string, unknown>;
  if (
    Object.keys(envelope).sort().join(",") !== "format,library,version" ||
    envelope.format !== "scoremap-backup" ||
    envelope.version !== 1
  )
    throw new Error(
      "This backup format or version is unsupported. Your current library is unchanged.",
    );
  const library = validateLibrary(envelope.library);
  if (library.songs.some((song) => song.pdf))
    throw new Error(
      "This backup contains PDF attachments, which this build cannot open yet. Keep the original backup; your current library is unchanged.",
    );
  return library;
}
export function downloadText(text: string, filename: string) {
  const url = URL.createObjectURL(
    new Blob([text], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
