import fs from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { createSong, prepared, readLibrary, saved } from "./helpers";
test("SB-BACKUP-EXPORT SB-BACKUP-IMPORT SB-BACKUP-CANCEL SB-PERSIST-RECOVER: actual file download, cancellation, confirmed replacement and reload", async ({
  page,
}) => {
  await prepared(page);
  const original = await readLibrary(page);
  const downloaded = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export backup", exact: true })
    .click();
  const file = await downloaded;
  const content = await fs.readFile((await file.path())!, "utf8");
  expect(JSON.parse(content).library).toEqual(original);
  await createSong(page, "Different current library content");
  const before = await readLibrary(page);
  const input = page.getByLabel("Import backup file", { exact: true });
  let dialog = page.waitForEvent("dialog");
  await input.setInputFiles({
    name: "scoremap-backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(content),
  });
  await (await dialog).dismiss();
  expect(await readLibrary(page)).toEqual(before);
  dialog = page.waitForEvent("dialog");
  await input.setInputFiles({
    name: "scoremap-backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(content),
  });
  await (await dialog).accept();
  await expect
    .poll(async () => (await readLibrary(page)).songs.length)
    .toBe(original.songs.length);
  await saved(page);
  await page.reload();
  await expect(
    page.getByRole("heading", {
      name: "Synthetic rehearsal sketch",
      exact: true,
    }),
  ).toBeVisible();
  const restored = await readLibrary(page);
  expect(restored.schemaVersion).toBe(2);
  for (const song of restored.songs) {
    expect("schemaVersion" in song && song.schemaVersion).toBe(2);
    if (!("arrangements" in song))
      throw new Error("Expected migrated arrangements");
    expect(song.arrangements[0]!.parts[0]!.events).toEqual([]);
    const legacy = original.songs.find((before) => before.id === song.id)!;
    expect({
      ...song,
      schemaVersion: undefined,
      arrangements: undefined,
      migration: undefined,
      sections: song.sections.map((section) => ({
        ...section,
        measures: undefined,
        chords: section.chords.map((chord) => ({
          root: chord.root,
          quality: chord.quality,
        })),
      })),
    }).toEqual({
      ...legacy,
      schemaVersion: undefined,
      arrangements: undefined,
      migration: undefined,
      sections: legacy.sections.map((section) => ({
        ...section,
        measures: undefined,
      })),
    });
  }
  await page.getByText("Originals before migration", { exact: true }).click();
  const originalFile = page.waitForEvent("download");
  await page.getByRole("button", { name: /Export imported original/ }).click();
  expect(
    JSON.parse(await fs.readFile((await (await originalFile).path())!, "utf8"))
      .library,
  ).toEqual(original);
  expect(restored.revision).toBeGreaterThan(before.revision);
});
test("SB-BACKUP-REJECT: invalid import preserves acknowledged local data", async ({
  page,
}) => {
  await prepared(page);
  const original = await readLibrary(page);
  await page.getByLabel("Import backup file", { exact: true }).setInputFiles({
    name: "invalid.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"format":"scoremap-backup","version":999}'),
  });
  await expect(page.getByRole("alert")).toContainText("unsupported");
  expect(await readLibrary(page)).toEqual(original);
});

test("an unsupported PDF backup preserves the saved library after reload", async ({
  page,
}) => {
  await prepared(page);
  const original = await readLibrary(page);
  const incoming = structuredClone(original);
  incoming.songs[0]!.pdf = {
    id: "synthetic-pdf",
    name: "synthetic.pdf",
    data: "JVBERi0xLjQK",
    pages: 1,
    page: 1,
  };
  await page.getByLabel("Import backup file", { exact: true }).setInputFiles({
    name: "synthetic-pdf-backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({
        format: "scoremap-backup",
        version: incoming.schemaVersion,
        library: incoming,
      }),
    ),
  });
  await expect(page.getByRole("alert")).toContainText("PDF attachments");
  expect(await readLibrary(page)).toEqual(original);
  await page.reload();
  expect(await readLibrary(page)).toEqual(original);
});

test("an oversized backup is refused before reading or changing an existing library", async ({
  page,
}, testInfo) => {
  await prepared(page);
  const original = await readLibrary(page);
  const filename = testInfo.outputPath("oversized-synthetic.json");
  const file = await fs.open(filename, "w");
  try {
    await file.truncate(64 * 1024 * 1024 + 1);
  } finally {
    await file.close();
  }
  try {
    await page.evaluate(() => {
      const originalText = File.prototype.text;
      File.prototype.text = function () {
        (window as typeof window & { oversizedRead?: boolean }).oversizedRead =
          true;
        return originalText.call(this);
      };
    });
    await page
      .getByLabel("Import backup file", { exact: true })
      .setInputFiles(filename);
    await expect(page.getByRole("alert")).toContainText(
      "exceeds the 64 MiB import limit",
    );
    expect(
      await page.evaluate(
        () =>
          (window as typeof window & { oversizedRead?: boolean })
            .oversizedRead ?? false,
      ),
    ).toBe(false);
    expect(await readLibrary(page)).toEqual(original);
    await page.reload();
    expect(await readLibrary(page)).toEqual(original);
  } finally {
    await fs.unlink(filename);
  }
});
