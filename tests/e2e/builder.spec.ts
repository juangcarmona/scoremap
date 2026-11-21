import { test, expect, type Locator } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import source from "../fixtures/library-v2.json" with { type: "json" };
import { readLibrary, saved } from "./helpers";
import type { RichSong } from "../../src/features/library/score";
test("actual exact-pitch builder cancels, commits and undoes one octave while viewport changes never transpose music", async ({
  page,
}) => {
  await page.goto("/");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByLabel("Import backup file", { exact: true }).setInputFiles({
    name: "synthetic-rich.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({
        format: "scoremap-backup",
        version: 2,
        library: source,
      }),
    ),
  });
  await saved(page);
  const before = await readLibrary(page);
  await page
    .getByLabel("Active performed part", { exact: true })
    .selectOption("right");
  let builder = page.getByRole("region", {
    name: "Played-note builder for Right",
    exact: true,
  });
  const overview = builder.getByRole("img", { name: /88-key piano overview/ });
  await expect(overview.locator("rect")).toHaveCount(88);
  const octave = builder.getByLabel("First visible octave for Right", {
    exact: true,
  });
  await octave.selectOption("0");
  await expect(overview.locator('[data-midi="21"]')).toHaveAttribute(
    "data-in-view",
    "true",
  );
  await expect(builder.locator('.performed-key[data-midi="21"]')).toBeEnabled();
  await octave.selectOption("7");
  await expect(overview.locator('[data-midi="108"]')).toHaveAttribute(
    "data-in-view",
    "true",
  );
  await expect(
    builder.locator('.performed-key[data-midi="108"]'),
  ).toBeEnabled();
  await octave.selectOption("3");
  expect(await readLibrary(page)).toEqual(before);
  await builder
    .getByRole("button", { name: "Raise B4 one octave", exact: true })
    .click();
  await expect(
    builder.getByRole("status").filter({ hasText: "Outside this view" }),
  ).toContainText("B5");
  expect(await readLibrary(page)).toEqual(before);
  await builder
    .getByLabel("First visible octave for Right", { exact: true })
    .selectOption("4");
  await builder
    .getByLabel("Piano span for Right", { exact: true })
    .selectOption("3");
  await expect(
    builder.getByRole("button", {
      name: "B5 · performed · theoretical tone",
      exact: true,
    }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    builder.getByRole("button", {
      name: "B4 · not performed · theoretical tone",
      exact: true,
    }),
  ).toHaveAttribute("aria-pressed", "false");
  expect(await readLibrary(page)).toEqual(before);
  await builder
    .getByRole("button", { name: "Cancel played-note edit", exact: true })
    .click();
  expect(await readLibrary(page)).toEqual(before);
  const key = builder.getByRole("button", {
    name: "B4 · performed · theoretical tone",
    exact: true,
  });
  await key.focus();
  await page.keyboard.press("Enter");
  await expect(builder.locator(".played-note-list")).not.toContainText("B4");
  await builder
    .getByRole("button", { name: "Cancel played-note edit", exact: true })
    .click();
  await builder
    .getByRole("button", { name: "Raise B4 one octave", exact: true })
    .click();
  await builder
    .getByRole("button", { name: "Apply played notes", exact: true })
    .click();
  await saved(page);
  const expected = structuredClone(before);
  (expected.songs[0] as RichSong).arrangements[0]!.parts[1]!.events[1]!.pitch =
    { spelling: "B", octave: 5, midi: 83 };
  expected.revision++;
  expect(await readLibrary(page)).toEqual(expected);
  await page
    .getByRole("button", { name: "Undo last played-note edit", exact: true })
    .click();
  await saved(page);
  expect(await readLibrary(page)).toEqual({
    ...before,
    revision: expected.revision + 1,
  });
  await page.reload();
  await page
    .getByLabel("Active performed part", { exact: true })
    .selectOption("right");
  builder = page.getByRole("region", {
    name: "Played-note builder for Right",
    exact: true,
  });
  await expect(
    builder.getByRole("button", {
      name: "B4 · performed · theoretical tone",
      exact: true,
    }),
  ).toHaveAttribute("aria-pressed", "true");
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
  await page.screenshot({
    path: "test-results/browser/played-builder-phone.png",
    fullPage: true,
  });
});

