import type { PianoPitch } from "../sketch/PerformedPiano";

const blackClasses = new Set([1, 3, 6, 8, 10]);
const keys = Array.from({ length: 88 }, (_, index) => index + 21).map(
  (midi, index, all) => {
    const black = blackClasses.has(midi % 12);
    const precedingWhites = all
      .slice(0, index)
      .filter((note) => !blackClasses.has(note % 12)).length;
    return {
      midi,
      black,
      octave: Math.floor(midi / 12) - 1,
      x: black ? precedingWhites - 0.3 : precedingWhites,
      width: black ? 0.6 : 1,
    };
  },
);

export function PianoOverview({
  pitches,
  firstOctave,
  octaves,
}: {
  pitches: readonly PianoPitch[];
  firstOctave: number;
  octaves: number;
}) {
  const selected = new Set(pitches.map((pitch) => pitch.midi));
  const firstMidi = (firstOctave + 1) * 12;
  const lastMidi = firstMidi + octaves * 12 - 1;
  return (
    <figure className="piano-overview">
      <figcaption>
        Full piano · A0 to C8 · outlined keys are in the enlarged view
      </figcaption>
      <svg
        viewBox="0 0 52 5"
        role="img"
        aria-label={`88-key piano overview; enlarged view begins at C${firstOctave} and spans ${octaves} octaves. Select the visible octave using the controls below.`}
      >
        {[false, true].flatMap((black) =>
          keys
            .filter((key) => key.black === black)
            .map((key) => {
              const played = selected.has(key.midi);
              const active = key.midi >= firstMidi && key.midi <= lastMidi;
              const fill = played
                ? `var(--lh-octave-${key.octave}-${black ? "black" : "white"}, var(--lh-key-mark))`
                : `var(--lh-key-${black ? "black" : "white"})`;
              return (
                <rect
                  key={key.midi}
                  x={key.x}
                  y={0}
                  width={key.width}
                  height={black ? 3 : 5}
                  fill={fill}
                  stroke={active ? "var(--lh-action)" : "var(--lh-border)"}
                  strokeWidth={active ? 0.13 : 0.04}
                  data-midi={key.midi}
                  data-selected={played}
                  data-in-view={active}
                />
              );
            }),
        )}
      </svg>
    </figure>
  );
}
