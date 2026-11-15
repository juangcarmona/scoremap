import { expect, test } from "@playwright/test";
test("Application shell starts in the actual production browser build", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "ScoreMap", exact: true }),
  ).toBeVisible();
});