test("Cmaj7 preserves the other played notes when E4 moves to E5", async ({
  page,
}) => {
  await page.goto("/");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByLabel("Import backup file", { exact: true }).setInputFiles({
    name: "synthetic-rich.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({
        format: "scoremap-backup",
        version: 2,
        library: source,
      }),
    ),
  });
  await saved(page);
  const before = await readLibrary(page);
  const initialSong = before.songs[0] as RichSong;
  expect(initialSong.sections[0]!.chords[0]).toMatchObject({
    root: "C",
    quality: "major-seventh",
  });
  expect(
    initialSong.arrangements[0]!.parts.flatMap((part) =>
      part.events.map((event) => event.pitch.midi),
    ),
  ).toEqual([36, 43, 64, 71]);
  await page
    .getByLabel("Active performed part", { exact: true })
    .selectOption("right");
  const builder = page.getByRole("region", {
    name: "Played-note builder for Right",
    exact: true,
  });
  const raise = builder.getByRole("button", {
    name: "Raise E4 one octave",
    exact: true,
  });
  await page.keyboard.press("Tab");
  await raise.focus();
  await expect(raise).toBeFocused();
  await page.keyboard.press("Enter");
  const announcement = builder.locator('.played-note-list[aria-live="polite"]');
  await expect(announcement).toContainText("E5");
  expect(await readLibrary(page)).toEqual(before);
  const apply = builder.getByRole("button", {
    name: "Apply played notes",
    exact: true,
  });
  await apply.focus();
  await expect(apply).toBeFocused();
  await page.keyboard.press("Enter");
  await saved(page);
  const expected = structuredClone(before);
  const song = expected.songs[0] as RichSong;
  const event = song.arrangements[0]!.parts[1]!.events.find(
    (entry) => entry.pitch.midi === 64,
  )!;
  event.pitch = { spelling: "E", octave: 5, midi: 76 };
  expected.revision++;
  expect(await readLibrary(page)).toEqual(expected);
  await page.reload();
  expect(await readLibrary(page)).toEqual(expected);
});

test("touching the overlap selects the black key and the exposed area selects its white neighbour", async ({
  page,
}) => {
  await page.goto("/");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByLabel("Import backup file", { exact: true }).setInputFiles({
    name: "synthetic-rich.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({
        format: "scoremap-backup",
        version: 2,
        library: source,
      }),
    ),
  });
  await saved(page);
  await page
    .getByLabel("Active performed part", { exact: true })
    .selectOption("right");
  await page
    .getByLabel("Active performed voicing", { exact: true })
    .selectOption("new");
  const builder = page.getByRole("region", {
    name: "Played-note builder for Right",
    exact: true,
  });
  const white = builder.locator('.performed-key[data-midi="48"]');
  const black = builder.locator('.performed-key[data-midi="49"]');
  async function touchOverlap(whiteKey: Locator, upper: boolean) {
    await whiteKey.scrollIntoViewIfNeeded();
    const whiteBox = (await whiteKey.boundingBox())!;
    const blackBox = (await black.boundingBox())!;
    const left = Math.max(whiteBox.x, blackBox.x);
    const right = Math.min(
      whiteBox.x + whiteBox.width,
      blackBox.x + blackBox.width,
    );
    expect(right - left).toBeGreaterThan(4);
    await page.touchscreen.tap(
      (left + right) / 2,
      upper
        ? blackBox.y + blackBox.height / 2
        : whiteBox.y + whiteBox.height - 10,
    );
  }
  await touchOverlap(white, true);
  await expect(black).toHaveAttribute("aria-pressed", "true");
  await expect(white).toHaveAttribute("aria-pressed", "false");
  await touchOverlap(white, false);
  await expect(black).toHaveAttribute("aria-pressed", "true");
  await expect(white).toHaveAttribute("aria-pressed", "true");
  await touchOverlap(white, true);
  await expect(black).toHaveAttribute("aria-pressed", "false");
  await expect(white).toHaveAttribute("aria-pressed", "true");
  const otherWhite = builder.locator('.performed-key[data-midi="50"]');
  await touchOverlap(otherWhite, true);
  await expect(black).toHaveAttribute("aria-pressed", "true");
  await expect(otherWhite).toHaveAttribute("aria-pressed", "false");
  await touchOverlap(otherWhite, false);
  await expect(black).toHaveAttribute("aria-pressed", "true");
  await expect(otherWhite).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("Tab");
  await white.focus();
  await expect(white).toBeFocused();
  expect(
    await white.evaluate((key) => ({
      visible: key.matches(":focus-visible"),
      style: getComputedStyle(key).outlineStyle,
      width: getComputedStyle(key).outlineWidth,
    })),
  ).toEqual({ visible: true, style: "solid", width: "3px" });
  await touchOverlap(white, true);
  await expect(black).toHaveAttribute("aria-pressed", "false");
  await expect(white).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("Tab");
  await otherWhite.focus();
  await expect(otherWhite).toBeFocused();
  await touchOverlap(otherWhite, true);
  await expect(black).toHaveAttribute("aria-pressed", "true");
  await expect(otherWhite).toHaveAttribute("aria-pressed", "true");
});

