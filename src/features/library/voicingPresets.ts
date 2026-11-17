import {
  assertHarmony,
  harmonyIdentity,
  type HarmonyIdentity,
} from "../../shared/music/harmony";
import { theoreticalHarmony } from "../../shared/music/theory";
import type { PerformedPitch } from "./score";
import { assertPerformedPitch } from "./scoreValidation";
import { array, name, object, requireValue } from "./validation";
export type VoicingPreset = {
  id: string;
  name: string;
  harmony: HarmonyIdentity;
  pitches: PerformedPitch[];
  custom: boolean;
};
export type SavedPreset = {
  id: string;
  revision: number;
  preset: VoicingPreset | null;
};
export type PresetMutation = {
  operation: "save" | "delete";
  id: string;
  expectedRevision: number;
  mode: "edit" | "performance";
  content: VoicingPreset | null;
};
export function validatePreset(value: unknown): VoicingPreset {
  object(value, ["id", "name", "harmony", "pitches", "custom"]);
  name(value.id);
  name(value.name);
  assertHarmony(value.harmony);
  array(value.pitches);
  requireValue(
    typeof value.custom === "boolean",
    "Declare custom voicing explicitly.",
  );
  const theory = theoreticalHarmony(harmonyIdentity(value.harmony));
  const allowed = new Set(theory.tones.map((tone) => tone.pitchClass));
  if (theory.bass) allowed.add(theory.bass.pitchClass);
  for (const pitch of value.pitches) {
    assertPerformedPitch(pitch);
    requireValue(
      value.custom || allowed.has(pitch.midi % 12),
      "Non-chord preset pitches need explicit custom reconciliation.",
    );
  }
  return value as VoicingPreset;
}
export function validatePresetMutation(request: PresetMutation) {
  requireValue(
    request.mode === "edit",
    "Performance mode protects reusable voicings. Switch to Edit before changing them.",
  );
  name(request.id);
  requireValue(
    Number.isSafeInteger(request.expectedRevision) &&
      request.expectedRevision >= 0,
    "A current preset revision is required.",
  );
  requireValue(
    request.operation === "save" || request.operation === "delete",
    "Unknown preset operation.",
  );
  if (request.operation === "save")
    requireValue(
      validatePreset(request.content).id === request.id,
      "Keep the preset identity consistent.",
    );
  else
    requireValue(
      request.content === null && request.expectedRevision > 0,
      "Delete only the current acknowledged preset after confirmation.",
    );
}
