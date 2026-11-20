import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { api, login } from "./helpers";

test("private note-name transfer uses an independently acknowledged preference", async ({
  browser,
}) => {
  const owner = await login(browser, "owner-a");
  try {
    const page = owner.page;
    const names = page.getByLabel("Note names", { exact: true });
    await names.selectOption("dual-latin");
    await expect(
      page.getByText("Note names saved to your account", { exact: true }),
    ).toBeVisible();
    const original = await (
      await api(page, "/api/preferences/notation")
    ).json();
    await page.getByText("Back up note names", { exact: true }).click();
    const downloading = page.waitForEvent("download");
    await page
      .getByRole("button", { name: "Export note names", exact: true })
      .click();
    const contents = await readFile(
      (await (await downloading).path())!,
      "utf8",
    );
    const file = JSON.parse(contents);
    expect(file).toEqual({
      format: "scoremap-notation-preference",
      version: 1,
      sourceRevision: original.revision,
      preference: { mode: "dual", primary: "latin" },
    });
    await names.selectOption("anglo");
    await expect(
      page.getByText("Note names saved to your account", { exact: true }),
    ).toBeVisible();
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByLabel("Import note names", { exact: true }).setInputFiles({
      name: "notes.json",
      mimeType: "application/json",
      buffer: Buffer.from(contents),
    });
    await expect(names).toHaveValue("dual-latin");
    await expect(
      page.getByText("Note names saved to your account", { exact: true }),
    ).toBeVisible();
    const restored = await (
      await api(page, "/api/preferences/notation")
    ).json();
    expect(restored).toMatchObject({ mode: "dual", primary: "latin" });
    expect(restored.revision).toBeGreaterThan(original.revision);
    await page.reload();
    await expect(names).toHaveValue("dual-latin");
    await page.route("**/api/preferences/notation", (route) =>
      route.request().method() === "PUT"
        ? route.abort("failed")
        : route.continue(),
    );
    await page.getByText("Back up note names", { exact: true }).click();
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByLabel("Import note names", { exact: true }).setInputFiles({
      name: "failed-save.json",
      mimeType: "application/json",
      buffer: Buffer.from(
        JSON.stringify({
          ...file,
          preference: { mode: "anglo", primary: "anglo" },
        }),
      ),
    });
    await expect(
      page.getByText("Note-name choice not saved", { exact: true }),
    ).toBeVisible();
    expect(await (await api(page, "/api/preferences/notation")).json()).toEqual(
      restored,
    );
  } finally {
    await owner.context.close();
  }
});
