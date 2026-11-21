import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import song from "../fixtures/arrangement-navigation.json" with { type: "json" };
import { readLibrary, saved } from "./helpers";
import { uniqueRichFixture } from "../connected/rich-fixtures";
import type { RichSong } from "../../src/features/library/score";

test("switching songs and events never leaves stale notes on three keyboards", async ({
  page,
}) => {
  const first = uniqueRichFixture(song as unknown as RichSong);
  const second = uniqueRichFixture(song as unknown as RichSong);
  first.song.title = "Synthetic first song";
  second.song.title = "Synthetic second song";
  await page.goto("/");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByLabel("Import backup file", { exact: true }).setInputFiles({
    name: "synthetic-song-switch.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({
        format: "scoremap-backup",
        version: 2,
        library: {
          schemaVersion: 2,
          revision: 1,
          songs: [first.song, second.song],
          repertoires: [],
        },
      }),
    ),
  });
  await saved(page);
  const before = await readLibrary(page);
  await page
    .getByRole("button", { name: "Enter performance", exact: true })
    .click();
  const selectSong = async (title: string) => {
    const toggle = page.getByRole("button", { name: "Library", exact: true });
    if (await toggle.isVisible()) await toggle.click();
    await page.getByRole("button", { name: title, exact: false }).click();
  };
  const event = page.getByLabel("Active performed harmonic event", {
    exact: true,
  });
  const context = page.getByRole("region", {
    name: "Synchronized keyboard views",
    exact: true,
  });
  const pad = page.getByRole("article", {
    name: "Keyboard Pad keyboard",
    exact: true,
  });
  const padNotes = pad.locator('.performed-key[data-performed="true"]');
  const expectKeyboards = async (padPitches: number[]) => {
    for (const [name, expected] of [
      ["Low keyboard", [36, 43]],
      ["High keyboard", [64, 71]],
      ["Pad keyboard", padPitches],
    ] as const) {
      const keys = page
        .getByRole("article", { name: `Keyboard ${name}`, exact: true })
        .locator('.performed-key[data-performed="true"]');
      await expect
        .poll(() =>
          keys.evaluateAll((nodes) =>
            nodes.map((node) => Number(node.getAttribute("data-midi"))),
          ),
        )
        .toEqual(expected);
    }
  };
  await selectSong(first.song.title);
  await event.selectOption(first.ids.get("h2")!);
  await expect(padNotes).toHaveCount(0);
  await expectKeyboards([]);
  await selectSong(second.song.title);
  await expect(context).toHaveAttribute(
    "data-harmonic-event-id",
    second.ids.get("h1")!,
  );
  await expect(padNotes).toHaveCount(1);
  await expect(padNotes.first()).toHaveAttribute("data-midi", "60");
  await expectKeyboards([60]);
  await expect(
    page
      .locator(
        '.keyboard-view .performed-key[data-midi="36"][data-performed="true"]',
      )
      .first(),
  ).toHaveCSS("background-color", "rgb(184, 215, 238)");
  await expect(
    page
      .locator(
        '.keyboard-view .performed-key[data-midi="64"][data-performed="true"]',
      )
      .first(),
  ).toHaveCSS("background-color", "rgb(200, 230, 189)");
  await event.selectOption(second.ids.get("h2")!);
  await event.selectOption(second.ids.get("h1")!);
  await event.selectOption(second.ids.get("h2")!);
  await expect(context).toHaveAttribute(
    "data-harmonic-event-id",
    second.ids.get("h2")!,
  );
  await expect(padNotes).toHaveCount(0);
  await expectKeyboards([]);
  await selectSong(first.song.title);
  await expect(context).toHaveAttribute(
    "data-harmonic-event-id",
    first.ids.get("h1")!,
  );
  await expect(padNotes).toHaveCount(1);
  await expectKeyboards([60]);
  expect(await readLibrary(page)).toEqual(before);
});

