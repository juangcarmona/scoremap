import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { api, login, openSong, saveView, signIn } from "./helpers";
import { uniqueRichFixture } from "./rich-fixtures";
import type { Library } from "../../src/features/library/domain";
import type { RichSong } from "../../src/features/library/score";
async function songFixture(page: Page) {
  const source = JSON.parse(
    await readFile("tests/fixtures/library-v2.json", "utf8"),
  ) as Library;
  const original = source.songs[0] as RichSong;
  delete original.migration;
  const { song } = uniqueRichFixture(original);
  const notation = await (await api(page, "/api/preferences/notation")).json();
  if (notation.mode !== "anglo")
    expect(
      (
        await api(page, "/api/preferences/notation", "PUT", {
          mode: "anglo",
          primary: "anglo",
          expectedRevision: notation.revision,
          commandId: crypto.randomUUID(),
        })
      ).status(),
    ).toBe(200);
  await saveView(page, (library) => {
    library.schemaVersion = 2;
    library.songs.push(song);
  });
  await page.reload();
  await openSong(page, song.title);
  return song;
}
async function prepare(page: Page) {
  const panel = page.getByRole("region", {
    name: "Private offline preparation",
  });
  const issued = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === "/api/offline-lease" &&
      response.request().method() === "POST",
  );
  await panel
    .getByRole("button", { name: "Prepare private offline copy", exact: true })
    .click();
  const response = await issued;
  expect(response.status()).toBe(200);
  const envelope = await response.json();
  const info = {
    id: envelope.id,
    checkedAt: envelope.checkedAt,
    expiresAt: envelope.expiresAt,
    configuredMinutes: envelope.configuredMinutes,
    songIds: Object.keys(envelope.scope.songs),
  };
  await expect(panel.getByRole("status")).toContainText(
    "Offline copy protected and ready.",
  );
  expect(info.configuredMinutes).toBe(1);
  expect(
    Date.parse(info.expiresAt) - Date.parse(info.checkedAt),
  ).toBeLessThanOrEqual(60000);
  return info;
}
async function protectedRows(page: Page, database: string, store: string) {
  return page.evaluate(
    async ({ database, store }) => {
      const open = indexedDB.open(database, 1);
      open.onupgradeneeded = () => {
        open.result.createObjectStore(store);
      };
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        open.onsuccess = () => resolve(open.result);
        open.onerror = () => reject(open.error);
      });
      const request = db.transaction(store).objectStore(store).getAll();
      const rows = await new Promise<Record<string, unknown>[]>(
        (resolve, reject) => {
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        },
      );
      db.close();
      return Promise.all(
        rows.map(async (row) => {
          const value =
            row.cipher instanceof ArrayBuffer
              ? row.cipher
              : (
                  row.frames as
                    Record<string, { cipher: ArrayBuffer }> | undefined
                )?.songs?.cipher;
          const digest = value
            ? Array.from(
                new Uint8Array(await crypto.subtle.digest("SHA-256", value)),
                (byte) => byte.toString(16).padStart(2, "0"),
              ).join("")
            : "";
          return {
            fields: Object.keys(row).sort(),
            digest,
            serialized: JSON.stringify(row),
            info: row.info as
              { id: string; checkedAt: string; expiresAt: string } | undefined,
          };
        }),
      );
    },
    { database, store },
  );
}
async function freshSignIn(page: Page, username: string) {
  await page.context().clearCookies();
  await signIn(page, username);
}