test("reusable presets copy acknowledged versions; later preset pitch changes and deletion leave the actual song copies unchanged", async ({
  page,
}) => {
  await page.goto("/");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByLabel("Import backup file", { exact: true }).setInputFiles({
    name: "synthetic-rich.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({
        format: "scoremap-backup",
        version: 2,
        library: source,
      }),
    ),
  });
  await saved(page);
  await page
    .getByLabel("Active performed part", { exact: true })
    .selectOption("right");
  let builder = page.getByRole("region", {
    name: "Played-note builder for Right",
    exact: true,
  });
  await builder
    .getByText("Reusable voicings on this device", { exact: true })
    .click();
  await builder
    .getByLabel("Reusable voicing name", { exact: true })
    .fill("Right seventh");
  const beforePreset = await readLibrary(page);
  await builder
    .getByRole("button", {
      name: "Save preview as reusable voicing",
      exact: true,
    })
    .click();
  await expect(
    builder.getByText("Reusable voicing saved. Song copies are unchanged.", {
      exact: true,
    }),
  ).toBeVisible();
  expect(await readLibrary(page)).toEqual(beforePreset);
  await builder
    .getByRole("button", { name: "Use copy of Right seventh", exact: true })
    .click();
  builder = page.getByRole("region", {
    name: "Played-note builder for Right",
    exact: true,
  });
  await builder
    .getByRole("button", { name: "Apply played notes", exact: true })
    .click();
  await saved(page);
  const withCopy = await readLibrary(page);
  const song = withCopy.songs[0] as RichSong;
  const copied = song.arrangements[0]!.voicings.find(
    (voicing) => voicing.sourcePreset?.name === "Right seventh",
  )!;
  expect(copied.sourcePreset?.revision).toBe(1);
  const events = song.arrangements[0]!.parts[1]!.events.filter(
    (event) => event.voicingId === copied.id,
  );
  expect(events.map((event) => event.pitch)).toEqual([
    { spelling: "E", octave: 4, midi: 64 },
    { spelling: "B", octave: 4, midi: 71 },
  ]);
  expect(
    song.arrangements[0]!.parts[1]!.events.filter(
      (event) => event.voicingId !== copied.id,
    ),
  ).toEqual(
    (beforePreset.songs[0] as RichSong).arrangements[0]!.parts[1]!.events,
  );
  await builder
    .getByRole("button", { name: "Raise B4 one octave", exact: true })
    .click();
  await builder
    .getByText("Reusable voicings on this device", { exact: true })
    .click();
  page.once("dialog", (dialog) => dialog.accept());
  await builder
    .getByRole("button", {
      name: "Update Right seventh from preview",
      exact: true,
    })
    .click();
  await expect(
    builder.getByText("Right seventh · version 2", { exact: true }),
  ).toBeVisible();
  expect(await readLibrary(page)).toEqual(withCopy);
  await builder
    .getByRole("button", { name: "Cancel played-note edit", exact: true })
    .click();
  page.once("dialog", (dialog) => dialog.accept());
  await builder
    .getByRole("button", { name: "Delete preset Right seventh", exact: true })
    .click();
  await expect(
    builder.getByText("No reusable voicings yet.", { exact: true }),
  ).toBeVisible();
  expect(await readLibrary(page)).toEqual(withCopy);
  await page.reload();
  expect(await readLibrary(page)).toEqual(withCopy);
});