test("SB-PERFORMANCE SB-KEYBOARD: consultation controls and complete played keyboards remain visible without changing music", async ({
  page,
}) => {
  await page.goto("/");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByLabel("Import backup file", { exact: true }).setInputFiles({
    name: "synthetic-consultation.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({
        format: "scoremap-backup",
        version: 2,
        library: {
          schemaVersion: 2,
          revision: 1,
          songs: [song],
          repertoires: [],
        },
      }),
    ),
  });
  await saved(page);
  const original = await readLibrary(page);
  await page
    .getByRole("button", { name: "Enter performance", exact: true })
    .click();
  await expect(page.locator(".chord-diagram")).toHaveCount(3);
  await expect(
    page.getByRole("button", { name: "Verse chord 1: Cmaj7", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".chord-diagram-notes").first()).toHaveText(
    "C · E · G · B",
  );
  await expect(
    page.getByLabel("Visual chord reference", { exact: true }),
  ).toHaveCount(0);
  await page
    .getByLabel("Active performed harmonic event", { exact: true })
    .selectOption("h2");
  await expect(page.locator(".keyboard-view")).toHaveCount(3);
  for (const [width, height, textScale] of [
    [1440, 900, 100],
    [1280, 800, 100],
    [390, 844, 200],
  ]) {
    await page.setViewportSize({ width: width!, height: height! });
    await page.evaluate((scale) => {
      document.documentElement.style.fontSize = `${scale}%`;
    }, textScale);
    await page
      .getByRole("region", { name: "Arrangement workspace", exact: true })
      .evaluate((element) => element.scrollIntoView({ block: "start" }));
    const occurrence = page.getByLabel("Occurrence of Verse", { exact: true });
    await occurrence.scrollIntoViewIfNeeded();
    expect(
      await occurrence.evaluate((control) => {
        const bounds = control.getBoundingClientRect();
        return (
          document.elementFromPoint(
            bounds.left + bounds.width / 2,
            bounds.top + bounds.height / 2,
          ) === control
        );
      }),
    ).toBe(true);
    for (const keyboard of await page.locator(".keyboard-view").all()) {
      const scroll = keyboard.locator(".keyboard-scroll");
      const white = keyboard.locator(".played-white").first();
      const box = await white.boundingBox();
      expect(box!.height / box!.width).toBeGreaterThan(1.2);
      expect(box!.height / box!.width).toBeLessThan(5.5);
      for (const key of await keyboard
        .locator('[data-performed="true"]')
        .all()) {
        expect(
          await key.evaluate((element) => {
            const bounds = element.getBoundingClientRect();
            const viewport = element
              .closest(".keyboard-keys")!
              .getBoundingClientRect();
            return (
              bounds.left >= viewport.left && bounds.right <= viewport.right
            );
          }),
        ).toBe(true);
        await expect(key.locator(".key-pitch")).toBeVisible();
      }
      const settings = keyboard.locator("details.keyboard-options");
      if (
        !(await settings.evaluate(
          (element: HTMLDetailsElement) => element.open,
        ))
      )
        await keyboard
          .getByText("Adjust visible range", { exact: true })
          .click();
      await keyboard
        .getByRole("combobox", { name: /Piano span/ })
        .selectOption("3");
      expect(
        await scroll.evaluate((element) => getComputedStyle(element).overflowX),
      ).toBe("auto");
    }
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      ),
    ).toBe(true);
  }
  expect(await readLibrary(page)).toEqual(original);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page
    .getByRole("button", { name: "Switch to edit", exact: true })
    .click();
  const editableKey = page
    .locator(".arrangement-workspace .performed-key:not(:disabled)")
    .first();
  expect((await editableKey.boundingBox())!.width).toBeGreaterThanOrEqual(48);
});

