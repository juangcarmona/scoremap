import { describe, expect, it } from "vitest";
import {
  exportNotationPreference,
  importNotationPreference,
  MAX_NOTATION_TRANSFER_BYTES,
} from "../../src/features/notation/notationTransfer";

describe("portable owned note-name preference", () => {
  it("round trips each notation choice with independent source revision", () => {
    for (const preference of [
      { mode: "anglo", primary: "anglo" },
      { mode: "latin", primary: "latin" },
      { mode: "dual", primary: "latin" },
      { mode: "dual", primary: "anglo" },
    ] as const) {
      for (const revision of [null, 9])
        expect(
          importNotationPreference(
            exportNotationPreference(preference, revision),
          ),
        ).toEqual({
          format: "scoremap-notation-preference",
          version: 1,
          sourceRevision: revision,
          preference,
        });
    }
  });
  it("refuses malformed, unknown, injected, invalid and oversized values", () => {
    const valid = JSON.parse(
      exportNotationPreference({ mode: "latin", primary: "latin" }, 2),
    );
    for (const text of [
      "{",
      JSON.stringify({ ...valid, version: 2 }),
      JSON.stringify({ ...valid, owner: "other" }),
      JSON.stringify({
        ...valid,
        preference: { ...valid.preference, token: "secret" },
      }),
      JSON.stringify({ ...valid, sourceRevision: -1 }),
      JSON.stringify({
        ...valid,
        preference: { mode: "latin", primary: "anglo" },
      }),
      " ".repeat(MAX_NOTATION_TRANSFER_BYTES + 1),
    ])
      expect(() => importNotationPreference(text)).toThrow();
  });
});
