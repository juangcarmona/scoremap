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
