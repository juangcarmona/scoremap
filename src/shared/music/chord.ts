export type Chord = { root: string; quality: "major" | "minor" };
export function assertChord(value: unknown): asserts value is Chord {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Expected an object.");
  const chord = value as Record<string, unknown>;
  if (
    Object.keys(chord).length !== 2 ||
    !Object.hasOwn(chord, "root") ||
    !Object.hasOwn(chord, "quality")
  )
    throw new Error("Missing or unexpected data fields.");
  if (
    typeof chord.root !== "string" ||
    chord.root !== chord.root.trim() ||
    !/^[A-G][#b]?$/.test(chord.root)
  )
    throw new Error(
      "Choose a root from A to G with an optional sharp or flat.",
    );
  if (chord.quality !== "major" && chord.quality !== "minor")
    throw new Error("Choose a major or minor chord.");
}
