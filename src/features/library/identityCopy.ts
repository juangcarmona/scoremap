import type { Song } from "./domain";
import { isRichSong, type Arrangement } from "./score";
export function copyArrangementIdentities(
  source: Arrangement,
  remap: (id: string) => string,
): Arrangement {
  const arrangement = structuredClone(source);
  arrangement.id = remap(arrangement.id);
  for (const part of arrangement.parts) {
    part.id = remap(part.id);
    for (const event of part.events) {
      event.id = remap(event.id);
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
  for (const voicing of arrangement.voicings) voicing.id = remap(voicing.id);
  return arrangement;
}
export function copySongIdentities(
  source: Song,
  remap: (id: string) => string,
): Song {
  const song = structuredClone(source);
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
    song.arrangements = song.arrangements.map((source) => {
      const arrangement = copyArrangementIdentities(source, remap);
      for (const part of arrangement.parts)
        for (const event of part.events)
          event.measureId = remap(event.measureId);
      for (const voicing of arrangement.voicings)
        voicing.harmonyId = remap(voicing.harmonyId);
      return arrangement;
    });
    if (song.migration)
      for (const key of Object.keys(song.migration.identities))
        song.migration.identities[key] = remap(song.migration.identities[key]!);
  }
  return song;
}
