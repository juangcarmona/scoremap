import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { addSection, chord, createSong, readLibrary, saved } from "./helpers";
import source from "../fixtures/library-v2.json" with { type: "json" };
import type { RichSong } from "../../src/features/library/score";
import { validateLibrary } from "../../src/features/library/domain";
test("current song notation switches labels, preserves spelling/music and persists during read-only consultation", async ({
  page,
}) => {
  await page.goto("/");
  await createSong(page, "Synthetic notation");
  await addSection(page, "Verse");
  await chord(page, "Verse", "C#", "minor");
  await chord(page, "Verse", "Db", "major");
  const before = await readLibrary(page);
  const choice = page.getByLabel("Note names", { exact: true });
  await choice.selectOption("latin");
  await expect(
    page.getByRole("button", { name: "Verse chord 1: Do♯m", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("option", { name: "Re♭", exact: true }),
  ).toHaveAttribute("value", "Db");
  await page
    .getByRole("button", { name: "Verse chord 2: Re♭", exact: true })
    .click();
  await expect(
    page.getByText("Theoretical notes: Re♭ · Fa · La♭", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("img", { name: "Reb major piano keyboard" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Enter performance", exact: true })
    .click();
  await choice.selectOption("dual-latin");
  await expect(
    page.getByRole("button", {
      name: "Verse chord 1: Do♯m (C♯m)",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("button", { name: "Verse chord 2: Re♭ (D♭)", exact: true })
      .locator("..")
      .locator(".chord-diagram-notes"),
  ).toHaveText("Re♭ (D♭) · Fa (F) · La♭ (A♭)");
  await choice.selectOption("dual-anglo");
  await expect(
    page.getByRole("button", {
      name: "Verse chord 1: C♯m (Do♯m)",
      exact: true,
    }),
  ).toBeVisible();
  expect(await readLibrary(page)).toEqual(before);
  await page.reload();
  await expect(choice).toHaveValue("dual-anglo");
  await expect(
    page.getByText("PERFORMANCE · READ ONLY", { exact: true }),
  ).toBeVisible();
  expect(await readLibrary(page)).toEqual(before);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("slash-chord notation switches across the song, editor and performance without revising music", async ({
  page,
}) => {
  const library = validateLibrary(structuredClone(source));
  (library.songs[0] as RichSong).sections[0]!.chords[0]!.bass = "E";
  await page.goto("/");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByLabel("Import backup file", { exact: true }).setInputFiles({
    name: "synthetic-slash.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({ format: "scoremap-backup", version: 2, library }),
    ),
  });
  await saved(page);
  const before = await readLibrary(page);
  const choice = page.getByLabel("Note names", { exact: true });
  await expect(
    page.getByRole("button", { name: "Verse chord 1: Cmaj7/E", exact: true }),
  ).toBeVisible();
  await page.getByText("Edit Verse", { exact: true }).click();
  await page
    .getByLabel("Chord position for Verse", { exact: true })
    .selectOption((library.songs[0] as RichSong).sections[0]!.chords[0]!.id);
  await expect(
    page.getByLabel("Slash bass for Verse", { exact: true }),
  ).toHaveValue("E");
  await choice.selectOption("latin");
  await expect(
    page.getByRole("button", { name: "Verse chord 1: Domaj7/Mi", exact: true }),
  ).toBeVisible();
  await expect(
    page
      .getByLabel("Slash bass for Verse", { exact: true })
      .getByRole("option", { name: "Mi", exact: true }),
  ).toHaveAttribute("value", "E");
  await page
    .getByRole("button", { name: "Enter performance", exact: true })
    .click();
  await choice.selectOption("dual-latin");
  const chord = page.getByRole("button", {
    name: "Verse chord 1: Domaj7/Mi (Cmaj7/E)",
    exact: true,
  });
  await expect(chord).toBeVisible();
  await expect(chord.locator("..").locator(".chord-diagram-notes")).toHaveText(
    "Do (C) · Mi (E) · Sol (G) · Si (B)",
  );
  expect(await readLibrary(page)).toEqual(before);
  await page.reload();
  await expect(choice).toHaveValue("dual-latin");
  await expect(chord).toBeVisible();
  expect(await readLibrary(page)).toEqual(before);
});
