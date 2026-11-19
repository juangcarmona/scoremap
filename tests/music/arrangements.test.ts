import { describe, expect, it } from "vitest";
import source from "../fixtures/library-v2.json";
import {
  applyCommand,
  validateLibrary,
  type Command,
} from "../../src/features/library/domain";
import type { RichSong } from "../../src/features/library/score";
import {
  copyArrangementIdentities,
  copySongIdentities,
} from "../../src/features/library/identityCopy";
import {
  activePartEvents,
  deviceEvents,
  unassignedPartEvents,
} from "../../src/features/library/arrangementSelection";
import { measureRemovalImpact } from "../../src/features/library/scoreCommands";
const fixture = () => structuredClone(validateLibrary(source));
function mapping(copy: (remap: (id: string) => string) => unknown) {
  const result: Record<string, string> = {};
  let index = 0;
  copy((id) => (result[id] ??= `new-${index++}`));
  return result;
}
describe("Shared form and independent arrangement configuration", () => {
  it("reorders rich sections without changing any arrangement, event, binding or identity", () => {
    const library = fixture();
    const first = library.songs[0] as RichSong;
    const withSecond = applyCommand(library, "edit", {
      type: "insertSection",
      songId: first.id,
      id: "synthetic-chorus",
      name: "Chorus",
    });
    const before = structuredClone(withSecond.songs[0] as RichSong);
    const order = [before.sections[1]!.id, before.sections[0]!.id];
    const reordered = applyCommand(withSecond, "edit", {
      type: "reorderSections",
      songId: first.id,
      order,
    });
    const after = reordered.songs[0] as RichSong;
    expect(after).toEqual({
      ...before,
      sections: [before.sections[1], before.sections[0]],
    });
    expect(withSecond.songs[0]).toEqual(before);
    expect(() =>
      applyCommand(withSecond, "performance", {
        type: "reorderSections",
        songId: first.id,
        order,
      }),
    ).toThrow(/Performance/);
    validateLibrary(reordered);
  });

  it("retains unrouted occurrences for consultation when a binding selects only some part notes", () => {
    const library = fixture();
    const song = library.songs[0] as RichSong;
    const arrangement = song.arrangements[0]!;
    arrangement.bindings[1]!.eventIds = ["e4"];
    expect(
      unassignedPartEvents(
        arrangement,
        arrangement.parts[1]!,
        song.sections[0]!.chords[0]!,
      ).map((event) => event.id),
    ).toEqual(["b4"]);
    expect(
      deviceEvents(
        arrangement,
        arrangement.devices[0]!.id,
        song.sections[0]!.chords[0]!,
      ).map((event) => event.id),
    ).toEqual(["c2", "g2", "e4"]);
    validateLibrary(library);
  });

  it("copies arrangement-owned identities while retaining shared form; independent song copies consistently remap the entire graph", () => {
    const library = fixture();
    const song = library.songs[0] as RichSong;
    const arrangement = song.arrangements[0]!;
    const ids = mapping((remap) =>
      copyArrangementIdentities(arrangement, remap),
    );
    const copied = applyCommand(library, "edit", {
      type: "copyArrangement",
      songId: song.id,
      arrangementId: arrangement.id,
      expected: arrangement,
      name: "Independent R",
      identities: ids,
    });
    const next = copied.songs[0] as RichSong;
    expect(next.sections).toEqual(song.sections);
    expect(next.arrangements.slice(0, 2)).toEqual(song.arrangements);
    const r = next.arrangements[2]!;
    expect(r.parts[0]!.events[0]!.measureId).toBe(
      arrangement.parts[0]!.events[0]!.measureId,
    );
    expect(r.voicings[0]!.harmonyId).toBe(arrangement.voicings[0]!.harmonyId);
    expect(r.voicings[0]!.sourcePreset).toEqual(
      arrangement.voicings[0]!.sourcePreset,
    );
    expect(r.bindings[1]!.eventIds).toEqual(
      r.parts[1]!.events.map((event) => event.id),
    );
    const songIds = mapping((remap) => copySongIdentities(song, remap));
    const duplicated = applyCommand(library, "edit", {
      type: "duplicateSong",
      songId: song.id,
      expected: song,
      identities: songIds,
    });
    const form = duplicated.songs[1] as RichSong;
    expect(duplicated.songs[0]).toEqual(song);
    expect(duplicated.repertoires).toEqual(library.repertoires);
    expect(form.sections[0]!.id).not.toBe(song.sections[0]!.id);
    expect(form.arrangements[0]!.parts[0]!.events[0]!.measureId).toBe(
      form.sections[0]!.measures[0]!.id,
    );
    expect(form.arrangements[0]!.voicings[0]!.harmonyId).toBe(
      form.sections[0]!.chords[0]!.id,
    );
    expect(form.arrangements[0]!.voicings[0]!.sourcePreset).toEqual(
      arrangement.voicings[0]!.sourcePreset,
    );
    expect(library).toEqual(source);
  });
  it("requires current explicit part/device removal impact and keeps unaffected music", () => {
    const library = fixture();
    const song = library.songs[0] as RichSong;
    const arrangement = song.arrangements[0]!;
    const device = arrangement.devices[0]!;
    const remove: Command = {
      type: "removeDevice",
      songId: song.id,
      arrangementId: arrangement.id,
      deviceId: device.id,
      expected: device,
      bindings: arrangement.bindings,
      confirmed: true,
    };
    expect(() =>
      applyCommand(library, "edit", { ...remove, confirmed: false }),
    ).toThrow(/Confirm/);
    const removed = applyCommand(library, "edit", remove).songs[0] as RichSong;
    expect(removed.arrangements[0]!.devices).toEqual([]);
    expect(removed.arrangements[0]!.bindings).toEqual([]);
    expect(removed.arrangements[0]!.parts).toEqual(arrangement.parts);
    expect(removed.arrangements[1]).toEqual(song.arrangements[1]);
    const part = arrangement.parts[1]!;
    const bindings = arrangement.bindings.filter(
      (binding) => binding.partId === part.id,
    );
    const without = applyCommand(library, "edit", {
      type: "removePart",
      songId: song.id,
      arrangementId: arrangement.id,
      partId: part.id,
      expected: part,
      bindings,
      confirmed: true,
    }).songs[0] as RichSong;
    expect(without.arrangements[0]!.parts).toEqual([arrangement.parts[0]]);
    expect(without.arrangements[0]!.devices).toEqual(arrangement.devices);
    expect(without.arrangements[0]!.bindings).toEqual([
      arrangement.bindings[0],
    ]);
    expect(without.arrangements[1]).toEqual(song.arrangements[1]);
  });
  it("refuses destructive shared measure removal without complete reconciliation and never clips notes for a shorter measure", () => {
    const library = fixture();
    const song = library.songs[0] as RichSong;
    const section = song.sections[0]!;
    const measure = section.measures[0]!;
    expect(() =>
      applyCommand(library, "edit", {
        type: "updateMeasure",
        songId: song.id,
        sectionId: section.id,
        measureId: measure.id,
        patch: { meter: measure.meter, length: { n: 1, d: 2 } },
      }),
    ).toThrow(/within/);
    expect(() =>
      applyCommand(library, "edit", {
        type: "removeMeasure",
        songId: song.id,
        sectionId: section.id,
        measureId: measure.id,
      }),
    ).toThrow(/reconciliation/);
    const impact = measureRemovalImpact(song, section.id, measure.id);
    expect(impact.notes).toHaveLength(8);
    const reconciled = applyCommand(library, "edit", {
      type: "removeMeasure",
      songId: song.id,
      sectionId: section.id,
      measureId: measure.id,
      reconciliation: impact,
    }).songs[0] as RichSong;
    expect(reconciled.sections[0]!.measures).toEqual([section.measures[1]]);
    expect(reconciled.sections[0]!.chords).toEqual([section.chords[4]]);
    expect(
      reconciled.arrangements.flatMap((a) => a.parts.flatMap((p) => p.events)),
    ).toEqual([]);
    expect(reconciled.arrangements[0]!.devices).toEqual(
      song.arrangements[0]!.devices,
    );
    expect(library).toEqual(source);
  });
  it("derives exact held/silent events and routes overlapping layers once per event while retaining equal pitches in distinct parts", () => {
    const library = fixture();
    const song = library.songs[0] as RichSong;
    const arrangement = song.arrangements[0]!;
    const section = song.sections[0]!;
    const part = arrangement.parts[0]!;
    part.events[0]!.duration = { n: 2, d: 1 };
    expect(
      activePartEvents(part, section.measures[0]!.id, { n: 1, d: 1 }).map(
        (e) => e.id,
      ),
    ).toEqual(["c2"]);
    expect(
      activePartEvents(part, section.measures[0]!.id, { n: 2, d: 1 }),
    ).toEqual([]);
    arrangement.bindings.push({
      ...arrangement.bindings[0]!,
      id: "extra-layer",
      layer: "Strings",
    });
    expect(
      deviceEvents(
        arrangement,
        arrangement.devices[0]!.id,
        section.chords[0]!,
      ).map((event) => event.id),
    ).toEqual(["c2", "g2", "e4", "b4"]);
    arrangement.bindings[1]!.range = [0, 127];
    arrangement.devices[0]!.range = [0, 127];
    arrangement.parts[1]!.events[0]!.pitch = {
      spelling: "C",
      octave: 2,
      midi: 36,
    };
    validateLibrary(library);
    expect(
      deviceEvents(arrangement, arrangement.devices[0]!.id, section.chords[0]!)
        .filter((event) => event.pitch.midi === 36)
        .map((event) => event.id),
    ).toEqual(["c2", "e4"]);
  });
  it("clears optional hand metadata explicitly and rejects every new mutation through performance admission", () => {
    const library = fixture();
    const song = library.songs[0] as RichSong;
    const arrangement = song.arrangements[0]!;
    const part = arrangement.parts[0]!;
    const command: Command = {
      type: "updatePart",
      songId: song.id,
      arrangementId: arrangement.id,
      partId: part.id,
      patch: { role: "Bass" },
      clearHand: true,
    };
    const next = applyCommand(library, "edit", command).songs[0] as RichSong;
    expect(next.arrangements[0]!.parts[0]!.hand).toBeUndefined();
    expect(next.arrangements[0]!.parts[0]!.events).toEqual(part.events);
    expect(() => applyCommand(library, "performance", command)).toThrow(
      /Performance/,
    );
  });
});
