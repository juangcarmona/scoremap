import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import song from "../fixtures/arrangement-navigation.json" with { type: "json" };
import { readLibrary, saved } from "./helpers";

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
  expect(await readLibrary(page)).toEqual(original);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
