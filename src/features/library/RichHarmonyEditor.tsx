import { parseMusicalFraction as fraction } from "./musicalInput";
import { MeasureEditor } from "./MeasureEditor";
import { describeRemoval } from "./removalPreview";
import { useState } from "react";
import {
  harmonyCatalogue,
  type ChordQuality,
} from "../../shared/music/catalogue";
import {
  alterations,
  harmonyIdentity,
  type HarmonyIdentity,
  type Alteration,
} from "../../shared/music/harmony";
import { theoreticalHarmony } from "../../shared/music/theory";
import { formatChordSymbol, formatNote } from "../../shared/music/notation";
import { useNotation } from "../../shared/music/NotationContext";
import type { Command } from "./domain";
import type { HarmonicEvent, RichSection, RichSong } from "./score";
import { incompatibleVoicings, sharedImpact } from "./scoreCommands";
const roots = [
  "C",
  "C#",
  "Db",
  "D",
  "D#",
  "Eb",
  "E",
  "Fb",
  "E#",
  "F",
  "F#",
  "Gb",
  "G",
  "G#",
  "Ab",
  "A",
  "A#",
  "Bb",
  "B",
  "Cb",
  "B#",
];
function TimingEditor({
  event,
  section,
  songId,
  execute,
  report,
}: {
  event: HarmonicEvent;
  section: RichSection;
  songId: string;
  execute: (command: Command) => Promise<void>;
  report: (error: unknown) => void;
}) {
  return (
    <form
      className="chord-editor"
      key={`${event.id}-${event.start.n}/${event.start.d}-${event.duration.n}/${event.duration.d}`}
      aria-label={`Timing for ${section.name}`}
      onSubmit={(submit) => {
        submit.preventDefault();
        const values = new FormData(submit.currentTarget);
        try {
          void execute({
            type: "setHarmonyTiming",
            songId,
            eventId: event.id,
            measureId: String(values.get("measure")),
            start: fraction(String(values.get("start"))),
            duration: fraction(String(values.get("duration"))),
          }).catch(report);
        } catch (error) {
          report(error);
        }
      }}
    >
      <label>
        Measure
        <select
          name="measure"
          defaultValue={event.measureId}
          aria-label={`Measure for ${section.name}`}
        >
          {section.measures.map((measure, index) => (
            <option key={measure.id} value={measure.id}>
              Measure {index + 1}
            </option>
          ))}
        </select>
      </label>
      <label>
        Start · quarter notes
        <input
          name="start"
          defaultValue={`${event.start.n}/${event.start.d}`}
          aria-label={`Start for ${section.name}`}
          required
        />
      </label>
      <label>
        Duration · quarter notes
        <input
          name="duration"
          defaultValue={`${event.duration.n}/${event.duration.d}`}
          aria-label={`Duration for ${section.name}`}
          required
        />
      </label>
      <button type="submit">Save timing</button>
    </form>
  );
}
export function RichHarmonyEditor({
  song,
  section,
  execute,
  report,
}: {
  song: RichSong;
  section: RichSection;
  execute: (command: Command) => Promise<void>;
  report: (error: unknown) => void;
}) {
  const { preference } = useNotation();
  const [selected, setSelected] = useState<string | null>(null);
  const [draft, setDraft] = useState<HarmonyIdentity>({
    root: "C",
    quality: "major",
  });
  const current = section.chords.find((event) => event.id === selected);
  let notes = "";
  let invalid = "";
  try {
    notes = theoreticalHarmony(draft)
      .tones.map((tone) => formatNote(tone.spelling, preference))
      .join(" · ");
  } catch (error) {
    invalid =
      error instanceof Error ? error.message : "The harmony is unsupported.";
  }
  return (
    <div>
      <form
        className="chord-editor"
        aria-label={`Chord editor for ${section.name}`}
        onSubmit={(submit) => {
          submit.preventDefault();
          if (invalid) {
            report(new Error(invalid));
            return;
          }
          const affected = current
            ? incompatibleVoicings(song, current.id, draft)
            : [];
          if (
            affected.length &&
            !window.confirm(
              `This harmony changes ${affected.map((voicing) => `“${voicing.name}” in “${voicing.arrangement}”`).join(", ")}. Keep their exact played notes as explicitly custom voicings?`,
            )
          )
            return;
          void execute(
            current
              ? {
                  type: "updateHarmony",
                  songId: song.id,
                  eventId: current.id,
                  harmony: draft,
                  customVoicings: affected.map((voicing) => voicing.id),
                }
              : {
                  type: "appendHarmony",
                  songId: song.id,
                  sectionId: section.id,
                  eventId: crypto.randomUUID(),
                  newMeasureId: crypto.randomUUID(),
                  harmony: draft,
                },
          )
            .then(() => setSelected(null))
            .catch(report);
        }}
      >
        <label>
          Chord position
          <select
            aria-label={`Chord position for ${section.name}`}
            value={selected ?? "new"}
            onChange={(event) => {
              const id = event.target.value;
              setSelected(id === "new" ? null : id);
              const choice = section.chords.find((chord) => chord.id === id);
              setDraft(
                choice
                  ? harmonyIdentity(choice)
                  : { root: "C", quality: "major" },
              );
            }}
          >
            <option value="new">Add at end</option>
            {section.chords.map((chord, index) => (
              <option key={chord.id} value={chord.id}>
                {index + 1}. {formatChordSymbol(chord, preference)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Root
          <select
            aria-label={`Root for ${section.name}`}
            value={draft.root}
            onChange={(event) =>
              setDraft({ ...draft, root: event.target.value })
            }
          >
            {roots.map((root) => (
              <option key={root} value={root}>
                {formatNote(root, preference)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Quality
          <select
            aria-label={`Quality for ${section.name}`}
            value={draft.quality}
            onChange={(event) =>
              setDraft({
                ...draft,
                quality: event.target.value as ChordQuality,
              })
            }
          >
            {(Object.keys(harmonyCatalogue) as ChordQuality[]).map(
              (quality) => (
                <option key={quality} value={quality}>
                  {quality.replaceAll("-", " ")}
                </option>
              ),
            )}
          </select>
        </label>
        <fieldset>
          <legend>Alterations · dominant chords</legend>
          {alterations.map((alteration) => (
            <label key={alteration}>
              <input
                type="checkbox"
                checked={draft.alterations?.includes(alteration) ?? false}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    alterations: event.target.checked
                      ? [...(draft.alterations ?? []), alteration]
                      : (draft.alterations ?? []).filter(
                          (value) => value !== alteration,
                        ),
                  })
                }
              />
              {alteration.replace("b", "♭").replace("#", "♯")}
            </label>
          ))}
          {(draft.alterations?.length ?? 0) > 0 && (
            <button
              type="button"
              onClick={() =>
                setDraft({ ...draft, alterations: [] as Alteration[] })
              }
            >
              Clear alterations
            </button>
          )}
        </fieldset>
        <label>
          Explicit slash bass
          <select
            aria-label={`Slash bass for ${section.name}`}
            value={draft.bass ?? ""}
            onChange={(event) => {
              const next = { ...draft };
              if (event.target.value) next.bass = event.target.value;
              else delete next.bass;
              setDraft(next);
            }}
          >
            <option value="">No specified bass</option>
            {roots.map((root) => (
              <option key={root} value={root}>
                {formatNote(root, preference)}
              </option>
            ))}
          </select>
        </label>
        <p role={invalid ? "alert" : "status"}>
          {invalid || `Theoretical preview: ${notes}`}
        </p>
        <button type="submit" disabled={!!invalid}>
          {current ? "Change chord" : "Add chord"}
        </button>
        {current && (
          <button
            type="button"
            className="danger-link"
            onClick={() => {
              const impact = sharedImpact(song, [current.id]);
              if (
                Object.values(impact).some((ids) => ids.length) &&
                !window.confirm(
                  `Remove this shared harmonic event, ${impact.voicings.length} voicings and ${impact.notes.length} performed notes? Related assignments/ties will be reconciled; other content remains.\n${describeRemoval(song, impact, preference)}`,
                )
              )
                return;
              void execute({
                type: "removeHarmony",
                songId: song.id,
                eventId: current.id,
                reconciliation: impact,
              })
                .then(() => setSelected(null))
                .catch(report);
            }}
          >
            Remove chord
          </button>
        )}
      </form>
      <MeasureEditor
        song={song}
        section={section}
        execute={execute}
        report={report}
      />
      {current && (
        <TimingEditor
          event={current}
          section={section}
          songId={song.id}
          execute={execute}
          report={report}
        />
      )}
    </div>
  );
}
