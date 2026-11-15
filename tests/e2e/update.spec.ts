import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { staticServer } from "../support/static-server";
import { createSong, saved, readLibrary } from "./helpers";
test("SB-OFFLINE SB-PERSIST-RECOVER: two production revisions wait for deliberate activation and preserve data offline", async ({
  page,
  context,
}) => {
  test.setTimeout(120000);
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), "scoremap-update-"));
  const a = path.join(temp, "a"),
    b = path.join(temp, "b");
  let server: Awaited<ReturnType<typeof staticServer>> | undefined;
  try {
    for (const [revision, outDir] of [
      ["A", a],
      ["B", b],
    ])
      execFileSync(
        process.execPath,
        ["node_modules/vite/bin/vite.js", "build", "--outDir", outDir!],
        {
          cwd: process.cwd(),
          env: { ...process.env, VITE_SCOREMAP_BUILD: revision! },
          stdio: "pipe",
          timeout: 60000,
        },
      );
    server = await staticServer(a);
    await page.goto(server.url);
    await createSong(page, "Synthetic update retention");
    await saved(page);
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.waitForFunction(() =>
      Boolean(navigator.serviceWorker.controller),
    );
    const before = await readLibrary(page);
    await page
      .getByRole("button", { name: "Enter performance", exact: true })
      .click();
    expect(await page.locator(".app").getAttribute("data-build-revision")).toBe(
      "A",
    );
    server.setRoot(b);
    await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      await registration!.update();
    });
    await expect(
      page.getByRole("button", { name: "Apply available update", exact: true }),
    ).toBeVisible({ timeout: 30000 });
    expect(await page.locator(".app").getAttribute("data-build-revision")).toBe(
      "A",
    );
    await expect(
      page.getByText("PERFORMANCE · READ ONLY", { exact: true }),
    ).toBeVisible();
    expect(await readLibrary(page)).toEqual(before);
    await page
      .getByRole("button", { name: "Apply available update", exact: true })
      .click();
    await expect(page.locator(".app")).toHaveAttribute(
      "data-build-revision",
      "B",
      { timeout: 30000 },
    );
    expect(await readLibrary(page)).toEqual(before);
    await context.setOffline(true);
    await page.reload();
    await expect(
      page.getByRole("heading", {
        name: "Synthetic update retention",
        exact: true,
      }),
    ).toBeVisible();
    expect(await readLibrary(page)).toEqual(before);
    await context.setOffline(false);
  } finally {
    await server?.close();
    await fs.rm(temp, { recursive: true, force: true });
  }
});
