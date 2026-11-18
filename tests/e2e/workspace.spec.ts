import rich from "../fixtures/library-v2.json" with { type: "json" };
import fs from "node:fs/promises";
import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import legacy from "../fixtures/library-v1.json" with { type: "json" };
import type { Arrangement, RichSong } from "../../src/features/library/score";
import { readLibrary, saved } from "./helpers";
test.use({ actionTimeout: 10000 });
test("all six real arrangement configurations, a fourth assigned part and complete durable backup round trip", async ({
  page,
}) => {
  test.setTimeout(180000);
  await page.goto("/");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByLabel("Import backup file", { exact: true }).setInputFiles({
    name: "synthetic-v1.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({
        format: "scoremap-backup",
        version: 1,
        library: legacy,
      }),
    ),
  });
  await saved(page);
  await page.getByText("Edit Verse", { exact: true }).click();
  const initial = (await readLibrary(page)).songs[0] as RichSong;
  await page
    .getByLabel("Chord position for Verse", { exact: true })
    .selectOption(initial.sections[0]!.chords[0]!.id);
  await page
    .getByLabel("Quality for Verse", { exact: true })
    .selectOption("major-seventh");
  await page.getByRole("button", { name: "Change chord", exact: true }).click();
  await saved(page);
  const baseline = await readLibrary(page);
  const templates = [
    {
      name: "Bass foundation",
      pitches: [
        { spelling: "C", octave: 2, midi: 36 },
        { spelling: "G", octave: 2, midi: 43 },
      ],
    },
    {
      name: "Right harmony",
      pitches: [
        { spelling: "E", octave: 4, midi: 64 },
        { spelling: "B", octave: 4, midi: 71 },
      ],
    },
    { name: "Pulse C4", pitches: [{ spelling: "C", octave: 4, midi: 60 }] },
    {
      name: "Split edge B3",
      pitches: [{ spelling: "B", octave: 3, midi: 59 }],
    },
  ];
  const originals = templates.map((template, index) => ({
    id: `source-${index}`,
    revision: 1,
    preset: {
      id: `source-${index}`,
      name: template.name,
      harmony: { root: "C", quality: "major-seventh" },
      pitches: template.pitches,
      custom: false,
    },
  }));
  const personal = page.locator(".library-footer");
  await personal
    .getByText("Reusable voicings on this device", { exact: true })
    .click();
  page.once("dialog", (dialog) => dialog.accept());
  await personal
    .getByLabel("Reusable voicing import file", { exact: true })
    .setInputFiles({
      name: "synthetic-owned-voicings.json",
      mimeType: "application/json",
      buffer: Buffer.from(
        JSON.stringify({
          format: "scoremap-voicing-presets",
          version: 1,
          presets: originals,
        }),
      ),
    });
  await expect(
    personal.getByText(
      "Reusable voicing import completed. Review the saved list; source files are kept.",
      { exact: true },
    ),
  ).toBeVisible();
  const workspace = page.getByRole("region", {
    name: "Arrangement workspace",
    exact: true,
  });
  const config = workspace
    .getByText("Configure arrangement, parts & keyboards", { exact: true })
    .locator("..");
  await config.locator("summary").first().click();
  const arrangement = async (name: string): Promise<Arrangement> => {
    const song = (await readLibrary(page)).songs[0] as RichSong;
    return song.arrangements.find((value) => value.name === name)!;
  };
  async function addArrangement(name: string) {
    const form = config.getByRole("form", {
      name: "Add arrangement",
      exact: true,
    });
    await form.getByLabel("New arrangement name", { exact: true }).fill(name);
    await form
      .getByRole("button", { name: "Add arrangement", exact: true })
      .click();
    await saved(page);
    await expect(
      page.getByLabel("Active arrangement", { exact: true }),
    ).toHaveValue((await arrangement(name)).id);
  }
  async function addKeyboard(name: string, lower = 21, upper = 108) {
    const form = config.getByRole("form", {
      name: "Add physical keyboard",
      exact: true,
    });
    await form.getByLabel("Keyboard name", { exact: true }).fill(name);
    await form
      .getByLabel("Lowest note", { exact: true })
      .selectOption(String(lower));
    await form
      .getByLabel("Highest note", { exact: true })
      .selectOption(String(upper));
    await form
      .getByRole("button", { name: "Add keyboard", exact: true })
      .click();
    await saved(page);
  }
  async function addPart(
    name: string,
    role: string,
    preset: string,
    keyboard: string,
    hand = "",
    sound = "Piano",
    range: [number, number] = [21, 108],
    layer = "",
  ) {
    const form = config.getByRole("form", {
      name: "Add performed part",
      exact: true,
    });
    await form.getByLabel("Part name", { exact: true }).fill(name);
    await form.getByLabel("Musical role", { exact: true }).fill(role);
    await form
      .getByLabel("Hand or context · optional", { exact: true })
      .fill(hand);
    await form
      .getByLabel("Initial reusable voicing", { exact: true })
      .selectOption({ label: `${preset} · version 1 · Cmaj7` });
    const device = (await readLibrary(page)).songs[0] as RichSong;
    const active = await page
      .getByLabel("Active arrangement", { exact: true })
      .inputValue();
    const id = device.arrangements
      .find((value) => value.id === active)!
      .devices.find((value) => value.name === keyboard)!.id;
    await form
      .getByLabel("Initial keyboard assignment", { exact: true })
      .selectOption(id);
    await form
      .getByLabel("Lowest note", { exact: true })
      .selectOption(String(range[0]));
    await form
      .getByLabel("Highest note", { exact: true })
      .selectOption(String(range[1]));
    await form.getByLabel("Sound · optional", { exact: true }).fill(sound);
    await form.getByLabel("Layer · optional", { exact: true }).fill(layer);
    await form
      .getByRole("button", { name: "Add part and assignment", exact: true })
      .click();
    await saved(page);
  }
  await addArrangement("One piano");
  await addKeyboard("Shared piano");
  await addPart("Left", "bass", "Bass foundation", "Shared piano", "left");
  await addPart("Right", "harmony", "Right harmony", "Shared piano", "right");
  const one = await arrangement("One piano");
  expect(one.parts).toHaveLength(2);
  expect(one.devices).toHaveLength(1);
  expect(one.bindings).toHaveLength(2);
  expect(one.parts.map((part) => part.hand)).toEqual(["left", "right"]);
  await addArrangement("Two keyboards");
  await addKeyboard("Lower keyboard", 24, 59);
  await addKeyboard("Upper keyboard", 48, 95);
  await addPart(
    "Left lower",
    "bass",
    "Bass foundation",
    "Lower keyboard",
    "left",
    "Bass",
    [24, 59],
  );
  await addPart(
    "Right upper",
    "harmony",
    "Right harmony",
    "Upper keyboard",
    "right",
    "Electric piano",
    [48, 95],
  );
  const two = await arrangement("Two keyboards");
  expect(two.devices).toHaveLength(2);
  expect(two.bindings.map((binding) => binding.deviceId)).toEqual(
    two.devices.map((device) => device.id),
  );
  await addArrangement("Three keyboards");
  for (const name of ["K1", "K2", "K3"]) await addKeyboard(name);
  await addPart("P1", "bass", "Bass foundation", "K1", "", "Bass");
  await addPart("P2", "harmony", "Right harmony", "K2", "", "Piano");
  await addPart("P3", "pulse", "Pulse C4", "K3", "", "Pad");
  await addKeyboard("K4");
  const beforeFourth = await readLibrary(page);
  const prior = (beforeFourth.songs[0] as RichSong).arrangements.find(
    (value) => value.name === "Three keyboards",
  )!;
  await addPart("P4", "strings", "Pulse C4", "K4", "", "Strings");
  const four = await arrangement("Three keyboards");
  expect(four.parts).toHaveLength(4);
  expect(four.devices).toHaveLength(4);
  expect(four.parts.slice(0, 3)).toEqual(prior.parts);
  expect(four.devices).toEqual(prior.devices);
  expect(four.bindings.slice(0, 3)).toEqual(prior.bindings);
  expect((await readLibrary(page)).songs[0]!.sections).toEqual(
    beforeFourth.songs[0]!.sections,
  );
  expect(await arrangement("One piano")).toEqual(one);
  expect(four.parts[3]!.hand).toBeUndefined();
  expect(four.parts[3]!.events[0]!.pitch).toEqual({
    spelling: "C",
    octave: 4,
    midi: 60,
  });
  await addArrangement("Split keyboard");
  await addKeyboard("Split piano");
  await addPart(
    "Low edge",
    "bass",
    "Split edge B3",
    "Split piano",
    "left",
    "Bass",
    [21, 59],
    "low",
  );
  await addPart(
    "High edge",
    "lead",
    "Pulse C4",
    "Split piano",
    "right",
    "Piano",
    [60, 108],
    "high",
  );
  const split = await arrangement("Split keyboard");
  expect(split.parts.map((part) => part.events[0]!.pitch.midi)).toEqual([
    59, 60,
  ]);
  expect(split.bindings.map((binding) => binding.range)).toEqual([
    [21, 59],
    [60, 108],
  ]);
  await addArrangement("Overlapping layers");
  await addKeyboard("Layer piano");
  await addPart(
    "Pad",
    "pad",
    "Pulse C4",
    "Layer piano",
    "",
    "Pad",
    [48, 84],
    "soft",
  );
  await addPart(
    "Strings",
    "strings",
    "Pulse C4",
    "Layer piano",
    "",
    "Strings",
    [48, 84],
    "wide",
  );
  const layers = await arrangement("Overlapping layers");
  expect(
    layers.parts.flatMap((part) =>
      part.events.map((event) => event.pitch.midi),
    ),
  ).toEqual([60, 60]);
  expect(
    new Set(
      layers.parts.flatMap((part) => part.events.map((event) => event.id)),
    ).size,
  ).toBe(2);
  await addArrangement("No hand mapping");
  await addKeyboard("Shared controller");
  for (const [index, preset] of [
    "Bass foundation",
    "Right harmony",
    "Pulse C4",
    "Pulse C4",
  ].entries())
    await addPart(
      `Role ${index + 1}`,
      index === 0 ? "bass" : "sequence",
      preset,
      "Shared controller",
      "",
      `Sound ${index + 1}`,
    );
  const unassigned = await arrangement("No hand mapping");
  expect(unassigned.parts).toHaveLength(4);
  expect(unassigned.parts.every((part) => !Object.hasOwn(part, "hand"))).toBe(
    true,
  );
  const complete = await readLibrary(page);
  const song = complete.songs[0] as RichSong;
  expect(song.sections).toEqual(baseline.songs[0]!.sections);
  expect(complete.repertoires).toEqual(baseline.repertoires);
  expect(song.arrangements[0]).toEqual(
    (baseline.songs[0] as RichSong).arrangements[0],
  );
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export backup", exact: true })
    .click();
  const exported = await fs.readFile((await (await download).path())!, "utf8");
  expect(JSON.parse(exported).library).toEqual(complete);
  await page.reload();
  expect(await readLibrary(page)).toEqual(complete);
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByLabel("Import backup file", { exact: true }).setInputFiles({
    name: "synthetic-full-arrangements.json",
    mimeType: "application/json",
    buffer: Buffer.from(exported),
  });
  await saved(page);
  expect(await readLibrary(page)).toEqual({
    ...complete,
    revision: complete.revision + 1,
  });
  await page
    .getByLabel("Active arrangement", { exact: true })
    .selectOption(four.id);
  await page
    .getByRole("button", { name: "Enter performance", exact: true })
    .click();
  const beforeNavigation = await readLibrary(page);
  const views = page.getByRole("region", {
    name: "Synchronized keyboard views",
    exact: true,
  });
  await expect(page.locator(".keyboard-view")).toHaveCount(4);
  for (const device of four.devices)
    await expect(
      page.getByRole("article", {
        name: `Keyboard ${device.name}`,
        exact: true,
      }),
    ).toBeVisible();
  await page
    .getByLabel("Occurrence of Verse", { exact: true })
    .selectOption("2");
  await page
    .getByLabel("Active performed harmonic event", { exact: true })
    .selectOption(song.sections[0]!.chords[1]!.id);
  await expect(
    page.locator('.keyboard-view .performed-key[data-performed="true"]'),
  ).toHaveCount(0);
  await expect(page.locator(".arrangement-views")).toHaveAttribute(
    "data-occurrence",
    "2",
  );
  expect(await readLibrary(page)).toEqual(beforeNavigation);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addStyleTag({ content: "html:root {font-size:200%}" });
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  void views;
});