test("a saved voicing used in two harmonic events remains independent when one copy changes", async ({
  page,
}) => {
  const fixture = structuredClone(source);
  const section = fixture.songs[0]!.sections[0]!;
  section.chords[1]!.root = "C";
  section.chords[1]!.quality = "major-seventh";
  await page.goto("/");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByLabel("Import backup file", { exact: true }).setInputFiles({
    name: "synthetic-two-events.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({
        format: "scoremap-backup",
        version: 2,
        library: fixture,
      }),
    ),
  });
  await saved(page);
  await page
    .getByLabel("Active performed part", { exact: true })
    .selectOption("right");
  const region = () =>
    page.getByRole("region", {
      name: "Played-note builder for Right",
      exact: true,
    });
  await region()
    .getByText("Reusable voicings on this device", { exact: true })
    .click();
  await region()
    .getByLabel("Reusable voicing name", { exact: true })
    .fill("Shared source");
  await region()
    .getByRole("button", {
      name: "Save preview as reusable voicing",
      exact: true,
    })
    .click();
  await expect(
    region().getByText("Reusable voicing saved. Song copies are unchanged.", {
      exact: true,
    }),
  ).toBeVisible();
  await region()
    .getByRole("button", { name: "Use copy of Shared source", exact: true })
    .click();
  await region()
    .getByRole("button", { name: "Apply played notes", exact: true })
    .click();
  await saved(page);
  const eventSelector = page.getByLabel("Active performed harmonic event", {
    exact: true,
  });
  await eventSelector.selectOption(section.chords[1]!.id);
  await region()
    .getByText("Reusable voicings on this device", { exact: true })
    .click();
  await region()
    .getByRole("button", { name: "Use copy of Shared source", exact: true })
    .click();
  await region()
    .getByRole("button", { name: "Apply played notes", exact: true })
    .click();
  await saved(page);
  const before = await readLibrary(page);
  const song = before.songs[0] as RichSong;
  const arrangement = song.arrangements[0]!;
  const copies = arrangement.voicings.filter(
    (voicing) => voicing.sourcePreset?.name === "Shared source",
  );
  expect(copies).toHaveLength(2);
  const first = copies.find(
    (voicing) => voicing.harmonyId === section.chords[0]!.id,
  )!;
  const second = copies.find(
    (voicing) => voicing.harmonyId === section.chords[1]!.id,
  )!;
  expect(first.id).not.toBe(second.id);
  const part = arrangement.parts.find((value) => value.id === "right")!;
  const secondEvents = part.events.filter(
    (event) => event.voicingId === second.id,
  );
  expect(secondEvents.map((event) => event.pitch.midi)).toEqual([64, 71]);
  await eventSelector.selectOption(section.chords[0]!.id);
  await page
    .getByLabel("Active performed voicing", { exact: true })
    .selectOption(first.id);
  await region()
    .getByRole("button", { name: "Raise E4 one octave", exact: true })
    .click();
  await region()
    .getByRole("button", { name: "Apply played notes", exact: true })
    .click();
  await saved(page);
  const after = await readLibrary(page);
  const updated = (after.songs[0] as RichSong).arrangements[0]!;
  const updatedPart = updated.parts.find((value) => value.id === "right")!;
  expect(
    updatedPart.events.filter((event) => event.voicingId === second.id),
  ).toEqual(secondEvents);
  expect(updated.voicings.find((value) => value.id === second.id)).toEqual(
    second,
  );
  expect(
    updatedPart.events
      .filter((event) => event.voicingId === first.id)
      .map((event) => event.pitch.midi),
  ).toEqual([76, 71]);
  await page.reload();
  expect(await readLibrary(page)).toEqual(after);
});

