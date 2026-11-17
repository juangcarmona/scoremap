import { chordLabel, chordNotes, pianoKeys, spelledChordNotes } from "./chords";
import type { HarmonyIdentity } from "../../shared/music/harmony";
import { useNotation } from "../../shared/music/NotationContext";
import { formatNote } from "../../shared/music/notation";
const keys = pianoKeys();
export function Piano({ chord }: { chord: HarmonyIdentity }) {
  const { preference } = useNotation();
  const notes = new Set(chordNotes(chord));
  return (
    <figure className="piano">
      <figcaption>
        <strong>{chordLabel(chord, preference)}</strong>
        <span>
          {formatNote(chord.root, preference)} {chord.quality} ·
          {formatNote("C3", preference)}–{formatNote("B4", preference)}
        </span>
      </figcaption>
      <svg
        viewBox="0 0 1400 380"
        role="img"
        aria-label={`${formatNote(chord.root, preference, true)} ${chord.quality} piano keyboard`}
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
                  >
                    <title>
                      {formatNote(key.name, preference)}
                      {notes.has(key.pitchClass) ? " · chord tone" : ""}
                    </title>
                  </rect>
                  {key.pitchClass === 0 && (
                    <text
                      x={(key.x + key.width / 2) * 100}
                      y={black ? 190 : 325}
                      textAnchor="middle"
                      className={`${black ? "black-label" : "white-label"}${notes.has(key.pitchClass) ? " highlighted-label" : ""}${preference.mode === "dual" ? " dual-label" : ""}`}
                      textLength={preference.mode === "dual" ? 90 : undefined}
                      lengthAdjust="spacingAndGlyphs"
                    >
                      {formatNote(key.name, preference)}
                    </text>
                  )}
                </g>
              ))}
          </g>
        ))}
      </svg>
      <p>
        Theoretical notes:{" "}
        {spelledChordNotes(chord)
          .map((note) => formatNote(note, preference))
          .join(" · ")}
      </p>
      <p>Highlighted keys form the chord in each octave.</p>
    </figure>
  );
}