async function importRich(page: Page) {
  await page.goto("/");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByLabel("Import backup file", { exact: true }).setInputFiles({
    name: "synthetic-rich.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({
        format: "scoremap-backup",
        version: 2,
        library: rich,
      }),
    ),
  });
  await saved(page);
}
test("removing a binding or physical keyboard retains every note and makes unassigned performance explicitly consultable", async ({
  page,
}) => {
  await importRich(page);
  const before = await readLibrary(page);
  const original = before.songs[0] as RichSong;
  await page
    .getByText("Configure arrangement, parts & keyboards", { exact: true })
    .click();
  await page
    .getByText("Assignment 2 · Right → Stage keyboard", { exact: true })
    .click();
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("form", { name: "Edit assignment 2", exact: true })
    .getByRole("button", { name: "Remove assignment", exact: true })
    .click();
  await saved(page);
  const afterBinding = await readLibrary(page);
  const song = afterBinding.songs[0] as RichSong;
  expect(song.arrangements[0]!.parts).toEqual(original.arrangements[0]!.parts);
  expect(song.arrangements[0]!.bindings).toEqual([
    original.arrangements[0]!.bindings[0],
  ]);
  expect(song.arrangements[1]).toEqual(original.arrangements[1]);
  await page
    .getByRole("button", { name: "Enter performance", exact: true })
    .click();
  const unassigned = page.getByRole("article", {
    name: "Unassigned notes Right",
    exact: true,
  });
  await expect(unassigned.locator(".played-note-list")).toHaveText(
    "Performed: E4 · B4",
  );
  await expect(
    unassigned.locator('.performed-key[data-performed="true"]'),
  ).toHaveCount(2);
  expect(await readLibrary(page)).toEqual(afterBinding);
  await page
    .getByRole("button", { name: "Switch to edit", exact: true })
    .click();
  await page
    .getByText("Configure arrangement, parts & keyboards", { exact: true })
    .click();
  await page.getByText("Keyboard · Stage keyboard", { exact: true }).click();
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("button", {
      name: "Remove keyboard Stage keyboard",
      exact: true,
    })
    .click();
  await saved(page);
  const afterKeyboard = await readLibrary(page);
  const result = afterKeyboard.songs[0] as RichSong;
  expect(result.arrangements[0]!.parts).toEqual(
    original.arrangements[0]!.parts,
  );
  expect(result.arrangements[0]!.devices).toEqual([]);
  expect(result.arrangements[0]!.bindings).toEqual([]);
  expect(result.arrangements[1]).toEqual(original.arrangements[1]);
  await page
    .getByRole("button", { name: "Enter performance", exact: true })
    .click();
  await expect(
    page
      .getByRole("article", { name: "Unassigned notes Left", exact: true })
      .locator(".played-note-list"),
  ).toHaveText("Performed: C2 · G2");
  await expect(
    page
      .getByRole("article", { name: "Unassigned notes Right", exact: true })
      .locator(".played-note-list"),
  ).toHaveText("Performed: E4 · B4");
  expect(await readLibrary(page)).toEqual(afterKeyboard);
});

