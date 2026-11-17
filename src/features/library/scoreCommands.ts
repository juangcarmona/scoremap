import {
  harmonyIdentity,
  type HarmonyIdentity,
} from "../../shared/music/harmony";
import { theoreticalHarmony } from "../../shared/music/theory";
import type { LegacySong, Library } from "./domain";
import {
  isRichSong,
  type Arrangement,
  type Binding,
  type Device,
  type Fraction,
  type MigrationMapping,
  type NoteEvent,
  type Part,
  type RichSong,
  type Voicing,
} from "./score";
import { migrateSong } from "./scoreMigration";
import { compareFraction, fractionEndWithin } from "./scoreValidation";
import { requireValue } from "./validation";
export type Reconciliation = {
  notes: string[];
  voicings: string[];
  bindings: string[];
  ties: string[];
};
export type ScoreCommand = { songId: string } & (
  | { type: "enableArrangements"; mapping: MigrationMapping }
  | {
      type: "appendHarmony";
      sectionId: string;
      eventId: string;
      newMeasureId: string;
      harmony: HarmonyIdentity;
    }
  | {
      type: "updateHarmony";
      eventId: string;
      harmony: HarmonyIdentity;
      customVoicings?: string[];
    }
  | { type: "removeHarmony"; eventId: string; reconciliation?: Reconciliation }
  | {
      type: "setHarmonyTiming";
      eventId: string;
      measureId: string;
      start: Fraction;
      duration: Fraction;
    }
  | { type: "addArrangement"; arrangement: Arrangement }
  | { type: "removeArrangement"; arrangementId: string; confirmed: boolean }
  | { type: "addPart"; arrangementId: string; part: Part; binding?: Binding }
  | {
      type: "updatePart";
      arrangementId: string;
      partId: string;
      patch: Partial<Pick<Part, "name" | "role" | "hand">>;
    }
  | { type: "addDevice"; arrangementId: string; device: Device }
  | {
      type: "updateDevice";
      arrangementId: string;
      deviceId: string;
      patch: Partial<Pick<Device, "name" | "instrument" | "range">>;
    }
  | { type: "setBinding"; arrangementId: string; binding: Binding }
  | { type: "removeBinding"; arrangementId: string; bindingId: string }
  | { type: "addVoicing"; arrangementId: string; voicing: Voicing }
  | {
      type: "setNoteEvent";
      arrangementId: string;
      partId: string;
      event: NoteEvent;
      customVoicing?: true;
    }
  | {
      type: "removeNoteEvent";
      arrangementId: string;
      partId: string;
      noteId: string;
      reconciliation?: Reconciliation;
    }
);
const kinds = new Set([
  "enableArrangements",
  "appendHarmony",
  "updateHarmony",
  "removeHarmony",
  "setHarmonyTiming",
  "addArrangement",
  "removeArrangement",
  "addPart",
  "updatePart",
  "addDevice",
  "updateDevice",
  "setBinding",
  "removeBinding",
  "addVoicing",
  "setNoteEvent",
  "removeNoteEvent",
]);
export function isScoreCommand(command: {
  type: string;
}): command is ScoreCommand {
  return kinds.has(command.type);
}
function exact(left: string[], right: string[]) {
  return (
    left.length === right.length &&
    new Set(left).size === left.length &&
    left.every((id) => right.includes(id))
  );
}
export function sharedImpact(
  song: RichSong,
  harmonicIds: string[],
  extraNotes: string[] = [],
): Reconciliation {
  const impact: Reconciliation = {
    notes: [...extraNotes],
    voicings: [],
    bindings: [],
    ties: [],
  };
  for (const arrangement of song.arrangements) {
    for (const voicing of arrangement.voicings)
      if (harmonicIds.includes(voicing.harmonyId))
        impact.voicings.push(voicing.id);
    for (const part of arrangement.parts)
      for (const note of part.events)
        if (
          impact.voicings.includes(note.voicingId) &&
          !impact.notes.includes(note.id)
        )
          impact.notes.push(note.id);
  }
  for (const arrangement of song.arrangements) {
    for (const binding of arrangement.bindings)
      if (binding.eventIds?.some((id) => impact.notes.includes(id)))
        impact.bindings.push(binding.id);
    for (const part of arrangement.parts)
      for (const note of part.events)
        if (
          !impact.notes.includes(note.id) &&
          note.tieNextId &&
          impact.notes.includes(note.tieNextId)
        )
          impact.ties.push(note.id);
  }
  return impact;
}
export function sectionRemovalImpact(
  song: RichSong,
  sectionId: string,
): Reconciliation {
  const section = song.sections.find((entry) => entry.id === sectionId);
  requireValue(section, "The section no longer exists.");
  const measures = new Set(section.measures.map((measure) => measure.id));
  const notes = song.arrangements.flatMap((arrangement) =>
    arrangement.parts.flatMap((part) =>
      part.events
        .filter((event) => measures.has(event.measureId))
        .map((event) => event.id),
    ),
  );
  return sharedImpact(
    song,
    section.chords.map((event) => event.id),
    notes,
  );
}
export function reconcileSharedRemoval(
  song: RichSong,
  impact: Reconciliation,
  confirmed?: Reconciliation,
) {
  const affected = Object.values(impact).some((ids) => ids.length > 0);
  requireValue(
    !affected ||
      (confirmed &&
        (Object.keys(impact) as (keyof Reconciliation)[]).every(
          (key) =>
            Array.isArray(confirmed[key]) && exact(confirmed[key], impact[key]),
        )),
    "This shared-form change affects performed notes or bindings. Confirm the complete current reconciliation before removing it.",
  );
  for (const arrangement of song.arrangements) {
    arrangement.voicings = arrangement.voicings.filter(
      (voicing) => !impact.voicings.includes(voicing.id),
    );
    for (const part of arrangement.parts) {
      part.events = part.events.filter(
        (note) => !impact.notes.includes(note.id),
      );
      for (const note of part.events)
        if (impact.ties.includes(note.id)) delete note.tieNextId;
    }
    for (const binding of arrangement.bindings)
      if (impact.bindings.includes(binding.id) && binding.eventIds)
        binding.eventIds = binding.eventIds.filter(
          (id) => !impact.notes.includes(id),
        );
  }
}
export function incompatibleVoicings(
  song: RichSong,
  eventId: string,
  identity: HarmonyIdentity,
) {
  const theory = theoreticalHarmony(identity);
  const accepted = new Set(theory.tones.map((tone) => tone.pitchClass));
  if (theory.bass) accepted.add(theory.bass.pitchClass);
  return song.arrangements.flatMap((arrangement) =>
    arrangement.voicings
      .filter(
        (voicing) =>
          voicing.harmonyId === eventId &&
          !voicing.custom &&
          arrangement.parts.some((part) =>
            part.events.some(
              (note) =>
                note.voicingId === voicing.id &&
                !accepted.has(note.pitch.midi % 12),
            ),
          ),
      )
      .map((voicing) => ({
        id: voicing.id,
        name: voicing.name,
        arrangement: arrangement.name,
      })),
  );
}
function plus(left: Fraction, right: Fraction): Fraction {
  let n = BigInt(left.n) * BigInt(right.d) + BigInt(right.n) * BigInt(left.d);
  let d = BigInt(left.d) * BigInt(right.d);
  let a = n < 0n ? -n : n;
  let b = d;
  while (b !== 0n) [a, b] = [b, a % b];
  n /= a;
  d /= a;
  requireValue(
    n <= BigInt(Number.MAX_SAFE_INTEGER) &&
      d <= BigInt(Number.MAX_SAFE_INTEGER),
    "The exact musical position exceeds supported integer precision.",
  );
  return { n: Number(n), d: Number(d) };
}
export function applyScoreCommand(
  library: Library,
  song: LegacySong | RichSong,
  command: ScoreCommand,
) {
  if (command.type === "enableArrangements") {
    requireValue(
      !isRichSong(song),
      "This song already has identified arrangements.",
    );
    library.songs[library.songs.findIndex((entry) => entry.id === song.id)] =
      migrateSong(song, command.mapping);
    library.schemaVersion = 2;
    return;
  }
  requireValue(
    isRichSong(song),
    "Enable identified arrangements before editing performed content.",
  );
  const arrangement =
    "arrangementId" in command
      ? song.arrangements.find((entry) => entry.id === command.arrangementId)
      : undefined;
  if ("arrangementId" in command)
    requireValue(arrangement, "The arrangement no longer exists.");
  const part =
    "partId" in command
      ? arrangement?.parts.find((entry) => entry.id === command.partId)
      : undefined;
  if ("partId" in command)
    requireValue(part, "The performed part no longer exists.");
  const event =
    "eventId" in command && command.type !== "appendHarmony"
      ? song.sections
          .flatMap((section) => section.chords)
          .find((entry) => entry.id === command.eventId)
      : undefined;
  if ("eventId" in command && command.type !== "appendHarmony")
    requireValue(event, "The harmonic event no longer exists.");
  switch (command.type) {
    case "appendHarmony": {
      const section = song.sections.find(
        (entry) => entry.id === command.sectionId,
      );
      requireValue(section, "The section no longer exists.");
      let measure = section.measures.at(-1);
      let start: Fraction = { n: 0, d: 1 };
      if (measure)
        for (const harmonic of section.chords.filter(
          (entry) => entry.measureId === measure!.id,
        )) {
          const end = plus(harmonic.start, harmonic.duration);
          if (compareFraction(end, start) > 0) start = end;
        }
      if (
        !measure ||
        !fractionEndWithin(start, { n: 1, d: 1 }, measure.length)
      ) {
        measure = {
          id: command.newMeasureId,
          meter: { numerator: 4, denominator: 4 },
          length: { n: 4, d: 1 },
        };
        section.measures.push(measure);
        start = { n: 0, d: 1 };
      }
      section.chords.push({
        ...harmonyIdentity(command.harmony),
        id: command.eventId,
        measureId: measure.id,
        start,
        duration: { n: 1, d: 1 },
      });
      break;
    }
    case "updateHarmony": {
      const affected = incompatibleVoicings(
        song,
        command.eventId,
        command.harmony,
      ).map((voicing) => voicing.id);
      requireValue(
        exact(command.customVoicings ?? [], affected),
        "Reconcile all affected performed voicings explicitly before changing harmony.",
      );
      for (const candidate of song.arrangements)
        for (const voicing of candidate.voicings)
          if (affected.includes(voicing.id)) voicing.custom = true;
      delete event!.alterations;
      delete event!.bass;
      Object.assign(event!, harmonyIdentity(command.harmony));
      break;
    }
    case "removeHarmony": {
      reconcileSharedRemoval(
        song,
        sharedImpact(song, [command.eventId]),
        command.reconciliation,
      );
      for (const section of song.sections)
        section.chords = section.chords.filter(
          (entry) => entry.id !== command.eventId,
        );
      break;
    }
    case "setHarmonyTiming":
      Object.assign(event!, {
        measureId: command.measureId,
        start: command.start,
        duration: command.duration,
      });
      break;
    case "addArrangement":
      song.arrangements.push(structuredClone(command.arrangement));
      break;
    case "removeArrangement":
      requireValue(
        command.confirmed,
        "Confirm removal of this complete performed arrangement.",
      );
      song.arrangements = song.arrangements.filter(
        (entry) => entry.id !== command.arrangementId,
      );
      break;
    case "addPart":
      arrangement!.parts.push(structuredClone(command.part));
      if (command.binding) {
        requireValue(
          command.binding.partId === command.part.id,
          "The supplied binding must refer to the new part.",
        );
        arrangement!.bindings.push(structuredClone(command.binding));
      }
      break;
    case "updatePart":
      requireValue(
        Object.keys(command.patch).every((key) =>
          ["name", "role", "hand"].includes(key),
        ),
        "Unsupported part update.",
      );
      Object.assign(part!, command.patch);
      break;
    case "addDevice":
      arrangement!.devices.push(structuredClone(command.device));
      break;
    case "updateDevice": {
      const device = arrangement!.devices.find(
        (entry) => entry.id === command.deviceId,
      );
      requireValue(device, "The device no longer exists.");
      requireValue(
        Object.keys(command.patch).every((key) =>
          ["name", "instrument", "range"].includes(key),
        ),
        "Unsupported device update.",
      );
      Object.assign(device, command.patch);
      break;
    }
    case "setBinding": {
      const index = arrangement!.bindings.findIndex(
        (entry) => entry.id === command.binding.id,
      );
      if (index < 0)
        arrangement!.bindings.push(structuredClone(command.binding));
      else arrangement!.bindings[index] = structuredClone(command.binding);
      break;
    }
    case "removeBinding":
      requireValue(
        arrangement!.bindings.some(
          (binding) => binding.id === command.bindingId,
        ),
        "The binding no longer exists.",
      );
      arrangement!.bindings = arrangement!.bindings.filter(
        (binding) => binding.id !== command.bindingId,
      );
      break;
    case "addVoicing":
      arrangement!.voicings.push(structuredClone(command.voicing));
      break;
    case "setNoteEvent": {
      const index = part!.events.findIndex(
        (note) => note.id === command.event.id,
      );
      if (index < 0) part!.events.push(structuredClone(command.event));
      else part!.events[index] = structuredClone(command.event);
      if (command.customVoicing) {
        const voicing = arrangement!.voicings.find(
          (entry) => entry.id === command.event.voicingId,
        );
        requireValue(voicing, "The voicing no longer exists.");
        voicing.custom = true;
      }
      break;
    }
    case "removeNoteEvent": {
      requireValue(
        part!.events.some((note) => note.id === command.noteId),
        "The performed note no longer exists.",
      );
      const impact = sharedImpact(song, [], [command.noteId]);
      reconcileSharedRemoval(song, impact, command.reconciliation);
      break;
    }
  }
}
