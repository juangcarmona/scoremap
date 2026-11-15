import { expect, test } from "@playwright/test";
import { prepared, readLibrary } from "./helpers";

test("SB-ANNOTATIONS: incremental note typing survives delayed IndexedDB acknowledgements", async ({
  page,
}) => {
  await prepared(page);
  await page
    .getByText("Song details & personal notes", { exact: true })
    .click();
  // Delay actual transaction acknowledgement, without preventing the transaction
  // from completing. This leaves saves queued while the musician keeps typing.
  await page.evaluate(() => {
    const original = IDBTransaction.prototype.addEventListener;
    IDBTransaction.prototype.addEventListener = function (
      this: IDBTransaction,
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: boolean | AddEventListenerOptions,
    ) {
      if (type === "complete" && listener) {
        const delayed: EventListener = (event) => {
          setTimeout(() => {
            if (typeof listener === "function") listener.call(this, event);
            else listener.handleEvent(event);
          }, 250);
        };
        return original.call(this, type, delayed, options);
      }
      return original.call(this, type, listener, options);
    };
  });
  const songText = "Play softly.";
  const sectionText = "Hold the cue.";
  const songNotes = page.getByLabel("Song notes", { exact: true });
  const sectionNotes = page.getByLabel("Notes for Verse", { exact: true });
  await songNotes.pressSequentially(songText, { delay: 5 });
  await expect(songNotes).toHaveValue(songText);
  await sectionNotes.fill("");
  await sectionNotes.pressSequentially(sectionText, { delay: 5 });
  await expect(sectionNotes).toHaveValue(sectionText);
  await expect(songNotes).toHaveValue(songText);
  await expect(page.locator(".save-state")).toHaveText("Saved on this device", {
    timeout: 15_000,
  });
  const stored = await readLibrary(page);
  expect(stored.songs[0]!.notes).toBe(songText);
  expect(stored.songs[0]!.sections[1]!.notes).toBe(sectionText);
  expect(stored.songs[0]!.sections[0]!.notes).toBe("");
  await page.reload();
  await page
    .getByText("Song details & personal notes", { exact: true })
    .click();
  await page.getByText("Edit Verse", { exact: true }).click();
  await expect(page.getByLabel("Song notes", { exact: true })).toHaveValue(
    songText,
  );
  await expect(page.getByLabel("Notes for Verse", { exact: true })).toHaveValue(
    sectionText,
  );
});
