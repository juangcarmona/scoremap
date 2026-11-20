import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { prepared, readLibrary, saved } from "./helpers";
test("landscape performance prioritizes the song and keeps the library accessible", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await prepared(page);
  const before = await readLibrary(page);
  await page.getByRole("button", { name: "Enter performance" }).click();
  const structure = page.locator(".sketch-performance .structure");
  const workspace = page.locator(".song-workspace");
  const structureBox = await structure.boundingBox();
  const workspaceBox = await workspace.boundingBox();
  expect(structureBox!.width).toBeGreaterThan(workspaceBox!.width * 0.85);
  await expect(
    page.getByRole("button", { name: "Intro chord 1: C" }),
  ).toBeInViewport();
  const toggle = page.getByRole("button", { name: "Library", exact: true });
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await toggle.click();
  await expect(
    page.getByRole("complementary", { name: "Music library" }),
  ).toBeVisible();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  expect(await readLibrary(page)).toEqual(before);
});
test("SB-SECTION-REORDER SB-ANNOTATIONS SB-PERFORMANCE SB-PERFORMANCE-REJECT SB-KEYBOARD: prepare, reorder, consult and retain exact content", async ({
  page,
}) => {
  await prepared(page);
  const before = await readLibrary(page);
  await page
    .getByRole("button", { name: "Move Verse up", exact: true })
    .click();
  await saved(page);
  const next = await readLibrary(page);
  expect(next.songs[0]!.sections).toEqual([
    before.songs[0]!.sections[1],
    before.songs[0]!.sections[0],
  ]);
  await page
    .getByRole("button", { name: "Verse chord 1: D♭m", exact: true })
    .click();
  await expect(
    page.getByRole("img", { name: "Db minor piano keyboard" }),
  ).toBeVisible();
  expect(
    await page
      .locator('rect[data-highlighted="true"]')
      .evaluateAll((es) =>
        es
          .map((e) => Number(e.getAttribute("data-midi")))
          .sort((a, b) => a - b),
      ),
  ).toEqual([49, 52, 56, 61, 64, 68]);
  await page
    .getByRole("button", { name: "Enter performance", exact: true })
    .click();
  await expect(
    page.getByText("PERFORMANCE · READ ONLY", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "New song", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Add section", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("textbox", { name: "Notes for Verse", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByText("Synthetic cue: leave room for the melody", { exact: true }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("button", { name: "Intro chord 1: C", exact: true })
      .locator(".chord-diagram"),
  ).toBeVisible();
  await expect(
    page
      .getByRole("button", { name: "Verse chord 1: D♭m", exact: true })
      .locator(".chord-diagram"),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Intro chord 1: C", exact: true })
    .click();
  await expect(
    page
      .getByRole("button", { name: "Intro chord 1: C", exact: true })
      .locator("..")
      .locator(".chord-diagram-notes"),
  ).toHaveText("C · E · G");
  await expect(
    page.getByRole("button", { name: "Intro chord 1: C", exact: true }),
  ).toHaveAccessibleDescription("Chord tones: C, E, G");
  await expect(
    page
      .getByRole("button", { name: "Verse chord 1: D♭m", exact: true })
      .locator("..")
      .locator(".chord-diagram-notes"),
  ).toHaveText("D♭ · F♭ · A♭");
  expect(
    await page
      .getByRole("button", { name: "Intro chord 1: C", exact: true })
      .locator('[data-chord-tone="true"]')
      .evaluateAll((keys) =>
        keys
          .map((key) => Number(key.getAttribute("data-pitch-class")))
          .sort((a, b) => a - b),
      ),
  ).toEqual([0, 4, 7]);
  const flatDiagram = page.getByRole("button", {
    name: "Verse chord 1: D♭m",
    exact: true,
  });
  const fill = (selector: string) =>
    flatDiagram
      .locator(selector)
      .first()
      .evaluate((key) => getComputedStyle(key).fill);
  expect(await flatDiagram.locator(".black-key.highlighted").count()).toBe(2);
  expect(await flatDiagram.locator(".white-key.highlighted").count()).toBe(1);
  expect(await fill(".black-key.highlighted")).not.toBe(
    await fill(".black-key:not(.highlighted)"),
  );
  expect(await fill(".white-key.highlighted")).not.toBe(
    await fill(".white-key:not(.highlighted)"),
  );
  expect(await fill(".black-key.highlighted")).not.toBe(
    await fill(".white-key.highlighted"),
  );
  expect(await readLibrary(page)).toEqual(next);
  const axe = await new AxeBuilder({ page }).analyze();
  expect(axe.violations).toEqual([]);
  await page
    .getByRole("button", { name: "Switch to edit", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Add section", exact: true }),
  ).toBeVisible();
});
test("SB-CHORD-MODIFY: changing a chord updates real keyboard notes immediately", async ({
  page,
}) => {
  await prepared(page);
  const verse = page
    .locator(".section")
    .filter({ has: page.getByRole("heading", { name: "Verse", exact: true }) });
  await page
    .getByRole("button", { name: "Verse chord 1: D♭m", exact: true })
    .click();
  await verse
    .getByLabel("Chord position for Verse", { exact: true })
    .selectOption("0");
  await verse.getByLabel("Root for Verse", { exact: true }).selectOption("F#");
  await verse
    .getByLabel("Quality for Verse", { exact: true })
    .selectOption("major");
  await verse
    .getByRole("button", { name: "Change chord", exact: true })
    .click();
  await expect(
    page.getByRole("img", { name: "F# major piano keyboard" }),
  ).toBeVisible();
  expect(
    await page
      .locator('rect[data-highlighted="true"]')
      .evaluateAll((es) =>
        es
          .map((e) => Number(e.getAttribute("data-midi")))
          .sort((a, b) => a - b),
      ),
  ).toEqual([49, 54, 58, 61, 66, 70]);
});
