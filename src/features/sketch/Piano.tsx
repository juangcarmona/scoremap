import { chordLabel, chordNotes, pianoKeys } from "./chords";
import type { Chord } from "../library/domain";
const keys = pianoKeys();
export function Piano({ chord }: { chord: Chord }) {
  const notes = new Set(chordNotes(chord));
  return (
    <figure className="piano">
      <figcaption>
        <strong>{chordLabel(chord)}</strong>
        <span>
          {chord.root.replace("b", "♭").replace("#", "♯")} {chord.quality} ·
          C3–B4
        </span>
      </figcaption>
      <svg
        viewBox="0 0 1400 380"
        role="img"
        aria-label={`${chord.root} ${chord.quality} piano keyboard`}
      >
        {[false, true].map((black) => (
          <g key={String(black)}>
            {keys
              .filter((k) => k.black === black)
              .map((key) => (
                <g key={key.midi}>
                  <rect
                    data-midi={key.midi}
                    data-note={key.name}
                    data-highlighted={notes.has(key.pitchClass)}
                    x={key.x * 100 + 1}
                    y={1}
                    width={key.width * 100 - 2}
                    height={black ? 224 : 358}
                    rx="2"
                    className={`${black ? "black-key" : "white-key"}${notes.has(key.pitchClass) ? " highlighted" : ""}`}
                  />
                  <text
                    x={(key.x + key.width / 2) * 100}
                    y={black ? 190 : 325}
                    textAnchor="middle"
                    className={`${black ? "black-label" : "white-label"}${notes.has(key.pitchClass) ? " highlighted-label" : ""}`}
                  >
                    {key.name}
                  </text>
                </g>
              ))}
          </g>
        ))}
      </svg>
      <p>Highlighted keys form the chord in each octave.</p>
    </figure>
  );
}
