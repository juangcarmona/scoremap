import { formatNote, type Notation } from "../../shared/music/notation";
import type { RichSong } from "./score";
import type { Reconciliation } from "./scoreCommands";
export function describeRemoval(
  song: RichSong,
  impact: Reconciliation,
  notation: Notation,
): string {
  const lines: string[] = [];
  for (const arrangement of song.arrangements) {
    for (const voicing of arrangement.voicings)
      if (impact.voicings.includes(voicing.id))
        lines.push(
          `Remove voicing “${voicing.name}” in “${arrangement.name}”.`,
        );
    for (const part of arrangement.parts)
      for (const [index, note] of part.events.entries()) {
        const label = `${arrangement.name} / ${part.name} / note ${index + 1}: ${formatNote(`${note.pitch.spelling}${note.pitch.octave}`, notation)}`;
        if (impact.notes.includes(note.id)) lines.push(`Remove ${label}.`);
        else if (impact.ties.includes(note.id))
          lines.push(`Unlink the tie from ${label}.`);
      }
    for (const binding of arrangement.bindings)
      if (impact.bindings.includes(binding.id)) {
        const part = arrangement.parts.find(
          (entry) => entry.id === binding.partId,
        )!;
        const device = arrangement.devices.find(
          (entry) => entry.id === binding.deviceId,
        )!;
        lines.push(
          `Reconcile selected-note assignment: ${arrangement.name} / ${part.name} → ${device.name}${binding.sound ? ` / ${binding.sound}` : ""}${binding.layer ? ` / ${binding.layer}` : ""}.`,
        );
      }
  }
  return lines.join("\n");
}
