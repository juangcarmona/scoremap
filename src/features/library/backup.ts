import { validateLibrary, type Library } from "./domain";
import { copySongIdentities } from "./identityCopy";
export const MAX_IMPORT_BYTES = 64 * 1024 * 1024;
export function exportBackup(library: Library): string {
  validateLibrary(library);
  return JSON.stringify(
    { format: "scoremap-backup", version: library.schemaVersion, library },
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
    ![1, 2].includes(Number(envelope.version))
  )
    throw new Error(
      "This backup format or version is unsupported. Your current library is unchanged.",
    );
  const library = validateLibrary(envelope.library);
  if (library.schemaVersion !== envelope.version)
    throw new Error(
      "The backup envelope and library versions disagree. Keep the original file.",
    );
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

export function copyBackupLibrary(library: Library): Library {
  const copy = structuredClone(validateLibrary(library));
  const identities = new Map<string, string>();
  const remap = (id: string) => {
    let mapped = identities.get(id);
    if (!mapped) {
      mapped = crypto.randomUUID();
      identities.set(id, mapped);
    }
    return mapped;
  };
  copy.songs = copy.songs.map((song) => copySongIdentities(song, remap));
  for (const repertoire of copy.repertoires) {
    repertoire.id = remap(repertoire.id);
    repertoire.songIds = repertoire.songIds.map(remap);
  }
  return validateLibrary(copy);
}
