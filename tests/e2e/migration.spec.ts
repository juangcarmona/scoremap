import fs from "node:fs/promises";
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import legacy from "../fixtures/library-v1.json" with { type: "json" };
import migrated from "../fixtures/library-v1-migrated.json" with { type: "json" };
import { createSong, readLibrary, saved } from "./helpers";

test("SB-BACKUP-IMPORT-EMPTY: a confirmed empty v1 import replaces music only after consent and retains its original", async ({
  page,
}) => {
  await page.goto("/");
  await createSong(page, "Synthetic song before empty import");
  const before = await readLibrary(page);
  const original = {
    schemaVersion: 1,
    revision: 7,
    songs: [],
    repertoires: [],
  };
  const backup = {
    name: "synthetic-empty-v1.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({
        format: "scoremap-backup",
        version: 1,
        library: original,
      }),
    ),
  };
  const input = page.getByLabel("Import backup file", { exact: true });
  page.once("dialog", (dialog) => dialog.dismiss());
  await input.setInputFiles(backup);
  expect(await readLibrary(page)).toEqual(before);
  await page.reload();
  expect(await readLibrary(page)).toEqual(before);

  page.once("dialog", (dialog) => dialog.accept());
  await input.setInputFiles(backup);
  await expect
    .poll(async () => await readLibrary(page))
    .toEqual({ ...original, schemaVersion: 2, revision: before.revision + 1 });
  await saved(page);
  await expect(
    page.getByText("Your music starts here. Create a song when you are ready."),
  ).toBeVisible();
  await page.reload();
  expect(await readLibrary(page)).toEqual({
    ...original,
    schemaVersion: 2,
    revision: before.revision + 1,
  });
  await page.getByText("Originals before migration", { exact: true }).click();
  const originals = page.getByRole("button", {
    name: /Export imported original/,
  });
  await expect(originals).toHaveCount(1);
  const downloaded = page.waitForEvent("download");
  await originals.click();
  expect(
    JSON.parse(await fs.readFile((await (await downloaded).path())!, "utf8"))
      .library,
  ).toEqual(original);
});

test("interrupted browser migration preserves the current library and retries the original exactly once", async ({
  page,
}) => {
  await page.goto("/");
  await createSong(page, "Synthetic preserved song");
  const before = await readLibrary(page);
  const backup = {
    name: "synthetic-v1.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({
        format: "scoremap-backup",
        version: 1,
        library: legacy,
      }),
    ),
  };
  await page.evaluate(() => {
    const original = IDBObjectStore.prototype.put;
    const add = IDBObjectStore.prototype.add;
    (window as typeof window & { stagedMigration: boolean }).stagedMigration =
      false;
    IDBObjectStore.prototype.add = function (
      value: unknown,
      key?: IDBValidKey,
    ) {
      if (
        this.transaction.db.name === "scoremap" &&
        this.name === "library" &&
        typeof key === "string" &&
        key.startsWith("migration-import-source:")
      ) {
        (
          window as typeof window & { stagedMigration: boolean }
        ).stagedMigration = true;
        IDBObjectStore.prototype.add = add;
      }
      return add.call(this, value, key);
    };
    IDBObjectStore.prototype.put = function (
      value: unknown,
      key?: IDBValidKey,
    ) {
      if (
        this.transaction.db.name === "scoremap" &&
        this.name === "library" &&
        key === "current"
      ) {
        IDBObjectStore.prototype.put = original;
        throw new DOMException(
          "Synthetic migration interruption",
          "QuotaExceededError",
        );
      }
      return original.call(this, value, key);
    };
  });
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .getByLabel("Import backup file", { exact: true })
    .setInputFiles(backup);
  await expect(page.getByRole("alert")).toContainText(
    "Synthetic migration interruption",
  );
  expect(
    await page.evaluate(
      () =>
        (window as typeof window & { stagedMigration: boolean })
          .stagedMigration,
    ),
  ).toBe(true);
  expect(await readLibrary(page)).toEqual(before);
  await page.reload();
  await expect(
    page.getByRole("heading", {
      name: "Synthetic preserved song",
      exact: true,
    }),
  ).toBeVisible();
  expect(await readLibrary(page)).toEqual(before);
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .getByLabel("Import backup file", { exact: true })
    .setInputFiles(backup);
  await saved(page);
  expect(await readLibrary(page)).toEqual({
    ...migrated,
    revision: before.revision + 1,
  });
  await page.reload();
  expect(await readLibrary(page)).toEqual({
    ...migrated,
    revision: before.revision + 1,
  });
  await page.getByText("Originals before migration", { exact: true }).click();
  const originals = page.getByRole("button", {
    name: /Export imported original/,
  });
  await expect(originals).toHaveCount(1);
  const downloaded = page.waitForEvent("download");
  await originals.click();
  expect(
    JSON.parse(await fs.readFile((await (await downloaded).path())!, "utf8"))
      .library,
  ).toEqual(legacy);
});
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
    page
      .getByRole("button", { name: "Verse chord 1: Cmaj7", exact: true })
      .locator("..")
      .locator(".chord-diagram-notes"),
  ).toHaveText("C · E · G · B");
  expect(await readLibrary(page)).toEqual({ ...expected, revision: 2 });
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
