import { expect, test } from "@playwright/test";
import { createSong, saved, readLibrary } from "./helpers";
test("SB-REPERTOIRE-CREATE SB-REPERTOIRE-RENAME SB-REPERTOIRE-DELETE SB-MEMBERSHIP-REMOVE: repertoire deletion preserves independent songs", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "New repertoire", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByLabel("Name", { exact: true })
    .fill("Pintatónica");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Save", exact: true })
    .click();
  await createSong(page, "Synthetic membership song");
  let library = await readLibrary(page);
  expect(library.repertoires[0]!.songIds).toEqual([library.songs[0]!.id]);
  await page
    .getByRole("button", { name: "Rename repertoire Pintatónica" })
    .click();
  await page
    .getByRole("dialog")
    .getByLabel("Name", { exact: true })
    .fill("Combo");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Save", exact: true })
    .click();
  await saved(page);
  expect((await readLibrary(page)).repertoires[0]!.title).toBe("Combo");
  await page
    .getByRole("button", { name: "Remove from repertoire", exact: true })
    .click();
  await saved(page);
  library = await readLibrary(page);
  expect(library.repertoires[0]!.songIds).toEqual([]);
  expect(library.songs).toHaveLength(1);
  page.once("dialog", (d) => d.accept());
  await page
    .getByRole("button", { name: "Delete repertoire", exact: true })
    .click();
  await expect
    .poll(async () => (await readLibrary(page)).repertoires.length)
    .toBe(0);
  await page.getByRole("button", { name: "All songs", exact: false }).click();
  await expect(
    page.getByRole("heading", {
      name: "Synthetic membership song",
      exact: true,
    }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", {
      name: "Synthetic membership song",
      exact: true,
    }),
  ).toBeVisible();
});
