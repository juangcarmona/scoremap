import { isRichSection, isRichSong } from "./score";
import { RichHarmonyEditor } from "./RichHarmonyEditor";
import { sectionRemovalImpact } from "./scoreCommands";
import type { HarmonyIdentity } from "../../shared/music/harmony";
import { useState } from "react";
import type {
  Chord,
  Command,
  Mode,
  Section,
  LegacySection,
  Song,
} from "./domain";
import { useNotation } from "../../shared/music/NotationContext";
import { formatNote } from "../../shared/music/notation";
import { Piano } from "../sketch/Piano";
import { chordLabel } from "../sketch/chords";
const roots = [
  "C",
  "C#",
  "Db",
  "D",
  "D#",
  "Eb",
  "E",
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
  "E#",
  "Fb",
];
type Props = {
  song: Song;
  noteDrafts: ReadonlyMap<string, string>;
  setNoteDraft: (id: string, text: string) => void;
  mode: Mode;
  execute: (command: Command) => Promise<void>;
  report: (error: unknown) => void;
};
function ChordEditor(props: {
  section: Section;
  song: Song;
  songId: string;
  execute: Props["execute"];
  report: Props["report"];
}) {
  if (isRichSection(props.section)) {
    if (!isRichSong(props.song))
      throw new Error("Identified harmony requires its upgraded song.");
    return (
      <RichHarmonyEditor
        section={props.section}
        song={props.song}
        execute={props.execute}
        report={props.report}
      />
    );
  }
  return (
    <LegacyChordEditor
      section={props.section}
      songId={props.songId}
      execute={props.execute}
      report={props.report}
    />
  );
}
function LegacyChordEditor({
  section,
  songId,
  execute,
  report,
}: {
  section: LegacySection;
  songId: string;
  execute: Props["execute"];
  report: Props["report"];
}) {
  const { preference } = useNotation();
  const [editing, setEditing] = useState<number | null>(null);
  const current = editing === null ? undefined : section.chords[editing];
  return (
    <form
      className="chord-editor"
      key={`${section.id}-${editing}-${current?.root}-${current?.quality}`}
      aria-label={`Chord editor for ${section.name}`}
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const chord: Chord = {
          root: String(data.get("root")),
          quality: data.get("quality") === "minor" ? "minor" : "major",
        };
        const chords = [...section.chords];
        if (editing === null) chords.push(chord);
        else chords[editing] = chord;
        void execute({
          type: "updateSection",
          songId,
          sectionId: section.id,
          patch: { chords },
        })
          .then(() => setEditing(null))
          .catch(report);
      }}
    >
      <label>
        Chord position
        <select
          aria-label={`Chord position for ${section.name}`}
          value={editing === null ? "new" : String(editing)}
          onChange={(e) =>
            setEditing(e.target.value === "new" ? null : Number(e.target.value))
          }
        >
          <option value="new">Add at end</option>
          {section.chords.map((c, i) => (
            <option key={i} value={i}>
              {i + 1}. {chordLabel(c, preference)}
            </option>
          ))}
        </select>
      </label>
      <label>
        Root
        <select
          name="root"
          aria-label={`Root for ${section.name}`}
          defaultValue={current?.root ?? "C"}
        >
          {roots.map((r) => (
            <option key={r} value={r}>
              {formatNote(r, preference)}
            </option>
          ))}
        </select>
      </label>
      <label>
        Quality
        <select
          name="quality"
          aria-label={`Quality for ${section.name}`}
          defaultValue={current?.quality ?? "major"}
        >
          <option value="major">Major</option>
          <option value="minor">Minor</option>
        </select>
      </label>
      <button type="submit">
        {editing === null ? "Add chord" : "Change chord"}
      </button>
      {editing !== null && (
        <button
          type="button"
          onClick={() => {
            const chords = section.chords.filter((_, i) => i !== editing);
            void execute({
              type: "updateSection",
              songId,
              sectionId: section.id,
              patch: { chords },
            })
              .then(() => setEditing(null))
              .catch(report);
          }}
        >
          Remove chord
        </button>
      )}
    </form>
  );
}
export function Sketch({
  song,
  noteDrafts,
  setNoteDraft,
  mode,
  execute,
  report,
}: Props) {
  const { preference } = useNotation();
  const [selection, setSelection] = useState<{
    sectionId: string;
    index: number;
    eventId?: string;
  } | null>(null);
  const [notesOpen, setNotesOpen] = useState(false);
  const selectedSection = song.sections.find(
    (s) => s.id === selection?.sectionId,
  );
  const chosen =
    (selectedSection && isRichSection(selectedSection)
      ? selectedSection.chords.find((event) => event.id === selection?.eventId)
      : selectedSection?.chords[selection?.index ?? -1]) ??
    song.sections.flatMap<HarmonyIdentity>((s) => s.chords)[0];
  const edit = mode === "edit";
  function move(sectionId: string, direction: number) {
    const order = song.sections.map((s) => s.id);
    const i = order.indexOf(sectionId),
      j = i + direction;
    if (j < 0 || j >= order.length) return;
    [order[i], order[j]] = [order[j]!, order[i]!];
    void execute({ type: "reorderSections", songId: song.id, order }).catch(
      report,
    );
  }
  return (
    <div className="sketch-layout">
      <div className="structure">
        <div className="sketch-caption">
          <h2>Song sketch</h2>
          <span>
            {song.sections.length}{" "}
            {song.sections.length === 1 ? "section" : "sections"}
          </span>
        </div>
        {song.notes && !edit && <p className="song-note">{song.notes}</p>}
        {edit && (
          <details className="song-details">
            <summary>Song details & personal notes</summary>
            <form
              aria-label="Song details"
              onSubmit={(e) => {
                e.preventDefault();
                const data = new FormData(e.currentTarget);
                void execute({
                  type: "updateSong",
                  songId: song.id,
                  patch: {
                    title: String(data.get("title")),
                    artist: String(data.get("artist")),
                  },
                }).catch(report);
              }}
            >
              <label>
                Title
                <input name="title" defaultValue={song.title} required />
              </label>
              <label>
                Artist (optional)
                <input name="artist" defaultValue={song.artist} />
              </label>
              <button type="submit">Save details</button>
            </form>
            <label>
              Song notes
              {/* Identity-keyed drafts outlive this sketch and queued acknowledgements. */}
              <textarea
                aria-label="Song notes"
                value={noteDrafts.get(song.id) ?? song.notes}
                placeholder="Personal reminders, cues, sounds…"
                onChange={(e) => {
                  setNoteDraft(song.id, e.target.value);
                  void execute({
                    type: "updateSong",
                    songId: song.id,
                    patch: { notes: e.target.value },
                  }).catch(report);
                }}
              />
            </label>
          </details>
        )}
        {song.sections.length === 0 && (
          <div className="empty-sketch">
            <h3>Start with the shape of your song.</h3>
            <p>
              {edit
                ? "Add an Intro, Verse, Chorus or a section of your own."
                : "This song has no sections yet. Switch to Edit to prepare it."}
            </p>
          </div>
        )}
        <ol className="section-list">
          {song.sections.map((section, index) => (
            <li
              key={section.id}
              className="section"
              data-section-id={section.id}
            >
              <header>
                <div className="section-heading">
                  <span className="section-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3>{section.name}</h3>
                  <span
                    className="repeat"
                    aria-label={`Repeat ${section.repeat} times`}
                  >
                    ×{section.repeat}
                  </span>
                </div>
                {edit && (
                  <div className="section-actions">
                    <button
                      type="button"
                      aria-label={`Move ${section.name} up`}
                      disabled={index === 0}
                      onClick={() => move(section.id, -1)}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      aria-label={`Move ${section.name} down`}
                      disabled={index === song.sections.length - 1}
                      onClick={() => move(section.id, 1)}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      aria-label={`Remove ${section.name}`}
                      onClick={() => {
                        const impact = isRichSong(song)
                          ? sectionRemovalImpact(song, section.id)
                          : undefined;
                        if (
                          window.confirm(
                            `Remove ${section.name} and its chords and notes?${impact ? ` This also removes ${impact.notes.length} performed notes and ${impact.voicings.length} voicings across arrangements, reconciles ${impact.bindings.length} assignments and unlinks ${impact.ties.length} ties.` : ""}`,
                          )
                        )
                          void execute({
                            type: "removeSection",
                            songId: song.id,
                            sectionId: section.id,
                            ...(impact ? { reconciliation: impact } : {}),
                          }).catch(report);
                      }}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </header>
              <div
                className="chord-sequence"
                aria-label={`Chord sequence for ${section.name}`}
              >
                {section.chords.map((chord, i) => (
                  <button
                    type="button"
                    key={"id" in chord ? chord.id : i}
                    aria-label={`${section.name} chord ${i + 1}: ${chordLabel(chord, preference)}`}
                    aria-pressed={
                      selection?.sectionId === section.id &&
                      ("id" in chord
                        ? selection.eventId === chord.id
                        : selection.index === i)
                    }
                    onClick={() =>
                      setSelection({
                        sectionId: section.id,
                        index: i,
                        ...("id" in chord ? { eventId: chord.id } : {}),
                      })
                    }
                  >
                    {chordLabel(chord, preference)}
                  </button>
                ))}
                {!section.chords.length && (
                  <span className="muted">
                    {edit
                      ? "Add the chords you want to remember."
                      : "No chords assigned."}
                  </span>
                )}
              </div>
              {section.notes && !edit && (
                <p className="section-note">{section.notes}</p>
              )}
              {edit && (
                <details className="section-edit">
                  <summary>Edit {section.name}</summary>
                  <form
                    className="section-metadata"
                    aria-label={`Section details for ${section.name}`}
                    onSubmit={(e) => {
                      e.preventDefault();
                      const data = new FormData(e.currentTarget);
                      void execute({
                        type: "updateSection",
                        songId: song.id,
                        sectionId: section.id,
                        patch: {
                          name: String(data.get("name")),
                          repeat: Number(data.get("repeat")),
                        },
                      }).catch(report);
                    }}
                  >
                    <label>
                      Section name
                      <input name="name" defaultValue={section.name} required />
                    </label>
                    <label>
                      Repetitions
                      <input
                        name="repeat"
                        type="number"
                        min="1"
                        max="99"
                        step="1"
                        defaultValue={section.repeat}
                        required
                      />
                    </label>
                    <button type="submit">Save section</button>
                  </form>
                  <ChordEditor
                    song={song}
                    section={section}
                    songId={song.id}
                    execute={execute}
                    report={report}
                  />
                  <label>
                    Section notes
                    <textarea
                      aria-label={`Notes for ${section.name}`}
                      value={noteDrafts.get(section.id) ?? section.notes}
                      placeholder="Your cue for this section…"
                      onChange={(e) => {
                        setNoteDraft(section.id, e.target.value);
                        void execute({
                          type: "updateSection",
                          songId: song.id,
                          sectionId: section.id,
                          patch: { notes: e.target.value },
                        }).catch(report);
                      }}
                    />
                  </label>
                </details>
              )}
            </li>
          ))}
        </ol>
        {edit && (
          <form
            className="add-section"
            aria-label="Add section"
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const data = new FormData(form);
              void execute({
                type: "insertSection",
                songId: song.id,
                id: crypto.randomUUID(),
                name: String(data.get("section")),
              })
                .then(() => form.reset())
                .catch(report);
            }}
          >
            <label>
              New section
              <input
                name="section"
                list="section-names"
                placeholder="Intro, Verse, Chorus…"
                required
              />
            </label>
            <datalist id="section-names">
              {[
                "Intro",
                "Verse",
                "Chorus",
                "Pre-chorus",
                "Bridge",
                "Solo",
                "Outro",
              ].map((n) => (
                <option key={n} value={n} />
              ))}
            </datalist>
            <button type="submit" className="primary">
              Add section
            </button>
          </form>
        )}
        {!edit && song.notes && (
          <button
            type="button"
            className="subtle"
            onClick={() => setNotesOpen(!notesOpen)}
          >
            {notesOpen ? "Hide" : "Show"} full personal notes
          </button>
        )}
        {notesOpen && !edit && <pre className="full-notes">{song.notes}</pre>}
      </div>
      <aside className="chord-reference" aria-label="Visual chord reference">
        <h2>Chord reference</h2>
        {chosen ? (
          <Piano chord={chosen} />
        ) : (
          <p className="muted">
            {edit
              ? "Add a chord to a section to see its notes."
              : "This sketch has no chord references."}
          </p>
        )}
        <p className="reference-hint">
          Tap any chord in the sketch to see its keys.
        </p>
      </aside>
    </div>
  );
}