test("real scoped offline use protects a complete performed edit, locks on reconnect and explicitly reconciles one service revision", async ({
  browser,
}) => {
  const owner = await login(browser, "owner-a");
  const song = await songFixture(owner.page);
  const before = await (await api(owner.page, "/api/library")).json();
  const historyBefore = await (
    await api(owner.page, `/api/songs/${song.id}/history`)
  ).json();
  const info = await prepare(owner.page);
  expect(info.songIds).toContain(song.id);
  const copies = await protectedRows(
    owner.page,
    "scoremap-protected-offline",
    "copies",
  );
  expect(copies).toHaveLength(1);
  expect(copies[0]!.digest).not.toBe("");
  expect(copies[0]!.serialized).not.toContain(song.title);
  let serviceWrites = 0;
  owner.page.on("request", (request) => {
    if (
      new URL(request.url()).pathname === "/api/library" &&
      request.method() === "PUT"
    )
      serviceWrites++;
  });
  await owner.context.setOffline(true);
  await expect(
    owner.page
      .getByRole("region", { name: "Private offline preparation" })
      .getByRole("status"),
  ).toContainText("Offline: using the protected prepared scope.");
  await owner.page
    .getByLabel("Active performed part", { exact: true })
    .selectOption(song.arrangements[0]!.parts[1]!.id);
  const builder = owner.page.getByRole("region", {
    name: "Played-note builder for Right",
    exact: true,
  });
  await builder
    .getByRole("button", { name: "Raise B4 one octave", exact: true })
    .click();
  await builder
    .getByRole("button", { name: "Apply played notes", exact: true })
    .click();
  await expect(owner.page.locator(".save-state")).toHaveText("Unsaved changes");
  await expect
    .poll(
      async () =>
        (
          await protectedRows(
            owner.page,
            "scoremap-protected-pending",
            "pending",
          )
        ).length,
    )
    .toBe(1);
  const pending = await protectedRows(
    owner.page,
    "scoremap-protected-pending",
    "pending",
  );
  expect(pending[0]!.digest).not.toBe("");
  expect(pending[0]!.serialized).not.toContain(song.title);
  expect(serviceWrites).toBe(0);
  expect(await (await api(owner.page, "/api/library")).json()).toEqual(before);
  expect(
    (
      await protectedRows(owner.page, "scoremap-protected-offline", "copies")
    )[0]!.info,
  ).toEqual(copies[0]!.info);
  const cacheUrls = await owner.page.evaluate(async () => {
    const urls: string[] = [];
    for (const key of await caches.keys())
      for (const request of await (await caches.open(key)).keys())
        urls.push(new URL(request.url).pathname);
    return urls;
  });
  expect(
    cacheUrls.some((path) => /^\/(api|auth|health)(\/|$)/.test(path)),
  ).toBe(false);
  await owner.context.setOffline(false);
  await expect(
    owner.page.getByRole("link", { name: "Sign in", exact: true }),
  ).toBeVisible();
  await expect(builder).toHaveCount(0);
  expect(serviceWrites).toBe(0);
  await freshSignIn(owner.page, "owner-a");
  const recovery = owner.page.getByRole("region", {
    name: "Protected pending work",
  });
  await recovery
    .getByRole("button", { name: "Review pending work", exact: true })
    .click();
  await recovery
    .getByRole("button", { name: "Retry original save", exact: true })
    .click();
  await expect(recovery).toHaveCount(0);
  const after = await (await api(owner.page, "/api/library")).json();
  expect(after.library.revision).toBe(before.library.revision + 1);
  const actual = after.library.songs.find(
    (candidate: RichSong) => candidate.id === song.id,
  ) as RichSong;
  expect(actual.sections).toEqual(song.sections);
  expect(actual.arrangements[0]!.parts[0]).toEqual(
    song.arrangements[0]!.parts[0],
  );
  expect(actual.arrangements[0]!.bindings).toEqual(
    song.arrangements[0]!.bindings,
  );
  expect(actual.arrangements[0]!.devices).toEqual(
    song.arrangements[0]!.devices,
  );
  expect(
    actual.arrangements[0]!.parts[1]!.events.map((event) => event.pitch.midi),
  ).toEqual([64, 83]);
  const expectedOther = before.library.songs.filter(
    (candidate: RichSong) => candidate.id !== song.id,
  );
  expect(
    after.library.songs.filter(
      (candidate: RichSong) => candidate.id !== song.id,
    ),
  ).toEqual(expectedOther);
  const history = await (
    await api(owner.page, `/api/songs/${song.id}/history`)
  ).json();
  expect(history).toHaveLength(historyBefore.length + 1);
  expect(history[0].content).toEqual(actual);
  await owner.context.close();
});

