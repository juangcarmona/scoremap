import { test, expect, type Browser, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import {
  api,
  login,
  openSong,
  saveView,
  signIn,
  syntheticSong,
} from "./helpers";
import { uniqueRichFixture } from "./rich-fixtures";
import type { Library } from "../../src/features/library/domain";
import type { RichSong } from "../../src/features/library/score";
async function prepare(page: Page) {
  const library = JSON.parse(
    await readFile("tests/fixtures/library-v2.json", "utf8"),
  ) as Library;
  const source = library.songs[0] as RichSong;
  delete source.migration;
  const { song } = uniqueRichFixture(source);
  await saveView(page, (library) => {
    library.schemaVersion = 2;
    library.songs.push(song);
  });
  await page.reload();
  await openSong(page, song.title);
  await page
    .getByText("Song details & personal notes", { exact: true })
    .click();
  return song;
}
async function pendingNotes(page: Page, songId: string) {
  const recovery = page.getByRole("region", {
    name: "Protected pending work",
    exact: true,
  });
  const downloaded = page.waitForEvent("download");
  await recovery
    .getByRole("button", {
      name: "Export pending work to compare",
      exact: true,
    })
    .click();
  const value = JSON.parse(
    await readFile((await (await downloaded).path())!, "utf8"),
  ) as { library: Library };
  return value.library.songs.find((song) => song.id === songId)!;
}
function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

test("rapid typing is encrypted before an older real service acknowledgement and survives reload without replaying the latest draft", async ({
  browser,
}) => {
  const owner = await login(browser, "owner-a");
  const song = await prepare(owner.page);
  const committed = deferred(),
    release = deferred();
  let writes = 0;
  await owner.page.route("**/api/library", async (route) => {
    if (route.request().method() !== "PUT") return route.continue();
    writes++;
    if (writes !== 1) return route.continue();
    const response = await route.fetch();
    expect(response.status()).toBe(200);
    committed.resolve();
    await release.promise;
    await route.fulfill({ response }).catch(() => undefined);
  });
  const notes = owner.page.getByLabel("Song notes", { exact: true });
  await notes.fill("First acknowledged only by the service");
  await committed.promise;
  await notes.fill("");
  await notes.pressSequentially("Latest typed before reload", { delay: 4 });
  await expect(notes).toHaveValue("Latest typed before reload");
  await expect(
    owner.page
      .getByRole("status")
      .filter({ hasText: "Your latest changes are protected on this device." }),
  ).toBeVisible();
  expect(writes).toBe(1);
  const actual = await (await api(owner.page, "/api/library")).json();
  expect(
    actual.library.songs.find((candidate: RichSong) => candidate.id === song.id)
      .notes,
  ).toBe("First acknowledged only by the service");
  expect(actual.versions[song.id]).toBe(2);
  await owner.page.reload();
  const recovered = await pendingNotes(owner.page, song.id);
  expect(recovered).toEqual({ ...song, notes: "Latest typed before reload" });
  expect(await (await api(owner.page, "/api/library")).json()).toEqual(actual);
  release.resolve();
  await owner.context.close();
});

test("two private tabs retain independently recoverable encrypted drafts without clobbering one another or changing acknowledged music", async ({
  browser,
}) => {
  const owner = await login(browser, "owner-a");
  const song = await prepare(owner.page);
  const second = await owner.context.newPage();
  await second.goto("/");
  await openSong(second, song.title);
  await second
    .getByText("Song details & personal notes", { exact: true })
    .click();
  const before = await (await api(owner.page, "/api/library")).json();
  for (const page of [owner.page, second])
    await page.route("**/api/library", (route) =>
      route.request().method() === "PUT"
        ? route.abort("failed")
        : route.continue(),
    );
  await owner.page
    .getByLabel("Song notes", { exact: true })
    .fill("Draft from first private tab");
  await expect(owner.page.locator(".save-state")).toHaveText("Unsaved changes");
  await second
    .getByLabel("Song notes", { exact: true })
    .fill("Draft from second private tab");
  await expect(second.locator(".save-state")).toHaveText("Unsaved changes");
  expect(await (await api(owner.page, "/api/library")).json()).toEqual(before);
  await owner.page.close();
  await second.close();
  const reopened = await owner.context.newPage();
  await reopened.goto("/");
  const recovery = reopened.getByRole("region", {
    name: "Protected pending work",
    exact: true,
  });
  const choices = recovery.getByLabel("Pending draft", { exact: true });
  await expect(choices.locator("option")).toHaveCount(2);
  const values = await choices
    .locator("option")
    .evaluateAll((options) =>
      options.map((option) => (option as HTMLOptionElement).value),
    );
  const retained = [];
  for (const value of values) {
    await choices.selectOption(value);
    retained.push((await pendingNotes(reopened, song.id)).notes);
  }
  expect(retained.sort()).toEqual([
    "Draft from first private tab",
    "Draft from second private tab",
  ]);
  expect(await (await api(reopened, "/api/library")).json()).toEqual(before);
  await owner.context.close();
});

test("voluntary real logout waits for local protection rather than a held commit response and the exact receipt remains recoverable", async ({
  browser,
}) => {
  const owner = await login(browser, "owner-a");
  const song = await prepare(owner.page);
  const committed = deferred(),
    release = deferred();
  await owner.page.route("**/api/library", async (route) => {
    if (route.request().method() !== "PUT") return route.continue();
    const response = await route.fetch();
    expect(response.status()).toBe(200);
    committed.resolve();
    await release.promise;
    await route.fulfill({ response }).catch(() => undefined);
  });
  await owner.page
    .getByLabel("Song notes", { exact: true })
    .fill("Protected before voluntary termination");
  await committed.promise;
  owner.page.once("dialog", (dialog) => dialog.accept());
  await owner.page
    .getByRole("button", { name: "Sign out", exact: true })
    .click();
  await expect(
    owner.page.getByRole("link", { name: "Sign in", exact: true }),
  ).toBeVisible({ timeout: 5000 });
  release.resolve();
  await owner.page.unroute("**/api/library");
  await signIn(owner.page, "owner-a");
  const current = await (await api(owner.page, "/api/library")).json();
  expect((await pendingNotes(owner.page, song.id)).notes).toBe(
    "Protected before voluntary termination",
  );
  const recovery = owner.page.getByRole("region", {
    name: "Protected pending work",
    exact: true,
  });
  await recovery
    .getByRole("button", { name: "Review pending work", exact: true })
    .click();
  await recovery
    .getByRole("button", { name: "Retry original save", exact: true })
    .click();
  await expect(recovery).toHaveCount(0);
  expect(await (await api(owner.page, "/api/library")).json()).toEqual(current);
  const history = await (
    await api(owner.page, `/api/songs/${song.id}/history`)
  ).json();
  expect(
    history.map((version: { revision: number }) => version.revision),
  ).toEqual([2, 1]);
  await owner.context.close();
});

test("the previous principal-keyed protected record remains recoverable after upgrading to editing-context records", async ({
  browser,
}) => {
  const owner = await login(browser, "owner-a");
  const song = await prepare(owner.page);
  const identity = await (await owner.page.request.get("/auth/session")).json();
  await owner.page.route("**/api/library", (route) =>
    route.request().method() === "PUT"
      ? route.abort("failed")
      : route.continue(),
  );
  await owner.page
    .getByLabel("Song notes", { exact: true })
    .fill("Legacy protected record retained unchanged");
  await expect(owner.page.locator(".save-state")).toHaveText("Unsaved changes");
  await owner.page.evaluate(async (principal: string) => {
    const request = indexedDB.open("scoremap-protected-pending", 1);
    const db = await new Promise<IDBDatabase>((resolve) => {
      request.onsuccess = () => resolve(request.result);
    });
    const tx = db.transaction("pending", "readwrite");
    const read = tx.objectStore("pending").openCursor();
    await new Promise<void>((resolve, reject) => {
      read.onerror = () => reject(read.error);
      read.onsuccess = () => {
        const cursor = read.result!;
        const legacy = cursor.value;
        delete legacy.formatVersion;
        delete legacy.generation;
        cursor.delete();
        tx.objectStore("pending").put(legacy, principal);
        resolve();
      };
    });
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  }, identity.principal);
  await owner.page.unroute("**/api/library");
  await owner.page.reload();
  expect((await pendingNotes(owner.page, song.id)).notes).toBe(
    "Legacy protected record retained unchanged",
  );
  const recovery = owner.page.getByRole("region", {
    name: "Protected pending work",
    exact: true,
  });
  await recovery
    .getByRole("button", { name: "Review pending work", exact: true })
    .click();
  await recovery
    .getByRole("button", { name: "Retry original save", exact: true })
    .click();
  await expect(recovery).toHaveCount(0);
  expect(
    (await (await api(owner.page, "/api/library")).json()).library.songs.find(
      (candidate: RichSong) => candidate.id === song.id,
    ).notes,
  ).toBe("Legacy protected record retained unchanged");
  await owner.context.close();
});

test("a real pending-store quota refusal sends no save, claims no local protection and can be explicitly retried once storage works", async ({
  browser,
}) => {
  const owner = await login(browser, "owner-a");
  const song = await prepare(owner.page);
  const before = await (await api(owner.page, "/api/library")).json();
  let writes = 0;
  owner.page.on("request", (request) => {
    if (request.url().endsWith("/api/library") && request.method() === "PUT")
      writes++;
  });
  await owner.page.evaluate(() => {
    const original = IDBObjectStore.prototype.put;
    (window as unknown as { restorePendingPut: () => void }).restorePendingPut =
      () => {
        IDBObjectStore.prototype.put = original;
      };
    IDBObjectStore.prototype.put = function (
      value: unknown,
      key?: IDBValidKey,
    ) {
      if (this.transaction.db.name === "scoremap-protected-pending")
        throw new DOMException(
          "Synthetic protected-store quota",
          "QuotaExceededError",
        );
      return original.call(this, value, key);
    };
  });
  await owner.page
    .getByLabel("Song notes", { exact: true })
    .fill("Draft survives explicit quota retry");
  await expect(owner.page.getByRole("alert")).toContainText(
    "Synthetic protected-store quota",
  );
  expect(writes).toBe(0);
  await expect(
    owner.page
      .getByRole("status")
      .filter({ hasText: "Your latest changes are protected on this device." }),
  ).toHaveCount(0);
  expect(await (await api(owner.page, "/api/library")).json()).toEqual(before);
  await owner.page.evaluate(() =>
    (
      window as unknown as { restorePendingPut: () => void }
    ).restorePendingPut(),
  );
  await owner.page
    .getByRole("button", { name: "Retry save", exact: true })
    .click();
  await expect(owner.page.locator(".save-state")).toHaveText(
    "Saved to your private library",
  );
  expect(writes).toBe(1);
  const after = await (await api(owner.page, "/api/library")).json();
  expect(after.versions[song.id]).toBe(before.versions[song.id] + 1);
  expect(
    after.library.songs.find((candidate: RichSong) => candidate.id === song.id),
  ).toEqual({ ...song, notes: "Draft survives explicit quota retry" });
  await owner.context.close();
});

test("an unconfirmed JSON import remains visible for immediate original-command recovery without replacing the current library", async ({
  browser,
}) => {
  const owner = await login(browser, "owner-a");
  await prepare(owner.page);
  const before = await (await api(owner.page, "/api/library")).json();
  const source = syntheticSong();
  let refused = false;
  await owner.page.route("**/api/library", async (route) => {
    if (route.request().method() === "PUT" && !refused) {
      refused = true;
      return route.fulfill({
        status: 503,
        json: { detail: "Synthetic import could not be confirmed" },
      });
    }
    await route.continue();
  });
  owner.page.once("dialog", (dialog) => dialog.accept());
  await owner.page
    .getByLabel("Import backup file", { exact: true })
    .setInputFiles({
      name: "retained-import.json",
      mimeType: "application/json",
      buffer: Buffer.from(
        JSON.stringify({
          format: "scoremap-backup",
          version: 1,
          library: {
            schemaVersion: 1,
            revision: 73,
            songs: [source],
            repertoires: [],
          },
        }),
      ),
    });
  await owner.page
    .getByRole("dialog", { name: "Import selected songs", exact: true })
    .getByRole("button", { name: "Import selection", exact: true })
    .click();
  await expect(owner.page.getByRole("alert")).toContainText(
    "Synthetic import could not be confirmed",
  );
  await expect(owner.page.locator(".save-state")).toHaveText(
    "Pending save needs review",
  );
  await expect(
    owner.page.getByRole("button", { name: "New song", exact: true }),
  ).toHaveCount(0);
  expect(await (await api(owner.page, "/api/library")).json()).toEqual(before);
  const recovery = owner.page.getByRole("region", {
    name: "Protected pending work",
    exact: true,
  });
  await recovery
    .getByRole("button", { name: "Review pending work", exact: true })
    .click();
  await expect(recovery.getByText(source.title, { exact: true })).toBeVisible();
  await recovery
    .getByRole("button", { name: "Retry original save", exact: true })
    .click();
  await expect(recovery).toHaveCount(0);
  await expect(owner.page.getByRole("alert")).toHaveCount(0);
  const saved = await (await api(owner.page, "/api/library")).json();
  expect(
    saved.library.songs.filter((song: RichSong) => song.id !== source.id),
  ).toEqual(before.library.songs);
  expect(saved.library.repertoires).toEqual(before.library.repertoires);
  const imported = saved.library.songs.find(
    (song: RichSong) => song.id === source.id,
  ) as RichSong;
  expect(imported.title).toBe(source.title);
  expect(imported.notes).toBe(source.notes);
  expect(imported.migration?.sourceVersion).toBe(1);
  expect(saved.versions[source.id]).toBe(1);
  const history = await (
    await api(owner.page, `/api/songs/${source.id}/history`)
  ).json();
  expect(
    history.map((version: { revision: number }) => version.revision),
  ).toEqual([1, 0]);
  expect(history[1].content).toEqual(source);
  expect(history[0]).toMatchObject({
    sourceRevision: 73,
    source: {
      kind: "backup",
      schemaVersion: 1,
      revision: 73,
      songCount: 1,
      repertoireCount: 0,
      copied: false,
    },
    operation: "import",
  });
  expect(history[1]).toMatchObject({
    actor: null,
    operation: "legacy-source",
    baseRevision: null,
    sourceRevision: null,
    source: null,
  });
  await owner.context.close();
});

test("a performed-note save held after the real commit survives song and mode changes", async ({
  browser,
}) => {
  const owner = await login(browser, "owner-a");
  const song = await prepare(owner.page);
  const other = syntheticSong();
  await saveView(owner.page, (library) => {
    library.songs.push(other);
  });
  await owner.page.reload();
  await openSong(owner.page, song.title);
  await owner.page
    .getByLabel("Active performed part", { exact: true })
    .selectOption(song.arrangements[0]!.parts[1]!.id);
  const builder = owner.page.getByRole("region", {
    name: "Played-note builder for Right",
    exact: true,
  });
  const before = await (await api(owner.page, "/api/library")).json();
  const committed = deferred(),
    release = deferred();
  await owner.page.route("**/api/library", async (route) => {
    if (route.request().method() !== "PUT") return route.continue();
    const response = await route.fetch();
    expect(response.status()).toBe(200);
    committed.resolve();
    await release.promise;
    await route.fulfill({ response }).catch(() => undefined);
  });
  try {
    await builder
      .getByRole("button", { name: "Raise B4 one octave", exact: true })
      .click();
    await builder
      .getByRole("button", { name: "Apply played notes", exact: true })
      .click();
    await committed.promise;
    const actual = await (await api(owner.page, "/api/library")).json();
    const expected = structuredClone(song);
    expected.arrangements[0]!.parts[1]!.events[1]!.pitch = {
      spelling: "B",
      octave: 5,
      midi: 83,
    };
    expect(
      actual.library.songs.find((entry: RichSong) => entry.id === song.id),
    ).toEqual(expected);
    expect(actual.versions[song.id]).toBe(before.versions[song.id] + 1);
    owner.page.once("dialog", (dialog) => dialog.accept());
    await openSong(owner.page, other.title);
    await expect(
      owner.page.getByRole("heading", { name: other.title, exact: true }),
    ).toBeVisible();
    await owner.page
      .getByRole("button", { name: "Enter performance", exact: true })
      .click();
    release.resolve();
    await expect(
      owner.page.getByRole("button", { name: "Switch to edit", exact: true }),
    ).toBeVisible();
    await openSong(owner.page, song.title);
    await expect(
      owner.page.getByRole("heading", { name: song.title, exact: true }),
    ).toBeVisible();
    const final = await (await api(owner.page, "/api/library")).json();
    expect(
      final.library.songs.find((entry: RichSong) => entry.id === song.id),
    ).toEqual(expected);
    expect(
      final.library.songs.find((entry: RichSong) => entry.id === other.id),
    ).toEqual(
      actual.library.songs.find((entry: RichSong) => entry.id === other.id),
    );
    expect(final.versions[song.id]).toBe(actual.versions[song.id]);
    const history = await (
      await api(owner.page, `/api/songs/${song.id}/history`)
    ).json();
    expect(history[0].content).toEqual(expected);
    expect(history).toHaveLength(2);
  } finally {
    release.resolve();
    await owner.context.close();
  }
});

async function withHeldPiano(
  browser: Browser,
  run: (
    page: Page,
    release: () => void,
    song: RichSong,
    expected: RichSong,
  ) => Promise<void>,
) {
  const owner = await login(browser, "owner-a");
  const song = await prepare(owner.page);
  await owner.page
    .getByLabel("Active performed part", { exact: true })
    .selectOption(song.arrangements[0]!.parts[1]!.id);
  const builder = owner.page.getByRole("region", {
    name: "Played-note builder for Right",
    exact: true,
  });
  const committed = deferred(),
    release = deferred();
  const expected = structuredClone(song);
  expected.arrangements[0]!.parts[1]!.events[1]!.pitch = {
    spelling: "B",
    octave: 5,
    midi: 83,
  };
  await owner.page.route("**/api/library", async (route) => {
    if (route.request().method() !== "PUT") return route.continue();
    const response = await route.fetch();
    expect(response.status()).toBe(200);
    committed.resolve();
    await release.promise;
    await route.fulfill({ response }).catch(() => undefined);
  });
  try {
    await builder
      .getByRole("button", { name: "Raise B4 one octave", exact: true })
      .click();
    await builder
      .getByRole("button", { name: "Apply played notes", exact: true })
      .click();
    await committed.promise;
    await run(owner.page, release.resolve, song, expected);
  } finally {
    release.resolve();
    await owner.context.close();
  }
}

test("an import waits for a held performed-note acknowledgement and preserves both songs", async ({
  browser,
}) => {
  await withHeldPiano(browser, async (page, release, song, expected) => {
    const imported = syntheticSong();
    await page.getByLabel("Import backup file", { exact: true }).setInputFiles({
      name: "synthetic-held-import.json",
      mimeType: "application/json",
      buffer: Buffer.from(
        JSON.stringify({
          format: "scoremap-backup",
          version: 1,
          library: {
            schemaVersion: 1,
            revision: 0,
            songs: [imported],
            repertoires: [],
          },
        }),
      ),
    });
    const dialog = page.getByRole("dialog", {
      name: "Import selected songs",
      exact: true,
    });
    await expect(dialog).toHaveCount(0);
    expect(
      (await (await api(page, "/api/library")).json()).library.songs.find(
        (entry: RichSong) => entry.id === song.id,
      ),
    ).toEqual(expected);
    release();
    await expect(dialog).toBeVisible();
    page.once("dialog", (confirmation) => confirmation.accept());
    await dialog
      .getByRole("button", { name: "Import selection", exact: true })
      .click();
    await expect(dialog).toHaveCount(0);
    const after = await (await api(page, "/api/library")).json();
    expect(
      after.library.songs.find((entry: RichSong) => entry.id === song.id),
    ).toEqual(expected);
    expect(
      after.library.songs.find((entry: RichSong) => entry.id === imported.id)
        ?.title,
    ).toBe(imported.title);
    expect(
      await (await api(page, `/api/songs/${song.id}/history`)).json(),
    ).toHaveLength(2);
  });
});

test("a real waiting service worker defers activation until the performed-note acknowledgement", async ({
  browser,
}) => {
  await withHeldPiano(browser, async (page, release, song, expected) => {
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.waitForFunction(() =>
      Boolean(navigator.serviceWorker.controller),
    );
    await page.evaluate(() =>
      navigator.serviceWorker.register("/sw.js?synthetic-waiting-worker=1", {
        scope: "/",
      }),
    );
    const update = page.getByRole("button", {
      name: "Apply available update",
      exact: true,
    });
    await expect(update).toBeVisible();
    await update.click();
    await expect(page.locator(".app")).toHaveAttribute("inert", "");
    await expect(
      page.getByRole("status").filter({ hasText: "Applying update" }),
    ).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(async () =>
          Boolean((await navigator.serviceWorker.getRegistration())?.waiting),
        ),
      )
      .toBe(true);
    expect(
      (await (await api(page, "/api/library")).json()).library.songs.find(
        (entry: RichSong) => entry.id === song.id,
      ),
    ).toEqual(expected);
    release();
    await expect(update).toHaveCount(0);
    await expect(page.getByText("owner-a · Private library")).toBeVisible();
    const after = await (await api(page, "/api/library")).json();
    expect(
      after.library.songs.find((entry: RichSong) => entry.id === song.id),
    ).toEqual(expected);
    expect(
      await (await api(page, `/api/songs/${song.id}/history`)).json(),
    ).toHaveLength(2);
  });
});