test("touch keys distinguish octaves and manual identification stays unknown or ambiguous until an explicit harmonic choice", async ({
  page,
}) => {
  await page.goto("/");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByLabel("Import backup file", { exact: true }).setInputFiles({
    name: "synthetic-rich.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({
        format: "scoremap-backup",
        version: 2,
        library: source,
      }),
    ),
  });
  await saved(page);
  await page
    .getByLabel("Active performed part", { exact: true })
    .selectOption("right");
  await page
    .getByLabel("Active performed voicing", { exact: true })
    .selectOption("new");
  const builder = page.getByRole("region", {
    name: "Played-note builder for Right",
    exact: true,
  });
  const before = await readLibrary(page);
  for (const name of [
    "D3 · not performed",
    "G♭3 · not performed",
    "A3 · not performed",
    "C4 · not performed · theoretical tone",
  ])
    await builder.getByRole("button", { name, exact: true }).tap();
  await builder
    .getByRole("button", { name: "Identify played notes", exact: true })
    .click();
  await expect(
    builder.getByText(
      "One supported identification; choose it explicitly to change harmony.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    builder.getByRole("button", { name: "Choose D7", exact: true }),
  ).toBeVisible();
  expect(await readLibrary(page)).toEqual(before);
  await builder
    .getByRole("button", { name: "Cancel played-note edit", exact: true })
    .click();
  for (const name of [
    "C3 · not performed · theoretical tone",
    "D♭3 · not performed",
    "D3 · not performed",
  ])
    await builder.getByRole("button", { name, exact: true }).tap();
  const blackTarget = await builder
    .getByRole("button", { name: "D♭3 · performed", exact: true })
    .boundingBox();
  expect(blackTarget!.width).toBeGreaterThanOrEqual(48);
  expect(blackTarget!.height).toBeGreaterThanOrEqual(48);
  await builder
    .getByRole("button", { name: "Identify played notes", exact: true })
    .click();
  await expect(
    builder.getByText(
      "Unknown — no supported chord identity matches these notes.",
      { exact: true },
    ),
  ).toBeVisible();
  expect(await readLibrary(page)).toEqual(before);
  await builder
    .getByRole("button", {
      name: "C4 · not performed · theoretical tone",
      exact: true,
    })
    .tap();
  await builder
    .getByRole("button", {
      name: "C3 · performed · theoretical tone",
      exact: true,
    })
    .tap();
  await expect(
    builder.getByRole("button", {
      name: "C4 · performed · theoretical tone",
      exact: true,
    }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    builder.getByRole("button", {
      name: "C3 · not performed · theoretical tone",
      exact: true,
    }),
  ).toHaveAttribute("aria-pressed", "false");
  await builder
    .getByRole("button", { name: "Cancel played-note edit", exact: true })
    .click();
  for (const name of [
    "C3 · not performed · theoretical tone",
    "E3 · not performed · theoretical tone",
    "G3 · not performed · theoretical tone",
    "A3 · not performed",
  ])
    await builder.getByRole("button", { name, exact: true }).tap();
  await builder
    .getByRole("button", { name: "Raise lowest note · inversion", exact: true })
    .click();
  await expect(builder.locator(".played-note-list")).toHaveText(
    "Performed: C4 · E3 · G3 · A3",
  );
  expect(await readLibrary(page)).toEqual(before);
  await builder
    .getByRole("button", { name: "Identify played notes", exact: true })
    .click();
  await expect(
    builder.getByText(
      "Ambiguous — several supported identities match. Choose only if you want to change harmony.",
      { exact: true },
    ),
  ).toBeVisible();
  expect(await readLibrary(page)).toEqual(before);
  page.once("dialog", (dialog) => dialog.accept());
  await builder.getByRole("button", { name: /^Choose C6/ }).click();
  await saved(page);
  const chosen = await readLibrary(page);
  const current = chosen.songs[0] as RichSong;
  const previous = before.songs[0] as RichSong;
  expect(current.sections[0]!.chords[0]).toEqual({
    ...previous.sections[0]!.chords[0]!,
    quality: "major-sixth",
  });
  expect(current.arrangements[0]!.parts).toEqual(
    previous.arrangements[0]!.parts,
  );
  await expect(builder.locator(".played-note-list")).toHaveText(
    "Performed: C4 · E3 · G3 · A3",
  );
  await builder
    .getByRole("button", { name: "Cancel played-note edit", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Enter performance", exact: true })
    .click();
  await expect(
    builder.getByRole("button", { name: "Apply played notes", exact: true }),
  ).toHaveCount(0);
  expect(await readLibrary(page)).toEqual(chosen);
});

test("switching to performance while a preset file is read does not import it", async ({
  page,
}) => {
  await page.goto("/");
  const panel = page.locator(".library-footer");
  await panel
    .getByText("Reusable voicings on this device", { exact: true })
    .click();
  await page.evaluate(() => {
    const original = File.prototype.text;
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    Object.assign(window, {
      releasePresetRead: release,
      presetReadStarted: false,
    });
    File.prototype.text = async function () {
      Object.assign(window, { presetReadStarted: true });
      await gate;
      return original.call(this);
    };
  });
  await panel
    .getByLabel("Reusable voicing import file", { exact: true })
    .setInputFiles({
      name: "synthetic-preset.json",
      mimeType: "application/json",
      buffer: Buffer.from(
        JSON.stringify({
          format: "scoremap-voicing-presets",
          version: 1,
          presets: [
            {
              id: "source",
              revision: 1,
              preset: {
                id: "source",
                name: "Synthetic delayed",
                harmony: { root: "C", quality: "major" },
                pitches: [{ spelling: "C", octave: 3, midi: 48 }],
                custom: false,
              },
            },
          ],
        }),
      ),
    });
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as unknown as { presetReadStarted: boolean })
            .presetReadStarted,
      ),
    )
    .toBe(true);
  await page
    .getByRole("button", { name: "Enter performance", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Switch to edit", exact: true }),
  ).toBeVisible();
  page.once("dialog", (dialog) => dialog.accept());
  await page.evaluate(() =>
    (
      window as unknown as { releasePresetRead: () => void }
    ).releasePresetRead(),
  );
  await expect(panel.getByRole("alert")).toContainText("Switch to Edit");
  await expect(
    panel.getByText("Synthetic delayed", { exact: false }),
  ).toHaveCount(0);
});