test("a real prepared lease ends at its configured earlier deadline and an offline restart never opens retained private content", async ({
  browser,
}) => {
  const owner = await login(browser, "owner-a");
  await owner.page.clock.install({ time: new Date() });
  const song = await songFixture(owner.page);
  const acknowledged = await (await api(owner.page, "/api/library")).json();
  const history = await (
    await api(owner.page, `/api/songs/${song.id}/history`)
  ).json();
  await prepare(owner.page);
  await owner.page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await owner.context.setOffline(true);
  await expect(
    owner.page
      .getByRole("region", { name: "Private offline preparation" })
      .getByRole("status"),
  ).toContainText("Offline:");
  await owner.page
    .getByText("Song details & personal notes", { exact: true })
    .click();
  await owner.page
    .getByLabel("Song notes", { exact: true })
    .fill("Protected pending change at expiry");
  await expect
    .poll(
      async () =>
        (
          await protectedRows(
            owner.page,
            "scoremap-protected-pending",
            "pending",
          )
        ).length,
    )
    .toBe(1);
  const pending = await protectedRows(
    owner.page,
    "scoremap-protected-pending",
    "pending",
  );
  expect(pending[0]!.digest).not.toBe("");
  expect(pending[0]!.serialized).not.toContain(
    "Protected pending change at expiry",
  );
  await owner.page.clock.fastForward(60001);
  await expect(
    owner.page.getByRole("link", { name: "Sign in", exact: true }),
  ).toBeVisible();
  await expect(
    owner.page.getByRole("heading", { name: song.title, exact: true }),
  ).toHaveCount(0);
  const retained = await protectedRows(
    owner.page,
    "scoremap-protected-offline",
    "copies",
  );
  expect(retained).toHaveLength(1);
  expect(
    (await (await owner.page.request.get("/auth/session")).json())
      .authenticated,
  ).toBe(true);
  await owner.page.reload();
  await expect(
    owner.page.getByRole("link", { name: "Sign in", exact: true }),
  ).toBeVisible();
  await expect(owner.page.getByText(song.title, { exact: true })).toHaveCount(
    0,
  );
  expect(
    await protectedRows(owner.page, "scoremap-protected-offline", "copies"),
  ).toEqual(retained);
  expect(
    await protectedRows(owner.page, "scoremap-protected-pending", "pending"),
  ).toEqual(pending);
  expect(await (await api(owner.page, "/api/library")).json()).toEqual(
    acknowledged,
  );
  expect(
    await (await api(owner.page, `/api/songs/${song.id}/history`)).json(),
  ).toEqual(history);
  await owner.context.close();
});

test("an offline personal choice is encrypted before transport and reconnect never automatically replays its mutation", async ({
  browser,
}) => {
  const owner = await login(browser, "owner-a");
  await songFixture(owner.page);
  const preference = await (
    await api(owner.page, "/api/preferences/notation")
  ).json();
  expect(preference.mode).toBe("anglo");
  await prepare(owner.page);
  let writes = 0;
  owner.page.on("request", (request) => {
    if (
      new URL(request.url()).pathname === "/api/preferences/notation" &&
      request.method() === "PUT"
    )
      writes++;
  });
  await owner.context.setOffline(true);
  await owner.page
    .getByLabel("Note names", { exact: true })
    .selectOption("latin");
  await expect(
    owner.page.getByText("Note-name choice not saved", { exact: true }),
  ).toBeVisible();
  const personal = owner.page.getByRole("region", {
    name: "Protected personal changes",
  });
  await expect(personal).toBeVisible();
  const retained = await protectedRows(
    owner.page,
    "scoremap-protected-personal",
    "pending",
  );
  expect(retained).toHaveLength(1);
  expect(retained[0]!.digest).not.toBe("");
  expect(retained[0]!.serialized).not.toContain("latin");
  expect(writes).toBe(0);
  expect(
    await (await api(owner.page, "/api/preferences/notation")).json(),
  ).toEqual(preference);
  await owner.context.setOffline(false);
  await expect(
    owner.page.getByRole("link", { name: "Sign in", exact: true }),
  ).toBeVisible();
  expect(writes).toBe(0);
  await freshSignIn(owner.page, "owner-a");
  await personal
    .getByRole("button", { name: "Review personal draft 1", exact: true })
    .click();
  await personal
    .getByRole("button", {
      name: "Retry original personal change and reopen",
      exact: true,
    })
    .click();
  await expect(personal).toHaveCount(0);
  expect(
    await (await api(owner.page, "/api/preferences/notation")).json(),
  ).toEqual({
    mode: "latin",
    primary: "latin",
    revision: preference.revision + 1,
  });
  await owner.context.close();
});
