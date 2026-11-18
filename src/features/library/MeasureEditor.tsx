import type { Command } from "./domain";
import type { RichSection, RichSong } from "./score";
import { measureRemovalImpact } from "./scoreCommands";
import { describeRemoval } from "./removalPreview";
import { musicalFraction, parseMusicalFraction } from "./musicalInput";
import { useNotation } from "../../shared/music/NotationContext";
export function MeasureEditor({
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
  return (
    <details className="song-details">
      <summary>Measures in {section.name}</summary>
      <p>
        Offsets and durations use quarter-note units. Changing meter or length
        never clips or moves existing music.
      </p>
      {section.measures.map((measure, index) => (
        <section
          key={measure.id}
          aria-label={`Measure ${index + 1} in ${section.name}`}
        >
          <h4>Measure {index + 1}</h4>
          <form
            key={`${measure.id}-${JSON.stringify(measure.meter)}-${musicalFraction(measure.length)}`}
            className="builder-controls"
            onSubmit={(event) => {
              event.preventDefault();
              const values = new FormData(event.currentTarget);
              try {
                void execute({
                  type: "updateMeasure",
                  songId: song.id,
                  sectionId: section.id,
                  measureId: measure.id,
                  patch: {
                    meter: {
                      numerator: Number(values.get("numerator")),
                      denominator: Number(values.get("denominator")),
                    },
                    length: parseMusicalFraction(String(values.get("length"))),
                  },
                }).catch(report);
              } catch (error) {
                report(error);
              }
            }}
          >
            <label>
              Meter beats
              <input
                name="numerator"
                type="number"
                min={1}
                max={Number.MAX_SAFE_INTEGER}
                step={1}
                defaultValue={measure.meter.numerator}
                required
              />
            </label>
            <label>
              Beat unit
              <select
                name="denominator"
                defaultValue={measure.meter.denominator}
              >
                {Array.from({ length: 53 }, (_, power) => 2 ** power).map(
                  (value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ),
                )}
              </select>
            </label>
            <label>
              Length · quarter notes
              <input
                name="length"
                defaultValue={musicalFraction(measure.length)}
                required
              />
            </label>
            <button type="submit">Save measure {index + 1}</button>
          </form>
          {[-1, 1].map((direction) => (
            <button
              key={direction}
              type="button"
              disabled={
                index + direction < 0 ||
                index + direction >= section.measures.length
              }
              aria-label={`Move measure ${index + 1} ${direction < 0 ? "earlier" : "later"}`}
              onClick={() => {
                const order = section.measures.map((entry) => entry.id);
                [order[index], order[index + direction]] = [
                  order[index + direction]!,
                  order[index]!,
                ];
                void execute({
                  type: "reorderMeasures",
                  songId: song.id,
                  sectionId: section.id,
                  order,
                }).catch(report);
              }}
            >
              {direction < 0 ? "Move earlier" : "Move later"}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              const impact = measureRemovalImpact(song, section.id, measure.id);
              if (
                !window.confirm(
                  `Remove measure ${index + 1} and its shared harmonic events?\n${describeRemoval(song, impact, preference)}\nAll unaffected music remains unchanged.`,
                )
              )
                return;
              void execute({
                type: "removeMeasure",
                songId: song.id,
                sectionId: section.id,
                measureId: measure.id,
                reconciliation: impact,
              }).catch(report);
            }}
          >
            Remove measure {index + 1}
          </button>
        </section>
      ))}
      <button
        type="button"
        onClick={() => {
          void execute({
            type: "addMeasure",
            songId: song.id,
            sectionId: section.id,
            measure: {
              id: crypto.randomUUID(),
              meter: { numerator: 4, denominator: 4 },
              length: { n: 4, d: 1 },
            },
          }).catch(report);
        }}
      >
        Add empty measure to {section.name}
      </button>
    </details>
  );
}