test("entering performance waits for an already admitted preset save", async ({
  page,
}) => {
  await page.goto("/");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByLabel("Import backup file", { exact: true }).setInputFiles({
    name: "synthetic-rich.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({
        format: "scoremap-backup",
        version: 2,
        library: source,
      }),
    ),
  });
  await saved(page);
  await page
    .getByLabel("Active performed part", { exact: true })
    .selectOption("right");
  const builder = page.getByRole("region", {
    name: "Played-note builder for Right",
    exact: true,
  });
  await builder
    .getByText("Reusable voicings on this device", { exact: true })
    .click();
  await builder
    .getByLabel("Reusable voicing name", { exact: true })
    .fill("Synthetic in flight");
  await page.evaluate(() => {
    const original = crypto.subtle.digest.bind(crypto.subtle);
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    Object.assign(window, { releaseDigest: release, digestStarted: false });
    crypto.subtle.digest = async (...args) => {
      Object.assign(window, { digestStarted: true });
      await gate;
      return original(...args);
    };
  });
  await builder
    .getByRole("button", {
      name: "Save preview as reusable voicing",
      exact: true,
    })
    .click();
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as unknown as { digestStarted: boolean }).digestStarted,
      ),
    )
    .toBe(true);
  await page
    .getByRole("button", { name: "Enter performance", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Enter performance", exact: true }),
  ).toBeDisabled();
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "Finishing save before changing mode" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Switch to edit", exact: true }),
  ).toHaveCount(0);
  await page.evaluate(() =>
    (window as unknown as { releaseDigest: () => void }).releaseDigest(),
  );
  await expect(
    page.getByRole("button", { name: "Switch to edit", exact: true }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          new Promise<string[]>((resolve, reject) => {
            const open = indexedDB.open("scoremap-voicings", 1);
            open.onerror = () => reject(open.error);
            open.onsuccess = () => {
              const db = open.result;
              const read = db
                .transaction("presets")
                .objectStore("presets")
                .getAll();
              read.onerror = () => {
                db.close();
                reject(read.error);
              };
              read.onsuccess = () => {
                db.close();
                resolve(read.result.map((row) => row.preset?.name));
              };
            };
          }),
      ),
    )
    .toContain("Synthetic in flight");
});

