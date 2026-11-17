import { performedPitchAt } from "../../shared/music/theory";
import { formatNote } from "../../shared/music/notation";
import { useNotation } from "../../shared/music/NotationContext";
export function PitchRange({
  value,
  prefix = "",
  legend = "Physical key range",
}: {
  value: [number, number];
  prefix?: string;
  legend?: string;
}) {
  const { preference } = useNotation();
  return (
    <fieldset className="pitch-range">
      <legend>{legend}</legend>
      {["Lowest", "Highest"].map((label, index) => (
        <label key={label}>
          {label} note
          <select
            aria-label={`${label} note`}
            name={`${prefix}${index === 0 ? "lower" : "upper"}`}
            defaultValue={value[index]}
            required
          >
            {Array.from({ length: 128 }, (_, midi) => {
              const pitch = performedPitchAt(midi);
              return (
                <option key={midi} value={midi}>
                  {formatNote(`${pitch.spelling}${pitch.octave}`, preference)}
                </option>
              );
            })}
          </select>
        </label>
      ))}
    </fieldset>
  );
}
export function readRange(values: FormData, prefix = ""): [number, number] {
  return [
    Number(values.get(prefix + "lower")),
    Number(values.get(prefix + "upper")),
  ];
}
