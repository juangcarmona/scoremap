import { useEffect, useRef, useState } from "react";
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
  showLegend = true,
}: {
  harmony: HarmonyIdentity;
  pitches: readonly PianoPitch[];
  firstOctave: number;
  octaves: 2 | 3;
  editable: boolean;
  onToggle: (pitch: PianoPitch) => void;
  label: string;
  physicalRange?: [number, number];
  showLegend?: boolean;
}) {
  const { preference } = useNotation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [clipped, setClipped] = useState("");
  const pitchIds = pitches.map((pitch) => pitch.midi).join(",");
  const clippedPitches = pitches.filter((pitch) =>
    clipped.split(",").includes(String(pitch.midi)),
  );
  function updateClipped() {
    const container = scrollRef.current;
    if (!container || editable) return;
    const bounds = container.getBoundingClientRect();
    const hidden = [
      ...container.querySelectorAll<HTMLElement>(
        '.performed-key[data-performed="true"]',
      ),
    ]
      .filter((key) => {
        const rect = key.getBoundingClientRect();
        return rect.left < bounds.left || rect.right > bounds.right;
      })
      .map((key) => key.dataset.midi);
    setClipped(hidden.join(","));
  }
  useEffect(() => {
    updateClipped();
    const container = scrollRef.current;
    if (!container || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(updateClipped);
    observer.observe(container);
    return () => observer.disconnect();
    // Recalculate when the performed pitches or selected range change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pitchIds, firstOctave, octaves, editable, preference.mode]);
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
      data-notation={preference.mode}
    >
      {showLegend && (
        <figcaption>○ Theoretical reference · ● Performed note</figcaption>
      )}
      <div
        className="keyboard-scroll"
        ref={scrollRef}
        onScroll={updateClipped}
        role="region"
        tabIndex={0}
        aria-label={`${label} · scroll piano view`}
      >
        <div
          className="keyboard-keys"
          style={{
            width: editable ? `${whites * 80}px` : `${whites * 3.5}rem`,
          }}
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
      {editable && (
        <p>
          Scroll sideways for more keys. All performed notes are listed below.
        </p>
      )}
      <p className="played-note-list" aria-live="polite">
        Performed:{" "}
        {pitches.length
          ? pitches
              .map((pitch) =>
                formatNote(`${pitch.spelling}${pitch.octave}`, preference),
              )
              .join(" · ")
          : "Silent — no performed notes"}
        {clippedPitches.length > 0 && (
          <span>
            {" · Scroll to see "}
            {clippedPitches
              .map((pitch) =>
                formatNote(`${pitch.spelling}${pitch.octave}`, preference),
              )
              .join(" · ")}
          </span>
        )}
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