test("a failed in-flight preset save keeps edit mode and explains the failure", async ({
  page,
}) => {
  await page.goto("/");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByLabel("Import backup file", { exact: true }).setInputFiles({
    name: "synthetic-rich.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({
        format: "scoremap-backup",
        version: 2,
        library: source,
      }),
    ),
  });
  await saved(page);
  await page
    .getByLabel("Active performed part", { exact: true })
    .selectOption("right");
  const builder = page.getByRole("region", {
    name: "Played-note builder for Right",
    exact: true,
  });
  await builder
    .getByText("Reusable voicings on this device", { exact: true })
    .click();
  await builder
    .getByLabel("Reusable voicing name", { exact: true })
    .fill("Synthetic in flight");
  await page.evaluate(() => {
    const original = crypto.subtle.digest.bind(crypto.subtle);
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    Object.assign(window, { releaseDigest: release, digestStarted: false });
    crypto.subtle.digest = async (...args) => {
      Object.assign(window, { digestStarted: true });
      await gate;
      void original;
      void args;
      throw new Error("Synthetic save failed");
    };
  });
  await builder
    .getByRole("button", {
      name: "Save preview as reusable voicing",
      exact: true,
    })
    .click();
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as unknown as { digestStarted: boolean }).digestStarted,
      ),
    )
    .toBe(true);
  await page
    .getByRole("button", { name: "Enter performance", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Enter performance", exact: true }),
  ).toBeDisabled();
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "Finishing save before changing mode" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Switch to edit", exact: true }),
  ).toHaveCount(0);
  await page.evaluate(() =>
    (window as unknown as { releaseDigest: () => void }).releaseDigest(),
  );
  await expect(
    page.getByRole("alert").filter({ hasText: "Could not finish saving" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Enter performance", exact: true }),
  ).toBeEnabled();
  await expect(builder.getByRole("alert")).toContainText(
    "Synthetic save failed",
  );
});

