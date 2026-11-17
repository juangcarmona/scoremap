import { describe, expect, it } from "vitest";
import {
  applyCommand,
  emptyLibrary,
  validateLibrary,
  type LegacySong,
  type Library,
} from "../../src/features/library/domain";
import { prepareSongMigration } from "../../src/features/library/scoreMigration";
import {
  isRichSong,
  type NoteEvent,
  type RichSong,
} from "../../src/features/library/score";
import { sectionRemovalImpact } from "../../src/features/library/scoreCommands";
function upgraded() {
  const source: LegacySong = {
    id: "song",
    title: "Synthetic form",
    artist: "",
    notes: "Original",
    sections: [
      {
        id: "verse",
        name: "Verse",
        repeat: 3,
        notes: "cue",
        chords: Array.from({ length: 5 }, () => ({
          root: "C",
          quality: "major",
        })),
      },
    ],
    references: [{ id: "ref", title: "Reference", url: "https://example.com" }],
  };
  const library = {
    ...emptyLibrary(),
    songs: [source],
    repertoires: [{ id: "set", title: "Set", songIds: [source.id] }],
  };
  let index = 0;
  const mapping = prepareSongMigration(source, () => `generated-${index++}`);
  return {
    source: library,
    mapping,
    library: applyCommand(library, "edit", {
      type: "enableArrangements",
      songId: source.id,
      mapping,
    }),
  };
}
function score(library: Library): RichSong {
  const song = library.songs[0]!;
  if (!isRichSong(song)) throw new Error("Fixture must be rich");
  return song;
}
function performed() {
  let { library } = upgraded();
  const event = score(library).sections[0]!.chords[0]!;
  const arrangement = score(library).arrangements[0]!;
  const left = arrangement.parts[0]!;
  library = applyCommand(library, "edit", {
    type: "updateHarmony",
    songId: "song",
    eventId: event.id,
    harmony: { root: "C", quality: "major-seventh" },
  });
  library = applyCommand(library, "edit", {
    type: "updatePart",
    songId: "song",
    arrangementId: arrangement.id,
    partId: left.id,
    patch: { name: "Left", hand: "left" },
  });
  library = applyCommand(library, "edit", {
    type: "addPart",
    songId: "song",
    arrangementId: arrangement.id,
    part: {
      id: "right",
      name: "Right",
      role: "melody",
      hand: "right",
      events: [],
    },
  });
  library = applyCommand(library, "edit", {
    type: "addVoicing",
    songId: "song",
    arrangementId: arrangement.id,
    voicing: {
      id: "voicing",
      name: "Open seventh",
      harmonyId: event.id,
      custom: false,
    },
  });
  const notes: [string, string, number, number, string][] = [
    ["c2", "C", 2, 36, left.id],
    ["g2", "G", 2, 43, left.id],
    ["e4", "E", 4, 64, "right"],
    ["b4", "B", 4, 71, "right"],
  ];
  for (const [id, spelling, octave, midi, partId] of notes)
    library = applyCommand(library, "edit", {
      type: "setNoteEvent",
      songId: "song",
      arrangementId: arrangement.id,
      partId,
      event: {
        id,
        measureId: event.measureId,
        start: { n: 0, d: 1 },
        duration: { n: 1, d: 1 },
        pitch: { spelling, octave, midi },
        voicingId: "voicing",
      },
    });
  library = applyCommand(library, "edit", {
    type: "addArrangement",
    songId: "song",
    arrangement: {
      id: "q",
      name: "Independent Q",
      parts: [
        {
          id: "qp",
          name: "Q part",
          role: "",
          events: [
            {
              id: "qn",
              measureId: event.measureId,
              start: { n: 0, d: 1 },
              duration: { n: 1, d: 1 },
              pitch: { spelling: "C", octave: 3, midi: 48 },
              voicingId: "qv",
            },
          ],
        },
      ],
      voicings: [
        { id: "qv", name: "Q voicing", harmonyId: event.id, custom: false },
      ],
      devices: [],
      bindings: [],
    },
  });
  return { library, event, arrangementId: arrangement.id };
}
describe("Identified form and independent exact performance", () => {
  it("migrates a legacy sequence to stable identified quarter-note occurrences without inventing played notes", () => {
    const { source, library, mapping } = upgraded();
    const song = score(library);
    expect(source.schemaVersion).toBe(1);
    expect(library.schemaVersion).toBe(2);
    expect(song.id).toBe("song");
    expect(song.sections[0]!.id).toBe("verse");
    expect(song.sections[0]!.repeat).toBe(3);
    expect(song.notes).toBe("Original");
    expect(song.references).toEqual(source.songs[0]!.references);
    expect(library.repertoires).toEqual(source.repertoires);
    expect(song.sections[0]!.measures).toHaveLength(2);
    expect(
      song.sections[0]!.chords.map((event) => [event.start, event.duration]),
    ).toEqual(
      [0, 1, 2, 3, 0].map((n) => [
        { n, d: 1 },
        { n: 1, d: 1 },
      ]),
    );
    expect(song.arrangements[0]!.parts[0]!.events).toEqual([]);
    expect(song.arrangements[0]!.bindings).toEqual([]);
    expect(song.migration).toEqual(mapping);
    expect(
      applyCommand(source, "edit", {
        type: "enableArrangements",
        songId: "song",
        mapping,
      }),
    ).toEqual(library);
    expect(() =>
      applyCommand(library, "edit", {
        type: "enableArrangements",
        songId: "song",
        mapping,
      }),
    ).toThrow(/already/);
  });
  it("moves one octave while keeping identity, timing, harmony, left-hand notes and another arrangement unchanged", () => {
    const { library, arrangementId } = performed();
    const before = structuredClone(library);
    const right = score(library).arrangements[0]!.parts[1]!;
    const note = right.events.find((event) => event.id === "b4")!;
    const next = applyCommand(library, "edit", {
      type: "setNoteEvent",
      songId: "song",
      arrangementId,
      partId: right.id,
      event: { ...note, pitch: { spelling: "B", octave: 5, midi: 83 } },
    });
    expect(library).toEqual(before);
    expect(score(next).sections).toEqual(score(before).sections);
    expect(score(next).arrangements[1]).toEqual(score(before).arrangements[1]);
    expect(score(next).arrangements[0]!.parts[0]).toEqual(
      score(before).arrangements[0]!.parts[0],
    );
    expect(score(next).arrangements[0]!.parts[1]!.events).toEqual([
      right.events[0],
      { ...note, pitch: { spelling: "B", octave: 5, midi: 83 } },
    ]);
  });
  it("refuses incompatible performed tones unless a custom realization is explicitly confirmed", () => {
    const { library, arrangementId } = performed();
    const note = score(library).arrangements[0]!.parts[1]!.events[0]!;
    const command = {
      type: "setNoteEvent" as const,
      songId: "song",
      arrangementId,
      partId: "right",
      event: { ...note, pitch: { spelling: "F#", octave: 4, midi: 66 } },
    };
    expect(() => applyCommand(library, "edit", command)).toThrow(/custom/);
    const next = applyCommand(library, "edit", {
      ...command,
      customVoicing: true,
    });
    expect(score(next).arrangements[0]!.voicings[0]!.custom).toBe(true);
    expect(score(next).sections).toEqual(score(library).sections);
    expect(score(next).arrangements[1]).toEqual(score(library).arrangements[1]);
  });
  it("refuses invalid pitch, timing, meter, unknown versions and cross-part references before mutating source", () => {
    const { library } = performed();
    const mutations: ((song: RichSong) => void)[] = [
      (song) => {
        song.arrangements[0]!.parts[0]!.events[0]!.pitch.midi = 128;
      },
      (song) => {
        song.arrangements[0]!.parts[0]!.events[0]!.pitch.octave = 8;
      },
      (song) => {
        song.sections[0]!.chords[0]!.duration = { n: 0, d: 1 };
      },
      (song) => {
        song.sections[0]!.chords[0]!.start = { n: 4, d: 1 };
      },
      (song) => {
        song.sections[0]!.measures[0]!.meter.denominator = 3;
      },
      (song) => {
        song.arrangements[0]!.parts[0]!.events[0]!.voicingId = "qv";
      },
    ];
    for (const mutate of mutations) {
      const invalid = structuredClone(library);
      mutate(score(invalid));
      expect(() => validateLibrary(invalid)).toThrow();
    }
    expect(() => validateLibrary({ ...library, schemaVersion: 99 })).toThrow(
      /unsupported/,
    );
    expect(() =>
      applyCommand(library, "performance", {
        type: "addPart",
        songId: "song",
        arrangementId: score(library).arrangements[0]!.id,
        part: { id: "blocked", name: "Blocked", role: "", events: [] },
      }),
    ).toThrow(/Performance/);
  });
  it("discloses shared-form impact and requires the exact current reconciliation", () => {
    const { library } = performed();
    const impact = sectionRemovalImpact(score(library), "verse");
    expect(impact.notes).toEqual(
      expect.arrayContaining(["c2", "g2", "e4", "b4", "qn"]),
    );
    expect(() =>
      applyCommand(library, "edit", {
        type: "removeSection",
        songId: "song",
        sectionId: "verse",
      }),
    ).toThrow(/reconciliation/);
    const next = applyCommand(library, "edit", {
      type: "removeSection",
      songId: "song",
      sectionId: "verse",
      reconciliation: impact,
    });
    expect(score(next).sections).toEqual([]);
    expect(
      score(next).arrangements.flatMap((arrangement) =>
        arrangement.parts.flatMap((part) => part.events),
      ),
    ).toEqual([]);
    expect(
      score(next).arrangements.every(
        (arrangement) => arrangement.voicings.length === 0,
      ),
    ).toBe(true);
  });
  it("permits a fourth physical part and layers without sharing or dropping performed event ownership", () => {
    const { library, arrangementId, event } = performed();
    let next = library;
    next = applyCommand(next, "edit", {
      type: "addDevice",
      songId: "song",
      arrangementId,
      device: {
        id: "k4",
        name: "Fourth keyboard",
        instrument: "keyboard",
        range: [21, 108],
      },
    });
    next = applyCommand(next, "edit", {
      type: "addPart",
      songId: "song",
      arrangementId,
      part: {
        id: "p3",
        name: "Third part",
        role: "bass",
        events: [
          {
            id: "n3",
            measureId: event.measureId,
            start: { n: 0, d: 1 },
            duration: { n: 1, d: 1 },
            pitch: { spelling: "C", octave: 3, midi: 48 },
            voicingId: "voicing",
          },
        ],
      },
    });
    for (const [index, part] of score(next).arrangements[0]!.parts.entries()) {
      next = applyCommand(next, "edit", {
        type: "addDevice",
        songId: "song",
        arrangementId,
        device: {
          id: `k${index + 1}`,
          name: `Keyboard ${index + 1}`,
          instrument: "keyboard",
          range: [21, 108],
        },
      });
      next = applyCommand(next, "edit", {
        type: "setBinding",
        songId: "song",
        arrangementId,
        binding: {
          id: `binding-${index + 1}`,
          partId: part.id,
          deviceId: `k${index + 1}`,
          range: [21, 108],
          sound: `Independent sound ${index + 1}`,
        },
      });
    }
    const prior = structuredClone(score(next).arrangements[0]!.parts);
    const note: NoteEvent = {
      id: "p4note",
      measureId: event.measureId,
      start: { n: 0, d: 1 },
      duration: { n: 1, d: 1 },
      pitch: { spelling: "C", octave: 4, midi: 60 },
      voicingId: "voicing",
    };
    next = applyCommand(next, "edit", {
      type: "addPart",
      songId: "song",
      arrangementId,
      part: { id: "p4", name: "Fourth part", role: "pad", events: [note] },
    });
    next = applyCommand(next, "edit", {
      type: "setBinding",
      songId: "song",
      arrangementId,
      binding: {
        id: "layer1",
        partId: "p4",
        deviceId: "k4",
        range: [21, 108],
        sound: "Pad",
        layer: "Soft",
      },
    });
    next = applyCommand(next, "edit", {
      type: "setBinding",
      songId: "song",
      arrangementId,
      binding: {
        id: "layer2",
        partId: "p4",
        deviceId: "k4",
        range: [21, 108],
        sound: "Strings",
        layer: "Wide",
      },
    });
    expect(score(next).arrangements[0]!.parts).toHaveLength(4);
    expect(score(next).arrangements[0]!.devices).toHaveLength(4);
    expect(score(next).arrangements[0]!.parts.slice(0, prior.length)).toEqual(
      prior,
    );
    expect(score(next).arrangements[1]).toEqual(score(library).arrangements[1]);
    expect(score(next).arrangements[0]!.parts.at(-1)!.events).toEqual([note]);
    expect(() =>
      applyCommand(next, "edit", {
        type: "setBinding",
        songId: "song",
        arrangementId,
        binding: { id: "bad", partId: "p4", deviceId: "k4", range: [21, 59] },
      }),
    ).toThrow(/excludes/);
  });
});
