import { harmonyCatalogue, type ChordQuality } from "./catalogue";

export type Alteration = "b5" | "#5" | "b9" | "#9" | "#11" | "b13";
export type HarmonyIdentity = {
  root: string;
  quality: ChordQuality;
  alterations?: Alteration[];
  bass?: string;
};
export const alterations: readonly Alteration[] = [
  "b5",
  "#5",
  "b9",
  "#9",
  "#11",
  "b13",
];
export function isSpelledRoot(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value === value.trim() &&
    /^[A-G][#b]?$/u.test(value)
  );
}
export function assertHarmony(
  value: unknown,
): asserts value is HarmonyIdentity {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Expected a harmonic identity.");
  const data = value as Record<string, unknown>;
  if (
    !Object.hasOwn(data, "root") ||
    !Object.hasOwn(data, "quality") ||
    Object.keys(data).some(
      (key) => !["root", "quality", "alterations", "bass"].includes(key),
    ) ||
    !isSpelledRoot(data.root) ||
    typeof data.quality !== "string" ||
    !Object.hasOwn(harmonyCatalogue, data.quality)
  )
    throw new Error("Unsupported harmonic identity or root spelling.");
  if (
    ["bass", "alterations"].some(
      (key) => key in data && !Object.hasOwn(data, key),
    )
  )
    throw new Error("Harmonic fields must be explicit owned values.");
  if (data.bass !== undefined && !isSpelledRoot(data.bass))
    throw new Error("Choose a supported independently spelled bass.");
  if (data.alterations !== undefined) {
    if (
      !Array.isArray(data.alterations) ||
      data.alterations.some(
        (item: unknown) => !alterations.includes(item as Alteration),
      ) ||
      (!data.quality.startsWith("dominant-") && data.alterations.length > 0)
    )
      throw new Error(
        "These alterations are not supported by this chord quality.",
      );
    const degrees = data.alterations.map((item: string) => item.slice(1));
    if (new Set(degrees).size !== degrees.length)
      throw new Error("Choose only one alteration for each degree.");
  }
}
export function harmonyDegrees(value: HarmonyIdentity): string[] {
  assertHarmony(value);
  let degrees: string[] = [...harmonyCatalogue[value.quality].degrees];
  for (const alteration of value.alterations ?? []) {
    degrees = degrees.filter(
      (degree) => degree.replace(/\D/gu, "") !== alteration.slice(1),
    );
    degrees.push(alteration);
  }
  return degrees.sort(
    (left, right) =>
      Number(left.replace(/\D/gu, "")) - Number(right.replace(/\D/gu, "")),
  );
}
export function harmonyIdentity(value: HarmonyIdentity): HarmonyIdentity {
  const identity = {
    root: value.root,
    quality: value.quality,
    ...(value.alterations ? { alterations: [...value.alterations] } : {}),
    ...(value.bass !== undefined ? { bass: value.bass } : {}),
  };
  assertHarmony(identity);
  return identity;
}
