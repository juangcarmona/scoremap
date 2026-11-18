import { expect, type Page } from "@playwright/test";
import type { Library } from "../../src/features/library/domain";
export async function saved(page: Page) {
  await expect(page.locator(".save-state")).toHaveText("Saved on this device");
}
export async function createSong(
  page: Page,
  title = "Synthetic rehearsal sketch",
) {
  await page.getByRole("button", { name: "New song", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Name", { exact: true }).fill(title);
  await dialog.getByRole("button", { name: "Save", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await expect(
    page.getByRole("heading", { name: title, exact: true }),
  ).toBeVisible();
  await saved(page);
}
export async function addSection(page: Page, name: string) {
  await page.getByLabel("New section", { exact: true }).fill(name);
  await page.getByRole("button", { name: "Add section", exact: true }).click();
  await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  await saved(page);
}
export async function chord(
  page: Page,
  section: string,
  root: string,
  quality = "major",
) {
  const details = page
    .locator(".section")
    .filter({ has: page.getByRole("heading", { name: section, exact: true }) });
  const summary = details.getByText(`Edit ${section}`, { exact: true });
  if (!(await details.locator("details.section-edit").getAttribute("open"))) {
    const open = await details
      .locator("details.section-edit")
      .evaluate((e) => (e as HTMLDetailsElement).open);
    if (!open) await summary.click();
  }
  await details
    .getByLabel(`Root for ${section}`, { exact: true })
    .selectOption(root);
  await details
    .getByLabel(`Quality for ${section}`, { exact: true })
    .selectOption(quality);
  await details.getByRole("button", { name: "Add chord", exact: true }).click();
  await saved(page);
}
export async function readLibrary(page: Page): Promise<Library> {
  return page.evaluate(
    () =>
      new Promise((resolve, reject) => {
        const request = indexedDB.open("scoremap", 1);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const db = request.result;
          const get = db
            .transaction("library")
            .objectStore("library")
            .get("current");
          get.onerror = () => {
            db.close();
            reject(get.error);
          };
          get.onsuccess = () => {
            db.close();
            resolve(get.result);
          };
        };
      }),
  );
}
export async function prepared(page: Page) {
  await page.goto("/");
  await createSong(page);
  await addSection(page, "Intro");
  await addSection(page, "Verse");
  await chord(page, "Intro", "C");
  await chord(page, "Verse", "Db", "minor");
  const section = page
    .locator(".section")
    .filter({ has: page.getByRole("heading", { name: "Verse", exact: true }) });
  await section
    .getByLabel("Notes for Verse", { exact: true })
    .fill("Synthetic cue: leave room for the melody");
  await saved(page);
}
