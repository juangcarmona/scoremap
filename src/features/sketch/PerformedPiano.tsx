import { pianoKeys } from "./chords";
import {
  performedPitchAt,
  theoreticalHarmony,
} from "../../shared/music/theory";
import type { HarmonyIdentity } from "../../shared/music/harmony";
import { useNotation } from "../../shared/music/NotationContext";
import { formatNote } from "../../shared/music/notation";
export type PianoPitch = { spelling: string; octave: number; midi: number };
export function PerformedPiano({
  harmony,
  pitches,
  firstOctave,
  octaves,
  editable,
  onToggle,
  label,
  physicalRange,
}: {
  harmony: HarmonyIdentity;
  pitches: readonly PianoPitch[];
  firstOctave: number;
  octaves: 2 | 3;
  editable: boolean;
  onToggle: (pitch: PianoPitch) => void;
  label: string;
  physicalRange?: [number, number];
}) {
  const { preference } = useNotation();
  const keys = pianoKeys(firstOctave, octaves);
  const theory = theoreticalHarmony(harmony);
  const spellings = new Map(
    theory.tones.map((tone) => [tone.pitchClass, tone.spelling]),
  );
  if (theory.bass) spellings.set(theory.bass.pitchClass, theory.bass.spelling);
  const visible = new Set(keys.map((key) => key.midi));
  const outside = pitches.filter((pitch) => !visible.has(pitch.midi));
  const whites = keys.filter((key) => !key.black).length;
  return (
    <figure
      className="performed-piano"
      aria-label={label}
      data-editable={editable}
    >
      <figcaption>○ Theoretical reference · ● Performed note</figcaption>
      <div
        className="keyboard-scroll"
        role="region"
        tabIndex={0}
        aria-label={`${label} · scroll piano view`}
      >
        <div
          className="keyboard-keys"
          style={{ width: editable ? `${whites * 80}px` : "100%" }}
        >
          {[false, true].flatMap((black) =>
            keys
              .filter((key) => key.black === black)
              .map((key) => {
                const exact = pitches.find((pitch) => pitch.midi === key.midi);
                const pitch =
                  exact ??
                  performedPitchAt(key.midi, spellings.get(key.pitchClass));
                const name = formatNote(
                  `${pitch.spelling}${pitch.octave}`,
                  preference,
                );
                const theoretical = spellings.has(key.pitchClass);
                const physical =
                  !physicalRange ||
                  (key.midi >= physicalRange[0] &&
                    key.midi <= physicalRange[1]);
                return (
                  <button
                    key={key.midi}
                    type="button"
                    className={`performed-key ${black ? "played-black" : "played-white"}`}
                    data-midi={key.midi}
                    data-theoretical={theoretical}
                    data-performed={!!exact}
                    data-physical={physical}
                    style={{
                      left: `${(key.x / whites) * 100}%`,
                      width: `${(key.width / whites) * 100}%`,
                    }}
                    aria-label={`${name} · ${exact ? "performed" : "not performed"}${theoretical ? " · theoretical tone" : ""}${physical ? "" : " · outside physical range"}`}
                    aria-pressed={!!exact}
                    disabled={!editable || !physical}
                    onClick={() => onToggle(pitch)}
                  >
                    <span className="key-state" aria-hidden="true">
                      {exact ? "●" : theoretical ? "○" : ""}
                    </span>
                    <span className="key-pitch">{name}</span>
                  </button>
                );
              }),
          )}
        </div>
      </div>
      {!editable && (
        <div className="piano-octave-labels" aria-label="Visible octave starts">
          {Array.from({ length: octaves }, (_, index) => (
            <span key={index}>
              {formatNote(`C${firstOctave + index}`, preference)}
            </span>
          ))}
        </div>
      )}
      <p>
        {editable
          ? "Scroll sideways for more keys. "
          : "The complete selected range fits this view. "}
        All performed notes are listed below.
      </p>
      <p className="played-note-list" aria-live="polite">
        Performed:{" "}
        {pitches.length
          ? pitches
              .map((pitch) =>
                formatNote(`${pitch.spelling}${pitch.octave}`, preference),
              )
              .join(" · ")
          : "Silent — no performed notes"}
      </p>
      {outside.length > 0 && (
        <p role="status">
          Outside this view:{" "}
          {outside
            .map((pitch) =>
              formatNote(`${pitch.spelling}${pitch.octave}`, preference),
            )
            .join(" · ")}
          . Change the view to inspect them; their pitches are retained.
        </p>
      )}
    </figure>
  );
}