test("switching to performance while a configuration file is read does not import it", async ({
  page,
}) => {
  await page.goto("/");
  const panel = page.locator(".library-footer");
  await panel
    .getByText("Reusable keyboard configurations on this device", {
      exact: true,
    })
    .click();
  await page.evaluate(() => {
    const original = File.prototype.text;
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    Object.assign(window, {
      releaseConfigurationRead: release,
      configurationReadStarted: false,
    });
    File.prototype.text = async function () {
      Object.assign(window, { configurationReadStarted: true });
      await gate;
      return original.call(this);
    };
  });
  await panel
    .getByLabel("Reusable configuration import file", { exact: true })
    .setInputFiles({
      name: "synthetic-device.json",
      mimeType: "application/json",
      buffer: Buffer.from(
        JSON.stringify({
          format: "scoremap-device-configuration",
          version: 1,
          resource: {
            id: "synthetic-device",
            revision: 1,
            configuration: {
              id: "synthetic-device",
              name: "Synthetic delayed device",
              instrument: "keyboard",
              range: [21, 108],
            },
          },
        }),
      ),
    });
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as unknown as { configurationReadStarted: boolean })
            .configurationReadStarted,
      ),
    )
    .toBe(true);
  await page
    .getByRole("button", { name: "Enter performance", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Switch to edit", exact: true }),
  ).toBeVisible();
  page.once("dialog", (dialog) => dialog.accept());
  await page.evaluate(() =>
    (
      window as unknown as { releaseConfigurationRead: () => void }
    ).releaseConfigurationRead(),
  );
  await expect(panel.getByRole("alert")).toContainText("Switch to Edit");
  await expect(
    panel.getByText("Synthetic delayed device", { exact: false }),
  ).toHaveCount(0);
});

test("interrupted reusable-voicing import resumes after browser restart using its retained mapping without duplicating acknowledged resources", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (
      ...args: Parameters<IDBObjectStore["put"]>
    ) {
      const value = args[0] as { preset?: { name?: string } };
      if (
        this.name === "presets" &&
        value.preset?.name === "Second import" &&
        !localStorage.getItem("synthetic-preset-failed")
      ) {
        localStorage.setItem("synthetic-preset-failed", "true");
        throw new DOMException("Synthetic interruption", "QuotaExceededError");
      }
      return original.apply(this, args);
    };
  });
  await page.goto("/");
  const panel = page.locator(".library-footer");
  await panel
    .getByText("Reusable voicings on this device", { exact: true })
    .click();
  const pitches = [{ spelling: "C", octave: 3, midi: 48 }];
  const originals = ["First import", "Second import"].map((name, index) => ({
    id: `source-${index}`,
    revision: 9,
    preset: {
      id: `source-${index}`,
      name,
      harmony: { root: "C", quality: "major" },
      pitches,
      custom: false,
    },
  }));
  const buffer = Buffer.from(
    JSON.stringify({
      format: "scoremap-voicing-presets",
      version: 1,
      presets: originals,
    }),
  );
  page.once("dialog", (dialog) => dialog.accept());
  await panel
    .getByLabel("Reusable voicing import file", { exact: true })
    .setInputFiles({
      name: "synthetic-presets.json",
      mimeType: "application/json",
      buffer,
    });
  await expect(panel.getByRole("alert")).toContainText("1 of 2 voicings saved");
  await expect(
    panel.getByText("First import · version 1", { exact: true }),
  ).toBeVisible();
  const mappings = await page.evaluate(
    () =>
      new Promise<unknown[]>((resolve, reject) => {
        const request = indexedDB.open("scoremap-preset-imports", 1);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const db = request.result;
          const read = db.transaction("plans").objectStore("plans").getAll();
          read.onsuccess = () => {
            db.close();
            resolve(read.result);
          };
        };
      }),
  );
  expect(mappings).toHaveLength(1);
  expect(JSON.stringify(mappings)).not.toMatch(
    /First import|Second import|pitches|harmony/,
  );
  await page.reload();
  await panel
    .getByText("Reusable voicings on this device", { exact: true })
    .click();
  page.once("dialog", (dialog) => dialog.accept());
  await panel
    .getByLabel("Reusable voicing import file", { exact: true })
    .setInputFiles({
      name: "synthetic-presets.json",
      mimeType: "application/json",
      buffer,
    });
  await expect(
    panel.getByText(
      "Reusable voicing import completed. Review the saved list; source files are kept.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    panel.getByText("First import · version 1", { exact: true }),
  ).toHaveCount(1);
  await expect(
    panel.getByText("Second import · version 1", { exact: true }),
  ).toHaveCount(1);
});
