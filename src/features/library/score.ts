import type { HarmonyIdentity } from "../../shared/music/harmony";
import type { LegacySection, LegacySong, Section, Song } from "./domain";
export type Fraction = { n: number; d: number };
export type Measure = {
  id: string;
  meter: { numerator: number; denominator: number };
  length: Fraction;
};
export type HarmonicEvent = HarmonyIdentity & {
  id: string;
  measureId: string;
  start: Fraction;
  duration: Fraction;
};
export type RichSection = Omit<LegacySection, "chords"> & {
  measures: Measure[];
  chords: HarmonicEvent[];
};
export type PerformedPitch = { spelling: string; octave: number; midi: number };
export type NoteEvent = {
  id: string;
  measureId: string;
  start: Fraction;
  duration: Fraction;
  pitch: PerformedPitch;
  voicingId: string;
  tieNextId?: string;
};
export type Part = {
  id: string;
  name: string;
  role: string;
  events: NoteEvent[];
  hand?: string;
};
export type Device = {
  id: string;
  name: string;
  instrument: string;
  range: [number, number];
};
export type Binding = {
  id: string;
  partId: string;
  deviceId: string;
  range: [number, number];
  sound?: string;
  layer?: string;
  eventIds?: string[];
};
export type Voicing = {
  id: string;
  name: string;
  harmonyId: string;
  custom: boolean;
  sourcePreset?: { id: string; revision: number; name: string };
};
export type Arrangement = {
  id: string;
  name: string;
  parts: Part[];
  devices: Device[];
  bindings: Binding[];
  voicings: Voicing[];
};
export type MigrationMapping = {
  sourceVersion: 1;
  identities: Record<string, string>;
};
export type RichSong = Omit<LegacySong, "sections"> & {
  schemaVersion: 2;
  sections: RichSection[];
  arrangements: Arrangement[];
  migration?: MigrationMapping;
};
export function isRichSong(song: Song | RichSong): song is RichSong {
  return "schemaVersion" in song && song.schemaVersion === 2;
}
export function isRichSection(
  section: Section | RichSection,
): section is RichSection {
  return "measures" in section;
}
