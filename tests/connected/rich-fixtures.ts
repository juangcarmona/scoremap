import type { RichSong } from "../../src/features/library/score";
export function uniqueRichFixture(source: RichSong) {
  const ids = new Map<string, string>();
  function collect(value: unknown): void {
    if (Array.isArray(value)) value.forEach(collect);
    else if (value && typeof value === "object")
      for (const [key, child] of Object.entries(value)) {
        if (key === "sourcePreset") continue;
        if (key === "id" && typeof child === "string")
          ids.set(child, crypto.randomUUID());
        else collect(child);
      }
  }
  collect(source);
  const references = new Set([
    "id",
    "measureId",
    "harmonyId",
    "voicingId",
    "partId",
    "deviceId",
    "tieNextId",
    "songIds",
    "eventIds",
  ]);
  function copy(value: unknown, key = ""): unknown {
    if (key === "sourcePreset") return structuredClone(value);
    if (Array.isArray(value)) return value.map((child) => copy(child, key));
    if (value && typeof value === "object")
      return Object.fromEntries(
        Object.entries(value).map(([name, child]) => [name, copy(child, name)]),
      );
    return typeof value === "string" && references.has(key)
      ? (ids.get(value) ?? value)
      : value;
  }
  const song = copy(source) as RichSong;
  song.title += ` ${song.id.slice(0, 8)}`;
  return { song, ids };
}
