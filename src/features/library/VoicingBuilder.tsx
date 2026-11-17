import { useAuthorizeSongExport } from "./PresetContext";
import { VoicingPresets } from "./VoicingPresets";
import type { SavedPreset } from "./voicingPresets";
import { useState } from "react";
import { PerformedPiano } from "../sketch/PerformedPiano";
import {
  performedPitchAt,
  theoreticalHarmony,
  identifyHarmony,
  type HarmonyCandidate,
} from "../../shared/music/theory";
import { harmonyIdentity } from "../../shared/music/harmony";
import { formatChordSymbol, formatNote } from "../../shared/music/notation";
import { useNotation } from "../../shared/music/NotationContext";
import { applyCommand, type Command } from "./domain";
import type {
  Arrangement,
  HarmonicEvent,
  NoteEvent,
  Part,
  RichSong,
  Voicing,
} from "./score";
import { incompatibleVoicings, sharedImpact } from "./scoreCommands";
import { downloadText } from "./backup";
export function VoicingBuilder({
  song,
  arrangement,
  part,
  harmonic,
  voicing,
  editable,
  execute,
  report,
  onDirty,
  onApplied,
  seedPreset,
  onPickPreset,
}: {
  song: RichSong;
  arrangement: Arrangement;
  part: Part;
  harmonic: HarmonicEvent;
  voicing: Voicing | null;
  editable: boolean;
  execute: (command: Command) => Promise<void>;
  report: (error: unknown) => void;
  onDirty: (dirty: boolean) => void;
  onApplied: (before: Arrangement, after: Arrangement) => void;
  seedPreset: SavedPreset | null;
  onPickPreset: (preset: SavedPreset) => void;
}) {
  const { preference } = useNotation();
  const authorizeExport = useAuthorizeSongExport();
  const [voicingId] = useState(() => voicing?.id ?? crypto.randomUUID());
  const selectedEvents = () =>
    part.events.filter((event) => event.voicingId === voicingId);
  const [expected, setExpected] = useState(() => ({
    voicing: voicing ? structuredClone(voicing) : null,
    events: structuredClone(selectedEvents()),
  }));
  const [draft, setDraft] = useState<NoteEvent[]>(() =>
    seedPreset?.preset
      ? seedPreset.preset.pitches.map((pitch) => ({
          id: crypto.randomUUID(),
          measureId: harmonic.measureId,
          start: structuredClone(harmonic.start),
          duration: structuredClone(harmonic.duration),
          pitch: structuredClone(pitch),
          voicingId,
        }))
      : structuredClone(selectedEvents()),
  );
  const [name, setName] = useState(
    seedPreset?.preset?.name ?? voicing?.name ?? "My voicing",
  );
  const [custom, setCustom] = useState(
    seedPreset?.preset?.custom ?? voicing?.custom ?? false,
  );
  const [firstOctave, setFirstOctave] = useState(3);
  const [octaves, setOctaves] = useState<2 | 3>(2);
  const [dirty, setDirty] = useState(!!seedPreset);
  const [saving, setSaving] = useState(false);
  const [candidates, setCandidates] = useState<HarmonyCandidate[] | null>(null);
  function changed(events: NoteEvent[]) {
    setDraft(events);
    setDirty(true);
    onDirty(true);
    setCandidates(null);
  }
  function cancel() {
    const current =
      arrangement.voicings.find((entry) => entry.id === voicingId) ?? null;
    const events = structuredClone(selectedEvents());
    setExpected({ voicing: current ? structuredClone(current) : null, events });
    setDraft(events);
    setName(current?.name ?? "My voicing");
    setCustom(current?.custom ?? false);
    setDirty(false);
    onDirty(false);
    setCandidates(null);
  }
  function toggle(pitch: NoteEvent["pitch"]) {
    if (!editable || saving) return;
    const existing = draft.find((event) => event.pitch.midi === pitch.midi);
    changed(
      existing
        ? draft.filter((event) => event.id !== existing.id)
        : [
            ...draft,
            {
              id: crypto.randomUUID(),
              measureId: harmonic.measureId,
              start: structuredClone(harmonic.start),
              duration: structuredClone(harmonic.duration),
              pitch,
              voicingId,
            },
          ],
    );
  }
  function octave(id: string, direction: number) {
    try {
      changed(
        draft.map((event) =>
          event.id === id
            ? {
                ...event,
                pitch: performedPitchAt(
                  event.pitch.midi + 12 * direction,
                  event.pitch.spelling,
                ),
              }
            : event,
        ),
      );
    } catch (error) {
      report(error);
    }
  }
  async function apply() {
    if (!editable || saving) return;
    try {
      const theory = theoreticalHarmony(harmonyIdentity(harmonic));
      const allowed = new Set(theory.tones.map((tone) => tone.pitchClass));
      if (theory.bass) allowed.add(theory.bass.pitchClass);
      let nextCustom = custom;
      if (
        draft.some((event) => !allowed.has(event.pitch.midi % 12)) &&
        !nextCustom
      ) {
        if (
          !window.confirm(
            "These played notes include non-chord tones. Keep their exact pitches as an explicitly custom voicing? Harmony will stay unchanged.",
          )
        )
          return;
        nextCustom = true;
      }
      const removed = expected.events
        .filter((event) => !draft.some((note) => note.id === event.id))
        .map((event) => event.id);
      const impact = sharedImpact(song, [], removed);
      if (
        removed.length &&
        !window.confirm(
          `Remove ${removed.length} performed notes? This reconciles ${impact.bindings.length} selected-note assignments and unlinks ${impact.ties.length} ties. Other parts remain unchanged.`,
        )
      )
        return;
      const nextVoicing: Voicing = {
        ...(expected.voicing ?? {}),
        id: voicingId,
        name,
        harmonyId: harmonic.id,
        custom: nextCustom,
        ...(seedPreset?.preset
          ? {
              sourcePreset: {
                id: seedPreset.id,
                revision: seedPreset.revision,
                name: seedPreset.preset.name,
              },
            }
          : {}),
      };
      const command: Command = {
        type: "setVoicingPerformance",
        songId: song.id,
        arrangementId: arrangement.id,
        partId: part.id,
        voicingId,
        voicing: nextVoicing,
        events: draft,
        expected,
        reconciliation: impact,
      };
      const candidate = applyCommand(
        { schemaVersion: 2, revision: 0, songs: [song], repertoires: [] },
        "edit",
        command,
      ).songs[0] as RichSong;
      const after = candidate.arrangements.find(
        (entry) => entry.id === arrangement.id,
      )!;
      setSaving(true);
      await execute(command);
      setExpected({
        voicing: structuredClone(nextVoicing),
        events: structuredClone(draft),
      });
      setCustom(nextCustom);
      setDirty(false);
      onDirty(false);
      onApplied(structuredClone(arrangement), after);
    } catch (error) {
      report(error);
    } finally {
      setSaving(false);
    }
  }
  async function choose(candidate: HarmonyCandidate) {
    if (!editable || saving) return;
    const affected = incompatibleVoicings(
      song,
      harmonic.id,
      candidate.identity,
    );
    if (
      affected.length &&
      !window.confirm(
        `This explicit harmonic choice affects ${affected.map((entry) => `${entry.name} in ${entry.arrangement}`).join(", ")}. Preserve their played pitches as custom voicings?`,
      )
    )
      return;
    const command: Command = {
      type: "updateHarmony",
      songId: song.id,
      eventId: harmonic.id,
      harmony: candidate.identity,
      customVoicings: affected.map((entry) => entry.id),
    };
    try {
      const candidateSong = applyCommand(
        { schemaVersion: 2, revision: 0, songs: [song], repertoires: [] },
        "edit",
        command,
      ).songs[0] as RichSong;
      const current =
        candidateSong.arrangements
          .find((entry) => entry.id === arrangement.id)!
          .voicings.find((entry) => entry.id === voicingId) ?? null;
      setSaving(true);
      await execute(command);
      setExpected({ ...expected, voicing: current });
      if (current?.custom) setCustom(true);
      setCandidates(null);
    } catch (error) {
      report(error);
    } finally {
      setSaving(false);
    }
  }
  return (
    <section aria-label={`Played-note builder for ${part.name}`}>
      <h3>
        {part.name} · {formatChordSymbol(harmonic, preference)}
      </h3>
      <p>
        {part.role || "No role assigned"}
        {part.hand ? ` · ${part.hand} context` : " · hand unassigned"}
      </p>
      <div className="builder-controls">
        <label>
          First visible octave
          <select
            aria-label={`First visible octave for ${part.name}`}
            value={firstOctave}
            onChange={(event) => setFirstOctave(Number(event.target.value))}
          >
            {Array.from({ length: 9 }, (_, index) => index - 1).map(
              (octave) => (
                <option key={octave} value={octave}>
                  {formatNote(`C${octave}`, preference)}
                </option>
              ),
            )}
          </select>
        </label>
        <label>
          Piano span
          <select
            aria-label={`Piano span for ${part.name}`}
            value={octaves}
            onChange={(event) =>
              setOctaves(Number(event.target.value) as 2 | 3)
            }
          >
            <option value={2}>Two octaves</option>
            <option value={3}>Three octaves</option>
          </select>
        </label>
      </div>
      <PerformedPiano
        harmony={harmonyIdentity(harmonic)}
        pitches={draft.map((event) => event.pitch)}
        firstOctave={firstOctave}
        octaves={octaves}
        editable={editable && !saving}
        onToggle={toggle}
        label={`${part.name} exact-pitch piano`}
      />
      <ul
        className="note-occurrences"
        aria-label={`${part.name} performed occurrences`}
      >
        {draft.map((event) => (
          <li key={event.id} data-note-event-id={event.id}>
            <strong>
              {formatNote(
                `${event.pitch.spelling}${event.pitch.octave}`,
                preference,
              )}
            </strong>
            <span>
              Start {event.start.n}/{event.start.d} · duration{" "}
              {event.duration.n}/{event.duration.d}
            </span>
            {editable && (
              <>
                <button
                  type="button"
                  disabled={saving || event.pitch.midi > 115}
                  aria-label={`Raise ${formatNote(`${event.pitch.spelling}${event.pitch.octave}`, preference)} one octave`}
                  onClick={() => octave(event.id, 1)}
                >
                  Octave ↑
                </button>
                <button
                  type="button"
                  disabled={saving || event.pitch.midi < 12}
                  aria-label={`Lower ${formatNote(`${event.pitch.spelling}${event.pitch.octave}`, preference)} one octave`}
                  onClick={() => octave(event.id, -1)}
                >
                  Octave ↓
                </button>
                <button
                  type="button"
                  disabled={saving}
                  aria-label={`Remove played ${formatNote(`${event.pitch.spelling}${event.pitch.octave}`, preference)}`}
                  onClick={() =>
                    changed(draft.filter((note) => note.id !== event.id))
                  }
                >
                  Remove
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
      {editable && (
        <>
          <div className="builder-controls">
            <label>
              Voicing name
              <input
                aria-label={`Voicing name for ${part.name}`}
                value={name}
                disabled={saving}
                onChange={(event) => {
                  setName(event.target.value);
                  setDirty(true);
                  onDirty(true);
                }}
                required
              />
            </label>
            <button
              type="button"
              disabled={!draft.length || saving}
              onClick={() => {
                const lowest = [...draft].sort(
                  (a, b) => a.pitch.midi - b.pitch.midi,
                )[0]!;
                octave(lowest.id, 1);
              }}
            >
              Raise lowest note · inversion
            </button>
            <button
              type="button"
              disabled={!draft.length || saving}
              onClick={() => {
                const highest = [...draft].sort(
                  (a, b) => b.pitch.midi - a.pitch.midi,
                )[0]!;
                octave(highest.id, -1);
              }}
            >
              Lower highest note · inversion
            </button>
            <button
              type="button"
              disabled={!dirty || saving}
              onClick={() => {
                void apply();
              }}
            >
              Apply played notes
            </button>
            <button type="button" disabled={!dirty || saving} onClick={cancel}>
              Cancel played-note edit
            </button>
          </div>
          <p role="status">
            {saving
              ? "Saving played notes…"
              : dirty
                ? "Preview only — played-note changes have not been applied."
                : "Showing saved notes for this part and voicing."}
            {custom ? " Custom voicing; harmonic identity is unchanged." : ""}
          </p>
          <button
            type="button"
            disabled={saving}
            onClick={() => {
              try {
                setCandidates(
                  identifyHarmony(
                    draft.map(
                      (event) => `${event.pitch.spelling}${event.pitch.octave}`,
                    ),
                  ),
                );
              } catch (error) {
                report(error);
              }
            }}
          >
            Identify played notes
          </button>
          <button
            type="button"
            onClick={() =>
              void authorizeExport()
                .then(() =>
                  downloadText(
                    JSON.stringify(
                      {
                        format: "scoremap-voicing-preview",
                        version: 1,
                        songId: song.id,
                        eventId: harmonic.id,
                        partId: part.id,
                        name,
                        events: draft,
                      },
                      null,
                      2,
                    ),
                    "scoremap-played-note-preview.json",
                  ),
                )
                .catch(report)
            }
          >
            Export played-note preview
          </button>
          {candidates && (
            <div role="status">
              <p>
                {candidates.length === 0
                  ? "Unknown — no supported chord identity matches these notes."
                  : candidates.length === 1
                    ? "One supported identification; choose it explicitly to change harmony."
                    : "Ambiguous — several supported identities match. Choose only if you want to change harmony."}
              </p>
              {candidates.map((candidate, index) => (
                <button
                  key={index}
                  type="button"
                  disabled={saving}
                  onClick={() => {
                    void choose(candidate);
                  }}
                >
                  Choose {formatChordSymbol(candidate.identity, preference)}
                  {candidate.detectedBass
                    ? ` · detected bass ${formatNote(candidate.detectedBass, preference)}`
                    : ""}
                </button>
              ))}
            </div>
          )}
        </>
      )}
      <VoicingPresets
        editable={editable && !saving}
        onApply={onPickPreset}
        capture={() => {
          const theory = theoreticalHarmony(harmonyIdentity(harmonic));
          const allowed = new Set(theory.tones.map((tone) => tone.pitchClass));
          if (theory.bass) allowed.add(theory.bass.pitchClass);
          const incompatible = draft.some(
            (event) => !allowed.has(event.pitch.midi % 12),
          );
          if (
            incompatible &&
            !custom &&
            !window.confirm(
              "Save these exact non-chord pitches as an explicitly custom reusable voicing?",
            )
          )
            throw new Error(
              "Preset save cancelled. Your preview and song are unchanged.",
            );
          return {
            harmony: harmonyIdentity(harmonic),
            pitches: draft.map((event) => structuredClone(event.pitch)),
            custom: custom || incompatible,
          };
        }}
      />
    </section>
  );
}