test("shared measure edits refuse clipping, disclose all arrangements and reconcile removal without stale selected highlights", async ({
  page,
}) => {
  await importRich(page);
  const before = await readLibrary(page);
  const original = before.songs[0] as RichSong;
  await page.getByText("Edit Verse", { exact: true }).click();
  await page.getByText("Measures in Verse", { exact: true }).click();
  const measure = page.getByRole("region", {
    name: "Measure 1 in Verse",
    exact: true,
  });
  await measure
    .getByLabel("Length · quarter notes", { exact: true })
    .fill("1/2");
  await measure
    .getByRole("button", { name: "Save measure 1", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("within their measure");
  expect(await readLibrary(page)).toEqual(before);
  await page
    .getByRole("button", { name: "Verse chord 1: Cmaj7", exact: true })
    .click();
  page.once("dialog", async (dialog) => {
    expect(dialog.message()).toContain("in “Q”");
    expect(dialog.message()).toContain("C2");
    expect(dialog.message()).toContain("B4");
    await dialog.accept();
  });
  await measure
    .getByRole("button", { name: "Remove measure 1", exact: true })
    .click();
  await saved(page);
  const after = await readLibrary(page);
  const song = after.songs[0] as RichSong;
  expect(song.sections[0]!.measures).toEqual([
    original.sections[0]!.measures[1],
  ]);
  expect(song.sections[0]!.chords).toEqual([original.sections[0]!.chords[4]]);
  expect(
    song.arrangements.flatMap((arrangement) =>
      arrangement.parts.flatMap((part) => part.events),
    ),
  ).toEqual([]);
  expect(
    song.arrangements.every((arrangement) => arrangement.voicings.length === 0),
  ).toBe(true);
  expect(song.arrangements[0]!.devices).toEqual(
    original.arrangements[0]!.devices,
  );
  await expect(
    page.getByText(/The selected harmonic event is no longer available/),
  ).toBeVisible();
  await expect(
    page.getByRole("region", {
      name: "Synchronized keyboard views",
      exact: true,
    }),
  ).toHaveAttribute(
    "data-harmonic-event-id",
    original.sections[0]!.chords[4]!.id,
  );
  await expect(
    page.locator('.keyboard-view .performed-key[data-performed="true"]'),
  ).toHaveCount(0);
});

test("explicit arrangement and independent-song copies preserve complete music with fresh owned identities, including opaque prototype-like source IDs", async ({
  page,
}) => {
  const data = structuredClone(rich);
  data.songs[0]!.id = "constructor";
  data.repertoires[0]!.songIds = ["constructor"];
  data.songs[0]!.sections[0]!.id = "__proto__";
  data.songs[0]!.arrangements[0]!.id = "toString";
  await page.goto("/");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByLabel("Import backup file", { exact: true }).setInputFiles({
    name: "synthetic-opaque-ids.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({
        format: "scoremap-backup",
        version: 2,
        library: data,
      }),
    ),
  });
  await saved(page);
  await expect(
    page.getByRole("region", {
      name: "Synchronized keyboard views",
      exact: true,
    }),
  ).toHaveAttribute("data-occurrence", "1");
  const before = await readLibrary(page);
  await page
    .getByText("Configure arrangement, parts & keyboards", { exact: true })
    .click();
  page.once("dialog", (dialog) => dialog.accept("P alternative"));
  await page
    .getByRole("button", { name: "Copy arrangement", exact: true })
    .click();
  await saved(page);
  const copied = await readLibrary(page);
  const song = copied.songs[0] as RichSong;
  const original = before.songs[0] as RichSong;
  expect(song.sections).toEqual(original.sections);
  expect(song.arrangements.slice(0, 2)).toEqual(original.arrangements);
  const alternate = song.arrangements[2]!;
  expect(alternate.name).toBe("P alternative");
  expect(alternate.parts[0]!.events[0]!.measureId).toBe(
    original.sections[0]!.measures[0]!.id,
  );
  expect(alternate.parts[0]!.events.map((event) => event.pitch)).toEqual(
    original.arrangements[0]!.parts[0]!.events.map((event) => event.pitch),
  );
  expect(alternate.parts[0]!.id).not.toBe(
    original.arrangements[0]!.parts[0]!.id,
  );
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("button", { name: "Make independent song copy", exact: true })
    .click();
  await saved(page);
  const duplicate = await readLibrary(page);
  expect(duplicate.songs).toHaveLength(2);
  expect(duplicate.songs[0]).toEqual(song);
  expect(duplicate.repertoires).toEqual(copied.repertoires);
  const independent = duplicate.songs[1] as RichSong;
  expect(independent.id).not.toBe(song.id);
  expect(independent.sections[0]!.id).not.toBe(song.sections[0]!.id);
  expect(independent.arrangements[0]!.voicings[0]!.harmonyId).toBe(
    independent.sections[0]!.chords[0]!.id,
  );
  expect(independent.arrangements[0]!.parts[0]!.events[0]!.measureId).toBe(
    independent.sections[0]!.measures[0]!.id,
  );
  expect(independent.arrangements[0]!.voicings[0]!.sourcePreset).toEqual(
    song.arrangements[0]!.voicings[0]!.sourcePreset,
  );
  await page.reload();
  expect(await readLibrary(page)).toEqual(duplicate);
});
