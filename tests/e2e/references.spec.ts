import { expect, test } from "@playwright/test";
import { prepared, readLibrary, saved } from "./helpers";
test("SB-REFERENCE SB-ANNOTATIONS: opening a reference keeps pending local work and escapes personal text", async ({
  page,
  context,
}) => {
  await context.route("https://example.com/**", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: "<h1>Synthetic reference target</h1>",
    }),
  );
  await prepared(page);
  await page.getByText("External references", { exact: true }).click();
  await page
    .getByLabel("Reference name", { exact: true })
    .fill("Synthetic external resource");
  await page
    .getByLabel("Web link", { exact: true })
    .fill("https://example.com/resource");
  await page
    .getByRole("button", { name: "Add reference", exact: true })
    .click();
  await saved(page);
  await page
    .getByText("Song details & personal notes", { exact: true })
    .click();
  await page
    .getByLabel("Song notes", { exact: true })
    .fill("<script>synthetic personal reminder</script>");
  const popup = page.waitForEvent("popup");
  await page
    .getByRole("link", { name: "Synthetic external resource ↗", exact: true })
    .click();
  const external = await popup;
  await expect(
    external.getByRole("heading", { name: "Synthetic reference target" }),
  ).toBeVisible();
  await expect(page.getByLabel("Song notes", { exact: true })).toHaveValue(
    "<script>synthetic personal reminder</script>",
  );
  await saved(page);
  expect((await readLibrary(page)).songs[0]!.notes).toBe(
    "<script>synthetic personal reminder</script>",
  );
  await external.close();
  await page
    .getByRole("button", { name: "Enter performance", exact: true })
    .click();
  await expect(
    page.getByText("<script>synthetic personal reminder</script>", {
      exact: true,
    }),
  ).toBeVisible();
  expect(
    await page
      .locator("script")
      .evaluateAll((es) =>
        es.some((e) => e.textContent?.includes("synthetic personal reminder")),
      ),
  ).toBe(false);
});
