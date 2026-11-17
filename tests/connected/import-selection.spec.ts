import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFile } from "node:fs/promises";
import { api, login } from "./helpers";
import { uniqueRichFixture } from "./rich-fixtures";
import type { Library } from "../../src/features/library/domain";
import type { RichSong } from "../../src/features/library/score";
async function fixture() {
  const library = JSON.parse(
    await readFile("tests/fixtures/library-v2.json", "utf8"),
  ) as Library;
  const template = library.songs[0] as RichSong;
  delete template.migration;
  library.songs = [
    uniqueRichFixture(template).song,
    uniqueRichFixture(template).song,
  ];
  library.revision = 91;
  library.repertoires = [
    {
      id: crypto.randomUUID(),
      title: "Selected synthetic repertoire",
      songIds: library.songs.map((song) => song.id),
    },
  ];
  return library;
}
async function anonymous(page: Page) {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("scoremap", 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    try {
      return await new Promise<Library>((resolve, reject) => {
        const request = db
          .transaction("library", "readonly")
          .objectStore("library")
          .get("current");
        request.onsuccess = () => resolve(request.result as Library);
        request.onerror = () => reject(request.error);
      });
    } finally {
      db.close();
    }
  });
}

test("selected anonymous claim keeps complete source music, previews collisions and resumes an independent copy after a real lost commit response", async ({
  browser,
}) => {
  const owner = await login(browser, "owner-a", {
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const source = await fixture();
  await owner.page.evaluate(async (library) => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("scoremap", 1);
      request.onupgradeneeded = () =>
        request.result.createObjectStore("library");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    try {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction("library", "readwrite");
        tx.objectStore("library").put(library, "current");
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } finally {
      db.close();
    }
  }, source);
  const before = await (await api(owner.page, "/api/library")).json();
  const open = async () => {
    const toggle = owner.page.getByRole("button", {
      name: "Library",
      exact: true,
    });
    if ((await toggle.getAttribute("aria-expanded")) === "false")
      await toggle.click();
    await owner.page
      .getByRole("button", {
        name: "Import songs from this browser",
        exact: true,
      })
      .click();
    return owner.page.getByRole("dialog", {
      name: "Import selected songs",
      exact: true,
    });
  };
  let preview = await open();
  await expect(
    preview.getByText("Songs saved anonymously in this browser", {
      exact: false,
    }),
  ).toBeVisible();
  await preview
    .getByRole("checkbox", { name: source.songs[1]!.title, exact: true })
    .uncheck();
  await preview.getByRole("button", { name: "Cancel", exact: true }).click();
  expect(await (await api(owner.page, "/api/library")).json()).toEqual(before);
  expect(await anonymous(owner.page)).toEqual(source);
  preview = await open();
  await preview
    .getByRole("checkbox", { name: source.songs[1]!.title, exact: true })
    .uncheck();
  expect(
    (await new AxeBuilder({ page: owner.page }).analyze()).violations,
  ).toEqual([]);
  owner.page.once("dialog", (dialog) => dialog.accept());
  await preview
    .getByRole("button", { name: "Import selection", exact: true })
    .click();
  await expect(
    owner.page.getByText(
      "1 selected songs imported and verified from your private library. The original browser library is kept.",
      { exact: true },
    ),
  ).toBeVisible();
  const first = await (await api(owner.page, "/api/library")).json();
  expect(first.library.songs).toEqual([
    ...before.library.songs,
    source.songs[0],
  ]);
  expect(first.library.repertoires).toEqual([
    ...before.library.repertoires,
    { ...source.repertoires[0], songIds: [source.songs[0]!.id] },
  ]);
  expect(first.versions[source.songs[0]!.id]).toBe(1);
  expect(first.versions[source.songs[1]!.id]).toBeUndefined();
  expect(await anonymous(owner.page)).toEqual(source);
  const history = await (
    await api(owner.page, `/api/songs/${source.songs[0]!.id}/history`)
  ).json();
  expect(history[0]).toMatchObject({
    operation: "import",
    baseRevision: 0,
    sourceRevision: 91,
    source: {
      kind: "anonymous",
      schemaVersion: 2,
      revision: 91,
      songCount: 1,
      repertoireCount: 1,
      copied: false,
    },
  });
  const second = await login(browser, "owner-a");
  const reconstructed = await (await api(second.page, "/api/library")).json();
  expect(reconstructed).toEqual(first);
  await second.context.close();

  preview = await open();
  await preview
    .getByRole("checkbox", { name: source.songs[1]!.title, exact: true })
    .uncheck();
  await expect(preview.getByRole("alert")).toContainText(
    "identities already exist",
  );
  await expect(
    preview.getByRole("button", { name: "Import selection", exact: true }),
  ).toBeDisabled();
  await preview
    .getByRole("checkbox", {
      name: "Create independent copies with new identities",
      exact: true,
    })
    .check();
  let committed: Library | null = null;
  await owner.page.route("**/api/library", async (route) => {
    if (route.request().method() !== "PUT" || committed)
      return route.continue();
    const response = await route.fetch();
    expect(response.status()).toBe(200);
    committed = (await response.json()).library as Library;
    await route.abort("failed");
  });
  owner.page.once("dialog", (dialog) => dialog.accept());
  await preview
    .getByRole("button", { name: "Import selection", exact: true })
    .click();
  await expect(owner.page.getByRole("dialog")).toHaveCount(0);
  await expect(owner.page.getByRole("alert")).toBeVisible();
  await owner.page.reload();
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
  const after = await (await api(owner.page, "/api/library")).json();
  expect(after.library).toEqual(committed);
  expect(after.library.revision).toBe(first.library.revision + 1);
  const copied = after.library.songs.filter(
    (song: RichSong) =>
      !first.library.songs.some((prior: RichSong) => prior.id === song.id),
  );
  expect(copied).toHaveLength(1);
  expect(copied[0].title).toBe(source.songs[0]!.title);
  expect(copied[0].arrangements).toHaveLength(2);
  expect(copied[0].arrangements[0].parts).toHaveLength(2);
  expect(
    copied[0].arrangements[0].parts[0].events.map(
      (event: { pitch: unknown }) => event.pitch,
    ),
  ).toEqual(
    (source.songs[0] as RichSong).arrangements[0]!.parts[0]!.events.map(
      (event) => event.pitch,
    ),
  );
  const copyHistory = await (
    await api(owner.page, `/api/songs/${copied[0].id}/history`)
  ).json();
  expect(copyHistory).toHaveLength(1);
  expect(copyHistory[0]).toMatchObject({
    operation: "import",
    sourceRevision: 91,
    source: { copied: true, kind: "anonymous" },
  });
  expect(
    after.library.songs.filter((song: RichSong) => song.id !== copied[0].id),
  ).toEqual(first.library.songs);
  expect(await anonymous(owner.page)).toEqual(source);
  await owner.context.close();
});

test("a saved import whose fresh readback fails is reported separately, keeps its source and refuses a second identity-preserving import", async ({
  browser,
}) => {
  const owner = await login(browser, "owner-a");
  const source = await fixture();
  let acknowledged = false,
    readbackRefused = false;
  await owner.page.route("**/api/library", async (route) => {
    if (route.request().method() === "PUT") {
      const response = await route.fetch();
      expect(response.status()).toBe(200);
      acknowledged = true;
      return route.fulfill({ response });
    }
    if (acknowledged && !readbackRefused) {
      readbackRefused = true;
      return route.fulfill({
        status: 503,
        json: { detail: "Synthetic readback unavailable" },
      });
    }
    return route.continue();
  });
  await owner.page
    .getByLabel("Import backup file", { exact: true })
    .setInputFiles({
      name: "synthetic-selected.json",
      mimeType: "application/json",
      buffer: Buffer.from(
        JSON.stringify({
          format: "scoremap-backup",
          version: 2,
          library: source,
        }),
      ),
    });
  const preview = owner.page.getByRole("dialog", {
    name: "Import selected songs",
    exact: true,
  });
  await preview
    .getByRole("checkbox", { name: source.songs[1]!.title, exact: true })
    .uncheck();
  owner.page.once("dialog", (dialog) => dialog.accept());
  await preview
    .getByRole("button", { name: "Import selection", exact: true })
    .click();
  await expect(owner.page.getByRole("alert")).toContainText("acknowledged");
  expect(readbackRefused).toBe(true);
  const saved = await (await api(owner.page, "/api/library")).json();
  expect(
    saved.library.songs.find(
      (song: RichSong) => song.id === source.songs[0]!.id,
    ),
  ).toEqual(source.songs[0]);
  await owner.page
    .getByLabel("Import backup file", { exact: true })
    .setInputFiles({
      name: "same-synthetic-selected.json",
      mimeType: "application/json",
      buffer: Buffer.from(
        JSON.stringify({
          format: "scoremap-backup",
          version: 2,
          library: source,
        }),
      ),
    });
  await preview
    .getByRole("checkbox", { name: source.songs[1]!.title, exact: true })
    .uncheck();
  await expect(
    preview.getByRole("button", { name: "Import selection", exact: true }),
  ).toBeDisabled();
  await preview.getByRole("button", { name: "Cancel", exact: true }).click();
  expect(await (await api(owner.page, "/api/library")).json()).toEqual(saved);
  await owner.context.close();
});
