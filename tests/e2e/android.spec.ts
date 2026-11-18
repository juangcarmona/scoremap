import { expect, test } from "@playwright/test";
import { readLibrary, saved } from "./helpers";
test("SB-OFFLINE SB-PERFORMANCE: Android phone touch editing and offline consultation retain music", async ({
  page,
  context,
}) => {
  await page.goto("/");
  expect(await page.evaluate(() => navigator.userAgent)).toContain("Android");
  await page.getByRole("button", { name: "Library", exact: true }).tap();
  await page.getByRole("button", { name: "New song", exact: true }).tap();
  await page
    .getByRole("dialog")
    .getByLabel("Name", { exact: true })
    .fill("Android synthetic sketch");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Save", exact: true })
    .tap();
  await expect(
    page.getByRole("heading", {
      name: "Android synthetic sketch",
      exact: true,
    }),
  ).toBeVisible();
  await page.getByLabel("New section", { exact: true }).fill("Verse");
  await page.getByRole("button", { name: "Add section", exact: true }).tap();
  await page.getByText("Edit Verse", { exact: true }).tap();
  await page.getByRole("button", { name: "Add chord", exact: true }).tap();
  await page
    .getByLabel("Notes for Verse", { exact: true })
    .fill("Synthetic Android touch reminder");
  await saved(page);
  await page
    .getByRole("button", { name: "Enter performance", exact: true })
    .tap();
  await page
    .getByRole("button", { name: "Verse chord 1: C", exact: true })
    .tap();
  await expect(
    page
      .getByRole("button", { name: "Verse chord 1: C", exact: true })
      .locator("..")
      .locator(".chord-diagram-notes"),
  ).toHaveText("C · E · G");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  await context.setOffline(true);
  await page.reload();
  await expect(
    page.getByText("PERFORMANCE · READ ONLY", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Synthetic Android touch reminder", { exact: true }),
  ).toBeVisible();
  expect((await readLibrary(page)).songs[0]!.sections[0]!.chords).toEqual([
    { root: "C", quality: "major" },
  ]);
  await expect(
    page.getByRole("button", { name: "Add section", exact: true }),
  ).toHaveCount(0);
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "docs/evidence/screenshots/android-phone-offline.png",
    fullPage: true,
  });
  await context.setOffline(false);
});
