import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

test("note-name transfer validates first, confirms replacement, and preserves the saved choice", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByLabel("Note names", { exact: true })
    .selectOption("dual-latin");
  await page.getByText("Back up note names", { exact: true }).click();
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export note names", exact: true })
    .click();
  const saved = JSON.parse(
    await readFile((await (await download).path())!, "utf8"),
  );
  expect(saved).toEqual({
    format: "scoremap-notation-preference",
    version: 1,
    sourceRevision: null,
    preference: { mode: "dual", primary: "latin" },
  });
  await page.getByLabel("Note names", { exact: true }).selectOption("anglo");
  const input = page.getByLabel("Import note names", { exact: true });
  await input.setInputFiles({
    name: "future.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify({ ...saved, version: 2 })),
  });
  await expect(page.getByText(/unsupported format or value/)).toBeVisible();
  expect(
    await page.getByLabel("Note names", { exact: true }).inputValue(),
  ).toBe("anglo");
  page.once("dialog", (dialog) => dialog.dismiss());
  await input.setInputFiles({
    name: "names.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(saved)),
  });
  expect(
    await page.getByLabel("Note names", { exact: true }).inputValue(),
  ).toBe("anglo");
  page.once("dialog", (dialog) => dialog.accept());
  await input.setInputFiles({
    name: "names.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(saved)),
  });
  await expect(page.getByLabel("Note names", { exact: true })).toHaveValue(
    "dual-latin",
  );
  await page.reload();
  await expect(page.getByLabel("Note names", { exact: true })).toHaveValue(
    "dual-latin",
  );
});
