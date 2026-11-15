import fs from "node:fs/promises";
import { expect, test, type Page, type TestInfo } from "@playwright/test";
import type { Library } from "../../src/features/library/domain";
import { prepared, readLibrary, saved } from "./helpers";

async function editSongNotes(page: Page, notes: string) {
  await page
    .getByText("Song details & personal notes", { exact: true })
    .click();
  await page.getByLabel("Song notes", { exact: true }).fill(notes);
}

async function exportDraft(page: Page, testInfo: TestInfo, expected: Library) {
  const downloaded = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export your work", exact: true })
    .click();
  const download = await downloaded;
  expect(download.suggestedFilename()).toBe("scoremap-backup.json");
  const content = await fs.readFile((await download.path())!);
  expect(JSON.parse(content.toString("utf8"))).toEqual({
    format: "scoremap-backup",
    version: 1,
    library: expected,
  });
  await testInfo.attach("unsaved-synthetic-backup", {
    body: content,
    contentType: "application/json",
  });
  await testInfo.attach("unsaved-draft", {
    body: await page.screenshot({ fullPage: true }),
    contentType: "image/png",
  });
}

test("SB-PERSIST-CONFLICT SB-PERSIST-RECOVER: a stale browser tab cannot overwrite an acknowledged revision and can export its draft", async ({
  page,
  context,
}, testInfo) => {
  await prepared(page);
  const initial = await readLibrary(page);
  const stale = await context.newPage();
  await test.step("Both tabs open the same acknowledged library", async () => {
    await stale.goto("/");
    await expect(
      stale.getByRole("heading", {
        name: "Synthetic rehearsal sketch",
        exact: true,
      }),
    ).toBeVisible();
    await saved(stale);
    expect(await readLibrary(stale)).toEqual(initial);
  });

  const winner = structuredClone(initial);
  winner.songs[0]!.notes = "Acknowledged winner cue";
  winner.revision += 1;
  await test.step("The first tab commits a newer complete revision", async () => {
    await editSongNotes(page, winner.songs[0]!.notes);
    await saved(page);
    expect(await readLibrary(page)).toEqual(winner);
  });

  const draft = structuredClone(initial);
  draft.songs[0]!.notes = "Unsaved stale-tab cue";
  await test.step("The stale edit is refused without losing either candidate", async () => {
    await editSongNotes(stale, draft.songs[0]!.notes);
    await expect(stale.getByRole("alert")).toContainText(
      "Another ScoreMap tab saved newer data",
    );
    await expect(stale.locator(".save-state")).toHaveText("Unsaved changes");
    await expect(stale.getByLabel("Song notes", { exact: true })).toHaveValue(
      draft.songs[0]!.notes,
    );
    expect(await readLibrary(stale)).toEqual(winner);
    await exportDraft(stale, testInfo, draft);
    expect(await readLibrary(stale)).toEqual(winner);
  });

  await test.step("Reopening the stale tab recovers the winner, not its refused draft", async () => {
    await stale.reload();
    await saved(stale);
    await stale
      .getByText("Song details & personal notes", { exact: true })
      .click();
    await expect(stale.getByLabel("Song notes", { exact: true })).toHaveValue(
      winner.songs[0]!.notes,
    );
    await expect(stale.getByRole("alert")).toHaveCount(0);
    expect(await readLibrary(stale)).toEqual(winner);
  });
});

test("SB-PERSIST-FAILURE SB-PERSIST-RECOVER: a failed browser write preserves durable data and an exportable draft until explicit retry", async ({
  page,
}, testInfo) => {
  await prepared(page);
  const initial = await readLibrary(page);
  const draft = structuredClone(initial);
  draft.songs[0]!.notes = "Retain this synthetic unsaved cue";

  await test.step("One real IndexedDB write fails at the browser boundary", async () => {
    await page.evaluate(() => {
      const original = IDBObjectStore.prototype.put;
      const observed = window as typeof window & { quotaFaultCount: number };
      observed.quotaFaultCount = 0;
      IDBObjectStore.prototype.put = function (
        value: unknown,
        key?: IDBValidKey,
      ) {
        if (
          this.transaction.db.name === "scoremap" &&
          this.name === "library" &&
          key === "current"
        ) {
          IDBObjectStore.prototype.put = original;
          observed.quotaFaultCount += 1;
          throw new DOMException(
            "Synthetic storage full",
            "QuotaExceededError",
          );
        }
        return original.call(this, value, key);
      };
    });
    await editSongNotes(page, draft.songs[0]!.notes);
    await expect(page.getByRole("alert")).toContainText(
      "Not saved: Synthetic storage full",
    );
    await expect(page.locator(".save-state")).toHaveText("Unsaved changes");
    await expect(page.getByLabel("Song notes", { exact: true })).toHaveValue(
      draft.songs[0]!.notes,
    );
    expect(
      await page.evaluate(
        () =>
          (window as typeof window & { quotaFaultCount: number })
            .quotaFaultCount,
      ),
    ).toBe(1);
    expect(await readLibrary(page)).toEqual(initial);
    await exportDraft(page, testInfo, draft);
    expect(await readLibrary(page)).toEqual(initial);
  });

  const recovered = { ...draft, revision: initial.revision + 1 };
  await test.step("Explicit retry acknowledges exactly the next complete revision", async () => {
    await page.getByRole("button", { name: "Retry save", exact: true }).click();
    await saved(page);
    await expect(
      page.getByRole("button", { name: "Retry save", exact: true }),
    ).toHaveCount(0);
    expect(await readLibrary(page)).toEqual(recovered);
  });

  await test.step("Reload reconstructs the acknowledged retry without data loss", async () => {
    await page.reload();
    await saved(page);
    await page
      .getByText("Song details & personal notes", { exact: true })
      .click();
    await expect(page.getByLabel("Song notes", { exact: true })).toHaveValue(
      recovered.songs[0]!.notes,
    );
    await expect(page.getByRole("alert")).toHaveCount(0);
    expect(await readLibrary(page)).toEqual(recovered);
    await testInfo.attach("recovered-after-retry", {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    });
  });
});
