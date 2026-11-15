import { expect, test } from "@playwright/test";
import { prepared, readLibrary, saved } from "./helpers";
test("SB-OFFLINE: production application reloads, edits, saves and recovers without a network", async ({
  page,
  context,
}) => {
  await prepared(page);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  await context.setOffline(true);
  await page.reload();
  await expect(
    page.getByRole("heading", {
      name: "Synthetic rehearsal sketch",
      exact: true,
    }),
  ).toBeVisible();
  const verse = page
    .locator(".section")
    .filter({ has: page.getByRole("heading", { name: "Verse", exact: true }) });
  await verse.getByText("Edit Verse", { exact: true }).click();
  await verse
    .getByLabel("Notes for Verse", { exact: true })
    .fill("Written entirely offline");
  await saved(page);
  await page.reload();
  await expect
    .poll(
      async () =>
        (await readLibrary(page)).songs[0]!.sections.find(
          (s) => s.name === "Verse",
        )!.notes,
    )
    .toBe("Written entirely offline");
  await page
    .getByRole("button", { name: "Enter performance", exact: true })
    .click();
  await expect(
    page.getByText("Written entirely offline", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Verse chord 1: D♭m", exact: true })
    .click();
  await expect(
    page.getByRole("img", { name: "Db minor piano keyboard" }),
  ).toBeVisible();
  await context.setOffline(false);
});
test("Installability contract exposes complete local manifest, icons and an active service worker", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() => navigator.serviceWorker.ready);
  const manifest = await page.evaluate(async () => {
    const href =
      document.querySelector<HTMLLinkElement>("link[rel=manifest]")!.href;
    return (await fetch(href)).json();
  });
  expect(manifest.display).toBe("standalone");
  expect(manifest.name).toBe("ScoreMap");
  expect(manifest.icons.map((x: { sizes: string }) => x.sizes)).toEqual([
    "192x192",
    "512x512",
  ]);
  for (const icon of manifest.icons) {
    const result = await page.request.get(icon.src);
    expect(result.ok()).toBeTruthy();
    expect(result.headers()["content-type"]).toContain("image/png");
  }
  const cdp = await page.context().newCDPSession(page);
  const result = await cdp.send("Page.getInstallabilityErrors");
  expect(result.installabilityErrors).toEqual([]);
  await cdp.detach();
});
