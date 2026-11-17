import { assertHarmony, harmonyIdentity } from "../../shared/music/harmony";
import { theoreticalHarmony } from "../../shared/music/theory";
import { array, name, object, requireValue, text } from "./validation";
import type {
  Arrangement,
  Fraction,
  HarmonicEvent,
  Measure,
  NoteEvent,
  PerformedPitch,
  RichSong,
} from "./score";
type Identity = (value: unknown) => void;
function integer(value: unknown) {
  requireValue(
    Number.isSafeInteger(value),
    "Use an exact integer within the supported precision.",
  );
  return value as number;
}
export function assertFraction(value: unknown): asserts value is Fraction {
  object(value, ["n", "d"]);
  integer(value.n);
  requireValue(
    integer(value.d) > 0,
    "A musical fraction needs a positive denominator.",
  );
}
export function compareFraction(left: Fraction, right: Fraction) {
  const difference =
    BigInt(left.n) * BigInt(right.d) - BigInt(right.n) * BigInt(left.d);
  return difference < 0n ? -1 : difference > 0n ? 1 : 0;
}
export function fractionEndWithin(
  start: Fraction,
  duration: Fraction,
  length: Fraction,
) {
  return (
    (BigInt(start.n) * BigInt(duration.d) +
      BigInt(duration.n) * BigInt(start.d)) *
      BigInt(length.d) <=
    BigInt(length.n) * BigInt(start.d) * BigInt(duration.d)
  );
}
export function assertPerformedPitch(
  value: unknown,
): asserts value is PerformedPitch {
  object(value, ["spelling", "octave", "midi"]);
  text(value.spelling);
  requireValue(
    value.spelling === value.spelling.trim(),
    "Keep an exact performed-note spelling without whitespace.",
  );
  const parsed = /^([A-G])((?:#+|b+)?)$/u.exec(value.spelling);
  requireValue(parsed, "Keep an explicit valid performed-note spelling.");
  const octave = integer(value.octave);
  const midi = integer(value.midi);
  requireValue(
    octave >= -1 && octave <= 9 && midi >= 0 && midi <= 127,
    "Performed pitch is outside C-1 through G9.",
  );
  const natural: Record<string, number> = {
    C: 0,
    D: 2,
    E: 4,
    F: 5,
    G: 7,
    A: 9,
    B: 11,
  };
  const accidental = parsed[2] ?? "";
  const expected =
    12 * (octave + 1) +
    natural[parsed[1]!]! +
    (accidental.startsWith("b") ? -accidental.length : accidental.length);
  requireValue(
    expected === midi,
    "Performed spelling, octave and absolute pitch must agree.",
  );
}
function timing(
  event: { start: Fraction; duration: Fraction },
  measure: Measure,
) {
  assertFraction(event.start);
  assertFraction(event.duration);
  requireValue(
    event.start.n >= 0 &&
      event.duration.n > 0 &&
      compareFraction(event.start, measure.length) < 0 &&
      fractionEndWithin(event.start, event.duration, measure.length),
    "Musical events need a positive duration wholly within their measure.",
  );
}
function validateMeasure(
  value: unknown,
  identity: Identity,
): asserts value is Measure {
  object(value, ["id", "meter", "length"]);
  identity(value.id);
  object(value.meter, ["numerator", "denominator"]);
  requireValue(
    integer(value.meter.numerator) > 0,
    "Meter needs a positive numerator.",
  );
  const denominator = integer(value.meter.denominator);
  requireValue(
    denominator > 0 &&
      (BigInt(denominator) & (BigInt(denominator) - 1n)) === 0n,
    "Meter denominator must be a power of two.",
  );
  assertFraction(value.length);
  requireValue(
    value.length.n > 0,
    "A measure must have a positive exact length.",
  );
}
function validateHarmonicEvent(
  value: unknown,
  measures: Map<string, Measure>,
  identity: Identity,
): asserts value is HarmonicEvent {
  object(
    value,
    ["id", "measureId", "start", "duration", "root", "quality"],
    ["alterations", "bass"],
  );
  identity(value.id);
  text(value.measureId);
  const measure = measures.get(value.measureId);
  requireValue(
    measure,
    "Harmonic event refers to a missing measure in its section.",
  );
  const harmony = {
    root: value.root,
    quality: value.quality,
    ...(value.alterations !== undefined
      ? { alterations: value.alterations }
      : {}),
    ...(value.bass !== undefined ? { bass: value.bass } : {}),
  };
  assertHarmony(harmony);
  assertFraction(value.start);
  assertFraction(value.duration);
  timing({ start: value.start, duration: value.duration }, measure);
}
function range(value: unknown): asserts value is [number, number] {
  array(value);
  requireValue(
    value.length === 2 &&
      integer(value[0]) >= 0 &&
      integer(value[1]) <= 127 &&
      Number(value[0]) <= Number(value[1]),
    "An inclusive physical pitch range must lie within 0..127.",
  );
}
function validateVoicings(
  arrangement: Record<string, unknown>,
  harmonies: Map<string, HarmonicEvent>,
  identity: Identity,
) {
  array(arrangement.voicings);
  const voicings = new Map<
    string,
    { harmony: HarmonicEvent; custom: boolean; pitchClasses: Set<number> }
  >();
  for (const voicing of arrangement.voicings) {
    object(voicing, ["id", "name", "harmonyId", "custom"], ["sourcePreset"]);
    identity(voicing.id);
    name(voicing.name);
    text(voicing.harmonyId);
    const harmony = harmonies.get(voicing.harmonyId);
    requireValue(harmony, "Voicing refers to a missing harmonic event.");
    requireValue(
      typeof voicing.custom === "boolean",
      "Declare whether a voicing is custom.",
    );
    if (voicing.sourcePreset !== undefined) {
      object(voicing.sourcePreset, ["id", "revision", "name"]);
      name(voicing.sourcePreset.id);
      name(voicing.sourcePreset.name);
      requireValue(
        integer(voicing.sourcePreset.revision) >= 1,
        "Copied preset provenance needs its acknowledged version.",
      );
    }
    const theory = theoreticalHarmony(harmonyIdentity(harmony));
    const pitchClasses = new Set(theory.tones.map((tone) => tone.pitchClass));
    if (theory.bass) pitchClasses.add(theory.bass.pitchClass);
    voicings.set(voicing.id as string, {
      harmony,
      custom: voicing.custom,
      pitchClasses,
    });
  }
  return voicings;
}
function validatePart(
  value: unknown,
  measures: Map<string, Measure>,
  voicings: ReturnType<typeof validateVoicings>,
  identity: Identity,
) {
  object(value, ["id", "name", "role", "events"], ["hand"]);
  identity(value.id);
  name(value.name);
  text(value.role);
  if (value.hand !== undefined) name(value.hand);
  array(value.events);
  for (const event of value.events) {
    object(
      event,
      ["id", "measureId", "start", "duration", "pitch", "voicingId"],
      ["tieNextId"],
    );
    identity(event.id);
    text(event.measureId);
    text(event.voicingId);
    const measure = measures.get(event.measureId);
    requireValue(measure, "Performed event refers to a missing measure.");
    assertFraction(event.start);
    assertFraction(event.duration);
    timing({ start: event.start, duration: event.duration }, measure);
    assertPerformedPitch(event.pitch);
    const voicing = voicings.get(event.voicingId);
    requireValue(
      voicing,
      "Performed event refers to a missing voicing in its arrangement.",
    );
    const pitch = event.pitch;
    requireValue(
      voicing.custom || voicing.pitchClasses.has(pitch.midi % 12),
      "Performed non-chord tones need explicit custom-voicing reconciliation.",
    );
    if (event.tieNextId !== undefined) name(event.tieNextId);
  }
}
function validateTies(
  events: NoteEvent[],
  measures: Map<string, Measure>,
  order: string[],
) {
  for (const event of events) {
    if (!event.tieNextId) continue;
    const next = events.find((candidate) => candidate.id === event.tieNextId);
    requireValue(
      next &&
        next.id !== event.id &&
        next.pitch.midi === event.pitch.midi &&
        next.pitch.spelling === event.pitch.spelling &&
        next.pitch.octave === event.pitch.octave,
      "Tied occurrences must preserve the exact performed pitch within one part.",
    );
    const left =
      BigInt(event.start.n) * BigInt(event.duration.d) +
      BigInt(event.duration.n) * BigInt(event.start.d);
    const denominator = BigInt(event.start.d) * BigInt(event.duration.d);
    const same =
      next.measureId === event.measureId &&
      left * BigInt(next.start.d) === BigInt(next.start.n) * denominator;
    const length = measures.get(event.measureId)!.length;
    const following =
      order.indexOf(next.measureId) === order.indexOf(event.measureId) + 1 &&
      next.start.n === 0 &&
      left * BigInt(length.d) === BigInt(length.n) * denominator;
    requireValue(
      same || following,
      "Ties must connect consecutive identified occurrences without extending a note beyond its measure.",
    );
  }
}
function validateBindings(arrangement: Arrangement, identity: Identity) {
  array(arrangement.devices);
  array(arrangement.bindings);
  for (const device of arrangement.devices) {
    object(device, ["id", "name", "instrument", "range"]);
    identity(device.id);
    name(device.name);
    name(device.instrument);
    range(device.range);
  }
  for (const binding of arrangement.bindings) {
    object(
      binding,
      ["id", "partId", "deviceId", "range"],
      ["sound", "layer", "eventIds"],
    );
    identity(binding.id);
    text(binding.partId);
    text(binding.deviceId);
    range(binding.range);
    const part = arrangement.parts.find((p) => p.id === binding.partId);
    const device = arrangement.devices.find((d) => d.id === binding.deviceId);
    requireValue(
      part && device,
      "Binding must refer to its own arrangement's part and device.",
    );
    requireValue(
      binding.range[0] >= device.range[0] &&
        binding.range[1] <= device.range[1],
      "Binding range lies outside its physical device.",
    );
    if (binding.sound !== undefined) text(binding.sound);
    if (binding.layer !== undefined) text(binding.layer);
    let notes = part.events;
    if (binding.eventIds !== undefined) {
      array(binding.eventIds);
      requireValue(
        new Set(binding.eventIds).size === binding.eventIds.length &&
          binding.eventIds.every(
            (id) =>
              typeof id === "string" &&
              part.events.some((event) => event.id === id),
          ),
        "Binding contains a missing, duplicate or other-part event.",
      );
      notes = notes.filter((event) => binding.eventIds!.includes(event.id));
    }
    requireValue(
      notes.every(
        (event) =>
          event.pitch.midi >= binding.range[0] &&
          event.pitch.midi <= binding.range[1],
      ),
      "This physical assignment excludes performed notes; reconcile it explicitly before saving.",
    );
  }
}
export function validateRichScore(
  value: Record<string, unknown>,
  identity: Identity,
): asserts value is Record<string, unknown> & RichSong {
  const measures = new Map<string, Measure>();
  const harmonies = new Map<string, HarmonicEvent>();
  const order: string[] = [];
  array(value.sections);
  for (const section of value.sections) {
    object(section, ["id", "name", "repeat", "chords", "notes", "measures"]);
    array(section.measures);
    const local = new Map<string, Measure>();
    for (const measure of section.measures) {
      validateMeasure(measure, identity);
      measures.set(measure.id, measure);
      local.set(measure.id, measure);
      order.push(measure.id);
    }
    array(section.chords);
    for (const event of section.chords) {
      validateHarmonicEvent(event, local, identity);
      harmonies.set(event.id, event);
    }
    for (const measure of section.measures) {
      const events = section.chords.filter(
        (event) =>
          (event as HarmonicEvent).measureId === (measure as Measure).id,
      ) as HarmonicEvent[];
      events.sort((left, right) => compareFraction(left.start, right.start));
      for (let i = 1; i < events.length; i++) {
        const previous = events[i - 1]!;
        const current = events[i]!;
        const n =
          BigInt(previous.start.n) * BigInt(previous.duration.d) +
          BigInt(previous.duration.n) * BigInt(previous.start.d);
        const d = BigInt(previous.start.d) * BigInt(previous.duration.d);
        requireValue(
          n * BigInt(current.start.d) <= BigInt(current.start.n) * d,
          "Harmonic events cannot overlap within one measure.",
        );
      }
    }
  }
  array(value.arrangements);
  for (const arrangement of value.arrangements) {
    object(arrangement, [
      "id",
      "name",
      "parts",
      "devices",
      "bindings",
      "voicings",
    ]);
    identity(arrangement.id);
    name(arrangement.name);
    array(arrangement.parts);
    const voicings = validateVoicings(arrangement, harmonies, identity);
    for (const part of arrangement.parts)
      validatePart(part, measures, voicings, identity);
    const typed = arrangement as unknown as Arrangement;
    for (const part of typed.parts) validateTies(part.events, measures, order);
    validateBindings(typed, identity);
  }
  if (value.migration !== undefined) {
    object(value.migration, ["sourceVersion", "identities"]);
    requireValue(
      value.migration.sourceVersion === 1,
      "Unsupported migration provenance.",
    );
    requireValue(
      typeof value.migration.identities === "object" &&
        value.migration.identities !== null &&
        !Array.isArray(value.migration.identities),
      "Migration identities must be an explicit map.",
    );
    const mapping = Object.entries(value.migration.identities);
    requireValue(
      mapping.length > 0 &&
        new Set(mapping.map(([, id]) => id)).size === mapping.length,
      "Migration mapping must contain unique generated identities.",
    );
    for (const [source, id] of mapping) {
      name(source);
      name(id);
    }
  }
}
