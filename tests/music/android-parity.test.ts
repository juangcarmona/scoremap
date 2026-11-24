import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  harmonyCatalogue,
  type ChordQuality,
} from "../../src/shared/music/catalogue";
import type {
  Alteration,
  HarmonyIdentity,
} from "../../src/shared/music/harmony";
import {
  performedPitchAt,
  theoreticalHarmony,
} from "../../src/shared/music/theory";

// The Kotlin domain (src/android/music) and the web domain must agree on the same hand-derived literals.
const fixtures = "src/android/music/src/test/resources/fixtures/";
const lines = (name: string) =>
  readFileSync(fixtures + name, "utf8")
    .split("\n")
    .filter((line) => line.trim() !== "" && !line.startsWith("#"));

describe("web domain agrees with the Android literal fixtures", () => {
  it("derives the same harmony spelling, degrees and pitch classes", () => {
    const cases = lines("harmony-spelling.txt");
    expect(cases.length).toBeGreaterThanOrEqual(20);
    for (const line of cases) {
      const [input, expected] = line.split(" => ") as [string, string];
      const tokens = input.split(" ");
      const alterations = tokens
        .find((token) => token.startsWith("["))
        ?.replace(/[[\]]/gu, "")
        .split(",") as Alteration[] | undefined;
      const bass = tokens.find((token) => token.startsWith("/"))?.slice(1);
      const identity: HarmonyIdentity = {
        root: tokens[0]!,
        quality: tokens[1] as ChordQuality,
        ...(alterations ? { alterations } : {}),
        ...(bass ? { bass } : {}),
      };
      const harmony = theoreticalHarmony(identity);
      const actual =
        harmony.tones
          .map((tone) => `${tone.degree}=${tone.spelling}:${tone.pitchClass}`)
          .join(" ") +
        (harmony.bass
          ? ` bass=${harmony.bass.spelling}:${harmony.bass.pitchClass}`
          : "");
      expect(actual, line).toBe(expected);
    }
  });

  it("derives the same exact pitch, spelling and register", () => {
    for (const line of lines("pitch.txt")) {
      const [input, expected] = line.split(" => ") as [string, string];
      const [midi, spelling] = input.split(" ");
      const run = () => performedPitchAt(Number(midi), spelling);
      if (expected === "refused") expect(run, line).toThrow();
      else {
        const pitch = run();
        expect(`${pitch.spelling} ${pitch.octave}`, line).toBe(expected);
      }
    }
  });

  it("keeps the Kotlin catalogue equal to the accepted web catalogue", () => {
    const source = readFileSync(
      "src/android/music/src/main/kotlin/scoremap/music/HarmonyCatalogue.kt",
      "utf8",
    );
    const list = (text: string) =>
      [...text.matchAll(/"((?:[^"\\]|\\.)*)"/gu)].map((match) => match[1]!);
    const entries = [
      ...source.matchAll(
        /ChordQuality\(\s*"([^"]+)",\s*listOf\(((?:"[^"]*"|,|\s)*)\),\s*listOf\(((?:"[^"]*"|,|\s)*)\),\s*"([^"]*)",?\s*\)/gu,
      ),
    ].map((match) => ({
      id: match[1]!,
      degrees: list(match[2]!),
      aliases: list(match[3]!),
      symbol: match[4]!,
    }));
    const expected = Object.entries(harmonyCatalogue).map(([id, quality]) => ({
      id,
      degrees: [...quality.degrees],
      aliases: [...quality.aliases],
      symbol: quality.symbol,
    }));
    expect(entries).toEqual(expected);
  });
});