test("a failed performed-note save keeps a waiting update blocked and durable music intact", async ({
  browser,
}) => {
  const owner = await login(browser, "owner-a");
  try {
    const page = owner.page;
    const song = await prepare(page);
    await page
      .getByLabel("Active performed part", { exact: true })
      .selectOption(song.arrangements[0]!.parts[1]!.id);
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.waitForFunction(() =>
      Boolean(navigator.serviceWorker.controller),
    );
    await page.evaluate(() =>
      navigator.serviceWorker.register("/sw.js?synthetic-failed-save=1", {
        scope: "/",
      }),
    );
    const update = page.getByRole("button", {
      name: "Apply available update",
      exact: true,
    });
    await expect(update).toBeVisible();
    await page.route("**/api/library", (route) =>
      route.request().method() === "PUT"
        ? route.abort("failed")
        : route.continue(),
    );
    const builder = page.getByRole("region", {
      name: "Played-note builder for Right",
      exact: true,
    });
    await builder
      .getByRole("button", { name: "Raise B4 one octave", exact: true })
      .click();
    await builder
      .getByRole("button", { name: "Apply played notes", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Retry save", exact: true }),
    ).toBeVisible();
    await update.click();
    await expect(
      page.getByRole("button", { name: "Retry save", exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(async () =>
        Boolean((await navigator.serviceWorker.getRegistration())?.waiting),
      ),
    ).toBe(true);
    const actual = await (await api(page, "/api/library")).json();
    expect(
      actual.library.songs.find((entry: RichSong) => entry.id === song.id),
    ).toEqual(song);
  } finally {
    await owner.context.close();
  }
});

test("a waiting update preserves a notation change until its acknowledgement", async ({
  browser,
}) => {
  const owner = await login(browser, "owner-a");
  const page = owner.page;
  const committed = deferred(),
    release = deferred();
  try {
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.waitForFunction(() =>
      Boolean(navigator.serviceWorker.controller),
    );
    await page.evaluate(() =>
      navigator.serviceWorker.register("/sw.js?synthetic-notation-wait=1", {
        scope: "/",
      }),
    );
    const update = page.getByRole("button", {
      name: "Apply available update",
      exact: true,
    });
    await expect(update).toBeVisible();
    await page.route("**/api/preferences/notation", async (route) => {
      if (route.request().method() !== "PUT") return route.continue();
      const response = await route.fetch();
      expect(response.status()).toBe(200);
      committed.resolve();
      await release.promise;
      await route.fulfill({ response }).catch(() => undefined);
    });
    await page.getByLabel("Note names", { exact: true }).selectOption("latin");
    await committed.promise;
    await update.click();
    await expect(page.locator(".app")).toHaveAttribute("inert", "");
    expect(
      await page.evaluate(async () =>
        Boolean((await navigator.serviceWorker.getRegistration())?.waiting),
      ),
    ).toBe(true);
    release.resolve();
    await expect(update).toHaveCount(0);
    await expect(page.getByLabel("Note names", { exact: true })).toHaveValue(
      "latin",
    );
    expect(
      (await (await api(page, "/api/preferences/notation")).json()).mode,
    ).toBe("latin");
  } finally {
    release.resolve();
    await owner.context.close();
  }
});
