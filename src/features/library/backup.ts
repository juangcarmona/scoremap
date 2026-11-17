import { validateLibrary, type Library } from "./domain";
import { isRichSong } from "./score";
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
  for (const song of copy.songs) {
    song.id = remap(song.id);
    for (const section of song.sections) section.id = remap(section.id);
    for (const ref of song.references) ref.id = remap(ref.id);
    if (song.pdf) song.pdf.id = remap(song.pdf.id);
    if (isRichSong(song)) {
      for (const section of song.sections) {
        for (const measure of section.measures) measure.id = remap(measure.id);
        for (const event of section.chords) {
          event.id = remap(event.id);
          event.measureId = remap(event.measureId);
        }
      }
      for (const arrangement of song.arrangements) {
        arrangement.id = remap(arrangement.id);
        for (const part of arrangement.parts) {
          part.id = remap(part.id);
          for (const event of part.events) {
            event.id = remap(event.id);
            event.measureId = remap(event.measureId);
            event.voicingId = remap(event.voicingId);
            if (event.tieNextId) event.tieNextId = remap(event.tieNextId);
          }
        }
        for (const device of arrangement.devices) device.id = remap(device.id);
        for (const binding of arrangement.bindings) {
          binding.id = remap(binding.id);
          binding.partId = remap(binding.partId);
          binding.deviceId = remap(binding.deviceId);
          if (binding.eventIds) binding.eventIds = binding.eventIds.map(remap);
        }
        for (const voicing of arrangement.voicings) {
          voicing.id = remap(voicing.id);
          voicing.harmonyId = remap(voicing.harmonyId);
        }
      }
      if (song.migration)
        for (const key of Object.keys(song.migration.identities))
          song.migration.identities[key] = remap(
            song.migration.identities[key]!,
          );
    }
  }
  for (const repertoire of copy.repertoires) {
    repertoire.id = remap(repertoire.id);
    repertoire.songIds = repertoire.songIds.map(remap);
  }
  return validateLibrary(copy);
}