test("SB-KEYBOARD: flat notes on black keys retain their complete dual labels at enlarged text", async ({
  page,
}) => {
  const sample = structuredClone(song);
  sample.sections[0]!.chords.find((chord) => chord.id === "h2")!.root = "Db";
  const replacements: Record<
    string,
    { spelling: string; octave: number; midi: number }
  > = {
    C2: { spelling: "Db", octave: 2, midi: 37 },
    G2: { spelling: "Ab", octave: 2, midi: 44 },
    E4: { spelling: "F", octave: 4, midi: 65 },
    B4: { spelling: "C", octave: 5, midi: 72 },
  };
  for (const part of sample.arrangements[0]!.parts)
    for (const event of part.events)
      if (event.voicingId === "v2")
        event.pitch =
          replacements[`${event.pitch.spelling}${event.pitch.octave}`]!;
  await page.goto("/");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByLabel("Import backup file", { exact: true }).setInputFiles({
    name: "synthetic-flats.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({
        format: "scoremap-backup",
        version: 2,
        library: {
          schemaVersion: 2,
          revision: 1,
          songs: [sample],
          repertoires: [],
        },
      }),
    ),
  });
  await saved(page);
  const original = await readLibrary(page);
  await page
    .getByRole("button", { name: "Enter performance", exact: true })
    .click();
  await page
    .getByLabel("Note names", { exact: true })
    .selectOption("dual-latin");
  await page
    .getByLabel("Active performed harmonic event", { exact: true })
    .selectOption("h2");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "200%";
  });
  const blackKeys = page.locator(
    '.keyboard-view .played-black[data-performed="true"]',
  );
  await expect(blackKeys).toHaveCount(2);
  await expect(blackKeys.first()).toHaveCSS(
    "background-color",
    "rgb(39, 102, 152)",
  );
  await expect(blackKeys.nth(0).locator(".key-pitch")).toHaveText("Re♭2 (D♭2)");
  await expect(blackKeys.nth(1).locator(".key-pitch")).toHaveText("La♭2 (A♭2)");
  for (const key of await blackKeys.all()) {
    expect(
      await key.evaluate((element) => {
        const label = element.querySelector(".key-pitch")!;
        const box = element.getBoundingClientRect();
        const range = document.createRange();
        range.selectNodeContents(label);
        return Array.from(range.getClientRects()).every(
          (text) =>
            text.left >= box.left - 1 &&
            text.right <= box.right + 1 &&
            text.top >= box.top - 1 &&
            text.bottom <= box.bottom + 1,
        );
      }),
    ).toBe(true);
  }
  await page.setViewportSize({ width: 1280, height: 800 });
  for (const fontSize of ["100%", "200%"]) {
    await page.evaluate((size) => {
      document.documentElement.style.fontSize = size;
    }, fontSize);
    for (const key of await blackKeys.all()) {
      expect(
        await key.evaluate((element) => {
          const label = element.querySelector(".key-pitch")!;
          const bounds = element.getBoundingClientRect();
          const range = document.createRange();
          range.selectNodeContents(label);
          return Array.from(range.getClientRects()).every(
            (text) =>
              text.left >= bounds.left - 1 &&
              text.right <= bounds.right + 1 &&
              text.top >= bounds.top - 1 &&
              text.bottom <= bounds.bottom + 1,
          );
        }),
      ).toBe(true);
    }
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(1280);
  }
  expect(await readLibrary(page)).toEqual(original);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("landscape tablet keeps song navigation and two keyboards visible together", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByLabel("Import backup file", { exact: true }).setInputFiles({
    name: "synthetic-tablet-layout.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({
        format: "scoremap-backup",
        version: 2,
        library: {
          schemaVersion: 2,
          revision: 1,
          songs: [song],
          repertoires: [],
        },
      }),
    ),
  });
  await saved(page);
  const before = await readLibrary(page);
  await page
    .getByRole("button", { name: "Enter performance", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Show keyboards beside song" })
    .click();
  await page.evaluate(() => window.scrollTo(0, 0));
  await testInfo.attach("tablet-consultation", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  const keyboardRegions = page.locator(".keyboard-view .keyboard-scroll");
  await expect(keyboardRegions).toHaveCount(3);
  for (const region of (await keyboardRegions.all()).slice(0, 2)) {
    const box = await region.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.y + box!.height).toBeLessThanOrEqual(800);
    const whiteKey = await region
      .locator(".played-white")
      .first()
      .boundingBox();
    expect(whiteKey!.width).toBeGreaterThanOrEqual(18);
    expect(
      await region.evaluate((element) => element.scrollWidth),
    ).toBeLessThanOrEqual(
      await region.evaluate((element) => element.clientWidth),
    );
  }
  for (const noteList of (
    await page.locator(".keyboard-view .played-note-list").all()
  ).slice(0, 2)) {
    const box = await noteList.boundingBox();
    expect(box!.y + box!.height).toBeLessThanOrEqual(800);
  }
  await expect(
    page.getByRole("button", { name: /Cmaj7/ }).first(),
  ).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(1280);
  await page.setViewportSize({ width: 390, height: 844 });
  const high = page.getByRole("article", { name: "Keyboard High keyboard" });
  await expect(high.locator(".played-note-list")).toContainText(
    "Scroll to see B4",
  );
  await high.locator(".keyboard-scroll").evaluate((element) => {
    element.scrollLeft = element.scrollWidth;
  });
  await expect(high.locator(".played-note-list")).not.toContainText(
    "Scroll to see B4",
  );
  await page
    .getByLabel("Active performed harmonic event")
    .selectOption({ index: 1 });
  await expect(
    page
      .getByRole("article", { name: "Keyboard Pad keyboard" })
      .locator('.performed-key[data-performed="true"]'),
  ).toHaveCount(0);
  expect(await readLibrary(page)).toEqual(before);
  await page.getByRole("button", { name: "Switch to edit" }).click();
  const editor = page.locator('.performed-piano[data-editable="true"]');
  await expect(editor.locator(".played-note-list")).not.toContainText(
    "Scroll to see",
  );
  const editKey = await editor.locator(".played-white").first().boundingBox();
  expect(editKey!.width).toBeGreaterThanOrEqual(48);
});

