import { expect, test } from "@playwright/test";
import { prepared, readLibrary, createSong, saved } from "./helpers";

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

test("SB-ANNOTATIONS: identity-keyed drafts survive song switching during queued saves", async ({
  page,
}) => {
  await prepared(page);
  await createSong(page, "Other synthetic song");
  await page
    .getByRole("button", { name: "Synthetic rehearsal sketch", exact: true })
    .click();
  await page
    .getByText("Song details & personal notes", { exact: true })
    .click();
  await page.getByText("Edit Verse", { exact: true }).click();
  await page.evaluate(() => {
    const original = IDBTransaction.prototype.addEventListener;
    let holding = true;
    const acknowledgements: (() => void)[] = [];
    Object.defineProperty(window, "releaseNoteSaves", {
      value: () => {
        holding = false;
        acknowledgements.splice(0).forEach((ack) => ack());
      },
    });
    IDBTransaction.prototype.addEventListener = function (
      this: IDBTransaction,
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: boolean | AddEventListenerOptions,
    ) {
      if (type === "complete") {
        return original.call(
          this,
          type,
          (event: Event) => {
            const acknowledge = () => {
              if (typeof listener === "function") listener.call(this, event);
              else listener.handleEvent(event);
            };
            if (holding) acknowledgements.push(acknowledge);
            else acknowledge();
          },
          options,
        );
      }
      return original.call(this, type, listener, options);
    };
  });
  await page
    .getByLabel("Song notes", { exact: true })
    .pressSequentially("ab", { delay: 10 });
  await page.getByLabel("Notes for Verse", { exact: true }).fill("");
  await page
    .getByLabel("Notes for Verse", { exact: true })
    .pressSequentially("xy", { delay: 10 });
  await expect(page.locator(".save-state")).toHaveText(
    "Saving on this device…",
  );
  await page
    .getByRole("button", { name: "Other synthetic song", exact: true })
    .click();
  await page
    .getByText("Song details & personal notes", { exact: true })
    .click();
  await expect(page.getByLabel("Song notes", { exact: true })).toHaveValue("");
  await page
    .getByRole("button", { name: "Synthetic rehearsal sketch", exact: true })
    .click();
  await page
    .getByText("Song details & personal notes", { exact: true })
    .click();
  await page.getByText("Edit Verse", { exact: true }).click();
  await expect(page.getByLabel("Song notes", { exact: true })).toHaveValue(
    "ab",
  );
  await expect(page.getByLabel("Notes for Verse", { exact: true })).toHaveValue(
    "xy",
  );
  await page.evaluate(() =>
    (window as unknown as { releaseNoteSaves: () => void }).releaseNoteSaves(),
  );
  await saved(page);
  await expect(page.getByLabel("Song notes", { exact: true })).toHaveValue(
    "ab",
  );
  await expect(page.getByLabel("Notes for Verse", { exact: true })).toHaveValue(
    "xy",
  );
  await page.getByLabel("Song notes", { exact: true }).press("End");
  await page.getByLabel("Song notes", { exact: true }).pressSequentially("c");
  await page.getByLabel("Notes for Verse", { exact: true }).press("End");
  await page
    .getByLabel("Notes for Verse", { exact: true })
    .pressSequentially("z");
  await saved(page);
  const library = await readLibrary(page);
  expect(library.songs[0]!.notes).toBe("abc");
  expect(library.songs[0]!.sections[1]!.notes).toBe("xyz");
  expect(library.songs[1]!.notes).toBe("");
  await page.reload();
  await page
    .getByText("Song details & personal notes", { exact: true })
    .click();
  await page.getByText("Edit Verse", { exact: true }).click();
  await expect(page.getByLabel("Song notes", { exact: true })).toHaveValue(
    "abc",
  );
  await expect(page.getByLabel("Notes for Verse", { exact: true })).toHaveValue(
    "xyz",
  );
});
