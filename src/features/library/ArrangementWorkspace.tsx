import type { SavedPreset } from "./voicingPresets";
import { useState } from "react";
import type { Command } from "./domain";
import type { Arrangement, HarmonicEvent, RichSong } from "./score";
import { VoicingBuilder } from "./VoicingBuilder";
import { formatChordSymbol } from "../../shared/music/notation";
import { useNotation } from "../../shared/music/NotationContext";
export function ArrangementWorkspace({
  song,
  harmonic,
  editable,
  execute,
  report,
  onSelectHarmony,
  dirty,
  setDirty,
}: {
  song: RichSong;
  harmonic: HarmonicEvent | undefined;
  editable: boolean;
  execute: (command: Command) => Promise<void>;
  report: (error: unknown) => void;
  onSelectHarmony: (id: string) => void;
  dirty: boolean;
  setDirty: (dirty: boolean) => void;
}) {
  const { preference } = useNotation();
  const [arrangementId, setArrangementId] = useState(
    song.arrangements[0]?.id ?? "",
  );
  const [partId, setPartId] = useState("");
  const [voicingId, setVoicingId] = useState("");
  const [epoch, setEpoch] = useState(0);
  const [seedPreset, setSeedPreset] = useState<SavedPreset | null>(null);
  const [undo, setUndo] = useState<{
    before: Arrangement;
    after: Arrangement;
  } | null>(null);
  const arrangement =
    song.arrangements.find((entry) => entry.id === arrangementId) ??
    song.arrangements[0];
  const part =
    arrangement?.parts.find((entry) => entry.id === partId) ??
    arrangement?.parts[0];
  const choices =
    arrangement?.voicings.filter((entry) => entry.harmonyId === harmonic?.id) ??
    [];
  const voicing =
    choices.find((entry) => entry.id === voicingId) ??
    (voicingId === "new" ? null : (choices[0] ?? null));
  function select(action: () => void) {
    if (
      dirty &&
      !window.confirm(
        "Discard this uncommitted played-note preview before changing context? Export it first if you want to keep it.",
      )
    )
      return;
    setDirty(false);
    setSeedPreset(null);
    action();
  }
  return (
    <section
      className="arrangement-workspace"
      aria-label="Arrangement workspace"
    >
      <h2>Arrangements & played notes</h2>
      <div className="builder-controls">
        <label>
          Arrangement
          <select
            aria-label="Active arrangement"
            value={arrangement?.id ?? ""}
            onChange={(event) =>
              select(() => {
                setArrangementId(event.target.value);
                setPartId("");
                setVoicingId("");
              })
            }
          >
            {song.arrangements.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Part
          <select
            aria-label="Active performed part"
            value={part?.id ?? ""}
            onChange={(event) =>
              select(() => {
                setPartId(event.target.value);
                setVoicingId("");
              })
            }
          >
            {arrangement?.parts.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.name} · {entry.role || "unassigned role"}
              </option>
            ))}
          </select>
        </label>
        <label>
          Harmonic event
          <select
            aria-label="Active performed harmonic event"
            value={harmonic?.id ?? ""}
            onChange={(event) =>
              select(() => {
                setVoicingId("");
                onSelectHarmony(event.target.value);
              })
            }
          >
            {song.sections.flatMap((section) =>
              section.chords.map((event, index) => (
                <option key={event.id} value={event.id}>
                  {section.name} · {index + 1} ·{" "}
                  {formatChordSymbol(event, preference)}
                </option>
              )),
            )}
          </select>
        </label>
        <label>
          Voicing
          <select
            aria-label="Active performed voicing"
            value={voicing?.id ?? "new"}
            onChange={(event) => select(() => setVoicingId(event.target.value))}
          >
            <option value="new">New independent voicing</option>
            {choices.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      {arrangement && part && harmonic ? (
        <VoicingBuilder
          key={`${arrangement.id}-${part.id}-${harmonic.id}-${voicing?.id ?? "new"}-${epoch}`}
          song={song}
          arrangement={arrangement}
          part={part}
          harmonic={harmonic}
          voicing={voicing}
          editable={editable}
          execute={execute}
          report={report}
          seedPreset={seedPreset}
          onPickPreset={(preset) =>
            select(() => {
              setSeedPreset(preset);
              setVoicingId("new");
              setEpoch((value) => value + 1);
              setDirty(true);
            })
          }
          onDirty={(value) => {
            setDirty(value);
            if (!value) setSeedPreset(null);
          }}
          onApplied={(before, after) => {
            setUndo({ before, after });
            const created = after.voicings.find(
              (entry) =>
                !before.voicings.some((previous) => previous.id === entry.id),
            );
            if (created) setVoicingId(created.id);
          }}
        />
      ) : (
        <p>
          Add a harmonic event and an arrangement with a part to prepare played
          notes.
        </p>
      )}
      {editable && undo && (
        <button
          type="button"
          onClick={() => {
            if (
              dirty &&
              !window.confirm(
                "Discard the current preview before undoing the last applied performed edit?",
              )
            )
              return;
            void execute({
              type: "replaceArrangement",
              songId: song.id,
              arrangementId: undo.after.id,
              expected: undo.after,
              arrangement: undo.before,
            })
              .then(() => {
                setUndo(null);
                setDirty(false);
                setEpoch((value) => value + 1);
              })
              .catch(report);
          }}
        >
          Undo last played-note edit
        </button>
      )}
    </section>
  );
}
