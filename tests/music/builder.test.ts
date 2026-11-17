import { describe, expect, it } from "vitest";
import performed from "../fixtures/library-v2.json";
import {
  applyCommand,
  validateLibrary,
  type Command,
} from "../../src/features/library/domain";
import type { RichSong } from "../../src/features/library/score";
import { assertPerformedPitch } from "../../src/features/library/scoreValidation";
import {
  identifyHarmony,
  performedPitchAt,
} from "../../src/shared/music/theory";
const fixture = () => structuredClone(validateLibrary(performed));
describe("Atomic performed preview application and guarded undo", () => {
  it("detects an explicit candidate's bass from actual register rather than note-array order", () => {
    const candidates = identifyHarmony(["C4", "E3", "G3", "A3"]);
    expect(
      candidates.find(
        (candidate) =>
          candidate.identity.root === "C" &&
          candidate.identity.quality === "major-sixth",
      )?.detectedBass,
    ).toBe("E");
  });

  it("updates only one exact identified occurrence and reverses the complete arrangement without touching shared form or Q", () => {
    const library = fixture();
    const song = library.songs[0] as RichSong;
    const arrangement = song.arrangements[0]!;
    const part = arrangement.parts[1]!;
    const voicing = arrangement.voicings[0]!;
    const events = structuredClone(part.events);
    events[1]!.pitch = { spelling: "B", octave: 5, midi: 83 };
    const command: Command = {
      type: "setVoicingPerformance",
      songId: song.id,
      arrangementId: arrangement.id,
      partId: part.id,
      voicingId: voicing.id,
      voicing,
      events,
      expected: { voicing, events: part.events },
    };
    const saved = applyCommand(library, "edit", command);
    const updated = saved.songs[0] as RichSong;
    expect(updated.sections).toEqual(song.sections);
    expect(updated.arrangements[1]).toEqual(song.arrangements[1]);
    expect(updated.arrangements[0]!.parts[0]).toEqual(arrangement.parts[0]);
    expect(updated.arrangements[0]!.bindings).toEqual(arrangement.bindings);
    expect(updated.arrangements[0]!.parts[1]!.events).toEqual(events);
    const undo: Command = {
      type: "replaceArrangement",
      songId: song.id,
      arrangementId: arrangement.id,
      expected: updated.arrangements[0]!,
      arrangement,
    };
    expect(applyCommand(saved, "edit", undo)).toEqual(library);
    expect(() => applyCommand(library, "performance", command)).toThrow(
      /Performance/,
    );
    expect(() => applyCommand(saved, "edit", command)).toThrow(/scope changed/);
    const newer = applyCommand(saved, "edit", {
      type: "updatePart",
      songId: song.id,
      arrangementId: arrangement.id,
      partId: part.id,
      patch: { role: "Changed later" },
    });
    expect(() => applyCommand(newer, "edit", undo)).toThrow(/changed after/);
    expect(library).toEqual(performed);
  });
  it("uses absolute bounds with consistent enharmonic octave spelling rather than an invented written-octave bound", () => {
    expect(performedPitchAt(0, "B#")).toEqual({
      spelling: "B#",
      octave: -2,
      midi: 0,
    });
    expect(() => assertPerformedPitch(performedPitchAt(0, "B#"))).not.toThrow();
    expect(performedPitchAt(59, "Cb")).toEqual({
      spelling: "Cb",
      octave: 4,
      midi: 59,
    });
    expect(() => performedPitchAt(128)).toThrow(/outside/);
    expect(() => performedPitchAt(-1)).toThrow(/outside/);
  });
});
