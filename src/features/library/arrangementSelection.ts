import type {
  Arrangement,
  Binding,
  Fraction,
  HarmonicEvent,
  NoteEvent,
  Part,
} from "./score";
import { compareFraction } from "./scoreValidation";
export function activePartEvents(
  part: Part,
  measureId: string,
  start: Fraction,
): NoteEvent[] {
  return part.events.filter(
    (event) =>
      event.measureId === measureId &&
      compareFraction(event.start, start) <= 0 &&
      BigInt(start.n) * BigInt(event.start.d) * BigInt(event.duration.d) <
        (BigInt(event.start.n) * BigInt(event.duration.d) +
          BigInt(event.duration.n) * BigInt(event.start.d)) *
          BigInt(start.d),
  );
}
export function bindingEvents(
  arrangement: Arrangement,
  binding: Binding,
  harmonic: HarmonicEvent,
) {
  const part = arrangement.parts.find((entry) => entry.id === binding.partId)!;
  return activePartEvents(part, harmonic.measureId, harmonic.start).filter(
    (event) => !binding.eventIds || binding.eventIds.includes(event.id),
  );
}
export function deviceEvents(
  arrangement: Arrangement,
  deviceId: string,
  harmonic: HarmonicEvent,
): NoteEvent[] {
  const events = new Map<string, NoteEvent>();
  for (const binding of arrangement.bindings.filter(
    (entry) => entry.deviceId === deviceId,
  ))
    for (const event of bindingEvents(arrangement, binding, harmonic))
      events.set(event.id, event);
  return [...events.values()];
}
export function unassignedPartEvents(
  arrangement: Arrangement,
  part: Part,
  harmonic: HarmonicEvent,
): NoteEvent[] {
  return activePartEvents(part, harmonic.measureId, harmonic.start).filter(
    (event) =>
      !arrangement.bindings.some(
        (binding) =>
          binding.partId === part.id &&
          (!binding.eventIds || binding.eventIds.includes(event.id)),
      ),
  );
}