test("1024px landscape tablet keeps two keyboards and library navigation available", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto("/");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByLabel("Import backup file", { exact: true }).setInputFiles({
    name: "synthetic-tablet-1024.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({
        format: "scoremap-backup",
        version: 2,
        library: {
          schemaVersion: 2,
          revision: 1,
          songs: [song],
          repertoires: [],
        },
      }),
    ),
  });
  await saved(page);
  await page
    .getByRole("button", { name: "Enter performance", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Show keyboards beside song" })
    .click();
  await page.evaluate(() => window.scrollTo(0, 0));
  await testInfo.attach("tablet-1024", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  const keyboards = page.locator(".keyboard-view .keyboard-scroll");
  await expect(keyboards).toHaveCount(3);
  for (const keyboard of (await keyboards.all()).slice(0, 2)) {
    const box = await keyboard.boundingBox();
    expect(box!.y + box!.height).toBeLessThanOrEqual(768);
    expect(await keyboard.evaluate((el) => el.scrollWidth)).toBeLessThanOrEqual(
      await keyboard.evaluate((el) => el.clientWidth),
    );
    expect(
      (await keyboard.locator(".played-white").first().boundingBox())!.width,
    ).toBeGreaterThanOrEqual(18);
  }
  for (const notes of (
    await page.locator(".keyboard-view .played-note-list").all()
  ).slice(0, 2)) {
    const box = await notes.boundingBox();
    expect(box!.y + box!.height).toBeLessThanOrEqual(768);
  }
  const toggle = page.getByRole("button", { name: "Library", exact: true });
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(
    page.getByRole("button", { name: /Synthetic synchronized consultation/ }),
  ).toBeVisible();
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(1024);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
