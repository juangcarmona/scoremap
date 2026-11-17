import { test, expect } from "@playwright/test";
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
