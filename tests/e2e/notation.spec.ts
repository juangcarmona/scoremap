import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { addSection, chord, createSong, readLibrary } from "./helpers";
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
    page.getByText("Theoretical notes: Re♭ (D♭) · Fa (F) · La♭ (A♭)", {
      exact: true,
    }),
  ).toBeVisible();
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
