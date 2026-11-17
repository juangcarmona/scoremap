import fs from "node:fs/promises";
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import legacy from "../fixtures/library-v1.json" with { type: "json" };
import migrated from "../fixtures/library-v1-migrated.json" with { type: "json" };
import { readLibrary, saved } from "./helpers";
test("real browser v1 import retains its original, activates deterministic identified form and edits/reopens the same event", async ({
  page,
}) => {
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
  await expect(
    page.getByRole("heading", { name: "Synthetic form", exact: true }),
  ).toBeVisible();
  expect(await readLibrary(page)).toEqual({ ...migrated, revision: 1 });
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Synthetic form", exact: true }),
  ).toBeVisible();
  await page.getByText("Edit Verse", { exact: true }).click();
  await page
    .getByLabel("Chord position for Verse", { exact: true })
    .selectOption(migrated.songs[0]!.sections[0]!.chords[0]!.id);
  await page
    .getByLabel("Quality for Verse", { exact: true })
    .selectOption("major-seventh");
  await expect(
    page.getByText("Theoretical preview: C · E · G · B", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Change chord", exact: true }).click();
  await saved(page);
  const expected = structuredClone(migrated);
  expected.songs[0]!.sections[0]!.chords[0]!.quality = "major-seventh";
  expect(await readLibrary(page)).toEqual({ ...expected, revision: 2 });
  await page
    .getByRole("button", { name: "Verse chord 1: Cmaj7", exact: true })
    .click();
  await expect(
    page.getByText("Theoretical notes: C · E · G · B", { exact: true }),
  ).toBeVisible();
  await page.getByText("Originals before migration", { exact: true }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: /Export imported original/ }).click();
  expect(
    JSON.parse(await fs.readFile((await (await download).path())!, "utf8"))
      .library,
  ).toEqual(legacy);
  await page
    .getByRole("button", { name: "Enter performance", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Change chord", exact: true }),
  ).toHaveCount(0);
  await page.reload();
  await expect(
    page.getByText("Theoretical notes: C · E · G · B", { exact: true }),
  ).toBeVisible();
  expect(await readLibrary(page)).toEqual({ ...expected, revision: 2 });
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
