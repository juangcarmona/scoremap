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
      expect(
        await scroll.evaluate(
          (element) => element.scrollWidth <= element.clientWidth + 1,
        ),
      ).toBe(true);
      for (const key of await keyboard
        .locator('[data-performed="true"]')
        .all()) {
        expect(
          await key.evaluate((element) => {
            const bounds = element.getBoundingClientRect();
            const viewport = element
              .closest(".keyboard-scroll")!
              .getBoundingClientRect();
            return (
              bounds.left >= viewport.left && bounds.right <= viewport.right
            );
          }),
        ).toBe(true);
      }
      await keyboard
        .getByRole("combobox", { name: /Piano span/ })
        .selectOption("3");
      expect(
        await scroll.evaluate(
          (element) => element.scrollWidth <= element.clientWidth + 1,
        ),
      ).toBe(true);
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
