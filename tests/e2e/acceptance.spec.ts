import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { prepared } from "./helpers";
test("Tablet, Android-compatible phone and 200% text retain readable touch consultation", async ({
  page,
}) => {
  await prepared(page);
  await page
    .getByRole("button", { name: "Enter performance", exact: true })
    .click();
  for (const width of [1280, 900, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 800 });
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            document.documentElement.scrollWidth <=
            document.documentElement.clientWidth,
        ),
      )
      .toBe(true);
    if (width === 390 || width === 1280)
      await page.screenshot({
        path: `docs/evidence/screenshots/performance-${width}.png`,
        fullPage: true,
      });
  }
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.addStyleTag({ content: "html:root { font-size: 200%; }" });
  expect(
    await page.evaluate(
      () => getComputedStyle(document.documentElement).fontSize,
    ),
  ).toBe("32px");
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      ),
    )
    .toBe(true);
  await page.screenshot({
    path: "docs/evidence/screenshots/performance-text-200.png",
    fullPage: true,
  });
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
test("Edit surfaces, dialogs and empty states have accessible names and contrast", async ({
  page,
}) => {
  await page.goto("/");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByRole("button", { name: "New song", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await prepared(page);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({
    path: "docs/evidence/screenshots/editor-tablet.png",
    fullPage: true,
  });
});

test("An empty library offers a direct import path on a narrow screen", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Your music starts here" }),
  ).toBeVisible();
  const chooser = page.waitForEvent("filechooser");
  await page
    .getByRole("button", { name: "Import a backup", exact: true })
    .click();
  const file = await chooser;
  page.once("dialog", (dialog) => dialog.accept());
  await file.setFiles({
    name: "synthetic-scoremap.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({
        format: "scoremap-backup",
        version: 1,
        library: {
          schemaVersion: 1,
          revision: 0,
          repertoires: [],
          songs: [
            {
              id: "synthetic-song",
              title: "Imported song",
              artist: "",
              notes: "",
              sections: [],
              references: [],
            },
          ],
        },
      }),
    ),
  });
  await expect(
    page.getByRole("heading", { name: "Imported song", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Imported song", exact: true }),
  ).toBeVisible();
});
