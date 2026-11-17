import { test, expect, type Page, type Dialog } from "@playwright/test";
import { readFile } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
import { api, login, openSong, saveView, signIn } from "./helpers";
import { uniqueRichFixture } from "./rich-fixtures";
import type { Library } from "../../src/features/library/domain";
import type { RichSong } from "../../src/features/library/score";

async function prepare(page: Page) {
  const source = JSON.parse(
    await readFile("tests/fixtures/library-v2.json", "utf8"),
  ) as Library;
  const original = source.songs[0] as RichSong;
  delete original.migration;
  const { song } = uniqueRichFixture(original);
  const pref = await (await api(page, "/api/preferences/notation")).json();
  if (pref.mode !== "anglo")
    expect(
      (
        await api(page, "/api/preferences/notation", "PUT", {
          mode: "anglo",
          primary: "anglo",
          expectedRevision: pref.revision,
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
async function edit(page: Page, song: RichSong) {
  await page
    .getByLabel("Active performed part", { exact: true })
    .selectOption(song.arrangements[0]!.parts[1]!.id);
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
  await expect(page.locator(".save-state")).toHaveText("Unsaved changes");
}
async function protectedRecord(page: Page) {
  return page.evaluate(async () => {
    const request = indexedDB.open("scoremap-protected-pending", 1);
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const read = db.transaction("pending").objectStore("pending").getAll();
    const rows = await new Promise<
      { cipher: ArrayBuffer; keyId: string; commandId: string }[]
    >((resolve, reject) => {
      read.onsuccess = () => resolve(read.result);
      read.onerror = () => reject(read.error);
    });
    db.close();
    return Promise.all(
      rows.map(async (row) => ({
        keyId: row.keyId,
        commandId: row.commandId,
        fields: Object.keys(row).sort(),
        digest: Array.from(
          new Uint8Array(await crypto.subtle.digest("SHA-256", row.cipher)),
        )
          .map((n) => n.toString(16).padStart(2, "0"))
          .join(""),
      })),
    );
  });
}
test("protected complete-song retry after reload reconciles a lost actual commit without another revision or history entry", async ({
  browser,
}) => {
  const owner = await login(browser, "owner-a");
  const song = await prepare(owner.page);
  const before = await (await api(owner.page, "/api/library")).json();
  await owner.page.route("**/api/library", async (route) => {
    if (route.request().method() !== "PUT") return route.continue();
    const response = await route.fetch();
    expect(response.status()).toBe(200);
    await route.abort("failed");
  });
  await edit(owner.page, song);
  await expect(owner.page.getByRole("alert")).toContainText(
    "Save not confirmed",
  );
  const retained = await protectedRecord(owner.page);
  expect(retained).toHaveLength(1);
  await owner.page.unroute("**/api/library");
  const committed = await (await api(owner.page, "/api/library")).json();
  expect(committed.versions[song.id]).toBe(before.versions[song.id] + 1);
  const changed = structuredClone(song);
  changed.arrangements[0]!.parts[1]!.events[1]!.pitch = {
    spelling: "B",
    octave: 5,
    midi: 83,
  };
  expect(
    committed.library.songs.find((s: RichSong) => s.id === song.id),
  ).toEqual(changed);
  await owner.page.reload();
  await expect(
    owner.page.getByRole("button", { name: "New song", exact: true }),
  ).toHaveCount(0);
  const recovery = owner.page.getByRole("region", {
    name: "Protected pending work",
    exact: true,
  });
  await recovery
    .getByRole("button", { name: "Review pending work", exact: true })
    .click();
  await expect(
    recovery.getByText("The song content matches your saved library.", {
      exact: false,
    }),
  ).toBeVisible();
  await recovery
    .getByRole("button", { name: "Retry original save", exact: true })
    .click();
  await expect(recovery).toHaveCount(0);
  expect(await (await api(owner.page, "/api/library")).json()).toEqual(
    committed,
  );
  const history = await (
    await api(owner.page, `/api/songs/${song.id}/history`)
  ).json();
  expect(history.map((entry: { revision: number }) => entry.revision)).toEqual([
    2, 1,
  ]);
  expect(await protectedRecord(owner.page)).toEqual([]);
  await owner.context.close();
});

test("SB-SESSION-LOCK: a real principal's known deadline locks complete performed-note pending work, rejects late responses and retains only protected recovery across account switch", async ({
  browser,
}) => {
  const owner = await login(browser, "owner-a", {
    viewport: { width: 390, height: 844 },
    hasTouch: true,
  });
  const song = await prepare(owner.page);
  await owner.page.clock.install();
  const sessionResponse = owner.page.waitForResponse((response) =>
    response.url().endsWith("/auth/session"),
  );
  await owner.page.reload();
  const metadata = await (await sessionResponse).json();
  expect(metadata.sessionId).toBeTruthy();
  expect(
    Date.parse(metadata.expiresAt) - Date.parse(metadata.checkedAt),
  ).toBeGreaterThan(0);
  expect(Object.keys(metadata).sort()).toEqual([
    "authenticated",
    "checkedAt",
    "csrf",
    "expiresAt",
    "name",
    "principal",
    "sessionId",
  ]);
  await openSong(owner.page, song.title);
  const before = await (await api(owner.page, "/api/library")).json();
  await owner.page.route("**/api/library", (route) =>
    route.request().method() === "PUT"
      ? route.abort("failed")
      : route.continue(),
  );
  await edit(owner.page, song);
  const retained = await protectedRecord(owner.page);
  expect(retained).toHaveLength(1);
  expect(retained[0]!.fields).toEqual(["cipher", "commandId", "iv", "keyId"]);
  await owner.page.unroute("**/api/library");
  // Keep genuine background checks pending: no forged identity/session result grants or renews authority.
  let release!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await owner.page.route("**/auth/session", async (route) => {
    await held;
    await route.continue().catch(() => undefined);
  });
  await owner.page.route("**/api/library", async (route) => {
    await held;
    await route.continue().catch(() => undefined);
  });
  await owner.page.clock.fastForward(
    Date.parse(metadata.expiresAt) - Date.parse(metadata.checkedAt) + 1000,
  );
  await expect(
    owner.page.getByRole("link", { name: "Sign in", exact: true }),
  ).toBeVisible();
  await expect(
    owner.page.getByRole("region", { name: /Played-note builder/ }),
  ).toHaveCount(0);
  await expect(owner.page.getByText(song.title, { exact: true })).toHaveCount(
    0,
  );
  expect(await protectedRecord(owner.page)).toEqual(retained);
  release();
  await owner.page.unroute("**/auth/session");
  await owner.page.unroute("**/api/library");
  expect(await (await api(owner.page, "/api/library")).json()).toEqual(before);
  await owner.context.clearCookies();
  await owner.page.clock.setSystemTime(new Date());
  await owner.page.reload();
  await expect(
    owner.page.getByRole("link", { name: "Sign in", exact: true }),
  ).toBeVisible();
  await expect(owner.page.getByText(song.title, { exact: true })).toHaveCount(
    0,
  );
  await signIn(owner.page, "owner-b");
  await expect(
    owner.page.getByRole("region", {
      name: "Protected pending work",
      exact: true,
    }),
  ).toHaveCount(0);
  expect(
    (
      await api(
        owner.page,
        `/api/recovery-keys/${retained[0]!.keyId}/unlock`,
        "POST",
      )
    ).status(),
  ).toBe(403);
  expect(await protectedRecord(owner.page)).toEqual(retained);
  await owner.page
    .getByRole("button", { name: "Sign out", exact: true })
    .click();
  await expect(
    owner.page.getByRole("link", { name: "Sign in", exact: true }),
  ).toBeVisible();
  await signIn(owner.page, "owner-a");
  const recovery = owner.page.getByRole("region", {
    name: "Protected pending work",
    exact: true,
  });
  await recovery
    .getByRole("button", { name: "Review pending work", exact: true })
    .click();
  await expect(recovery.getByText(song.title, { exact: true })).toBeVisible();
  expect(await (await api(owner.page, "/api/library")).json()).toEqual(before);
  expect(
    (await new AxeBuilder({ page: owner.page }).analyze()).violations,
  ).toEqual([]);
  await owner.context.close();
});

test("SB-PRIVATE-REFUSE: the same reauthenticated editor cannot open a protected complete draft after owner revocation, but can explicitly remove its ciphertext", async ({
  browser,
}) => {
  const owner = await login(browser, "owner-a");
  const song = await prepare(owner.page);
  const editor = await login(browser, "editor");
  const editorIdentity = await (
    await editor.page.request.get("/auth/session")
  ).json();
  expect(
    (
      await api(owner.page, `/api/songs/${song.id}/grants`, "PUT", {
        principal: editorIdentity.principal,
        role: "editor",
      })
    ).status(),
  ).toBe(204);
  await editor.page.reload();
  await openSong(editor.page, song.title);
  const anonymous = {
    schemaVersion: 1,
    revision: 911,
    songs: [
      {
        id: "anonymous-original",
        title: "Anonymous retained source",
        artist: "",
        notes: "Independent local source",
        sections: [],
        references: [],
      },
    ],
    repertoires: [],
  };
  await editor.page.evaluate(async (value) => {
    const request = indexedDB.open("scoremap", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("library");
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const tx = db.transaction("library", "readwrite");
    tx.objectStore("library").put(value, "current");
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
    db.close();
  }, anonymous);
  await editor.page.route("**/api/library", (route) =>
    route.request().method() === "PUT"
      ? route.abort("failed")
      : route.continue(),
  );
  await edit(editor.page, song);
  await editor.page.unroute("**/api/library");
  const retained = await protectedRecord(editor.page);
  expect(retained).toHaveLength(1);
  const retainOnLogout = (dialog: Dialog) => dialog.accept();
  editor.page.on("dialog", retainOnLogout);
  await editor.page
    .getByRole("button", { name: "Sign out", exact: true })
    .click();
  await expect(
    editor.page.getByRole("link", { name: "Sign in", exact: true }),
  ).toBeVisible();
  editor.page.off("dialog", retainOnLogout);
  expect(
    (
      await api(owner.page, `/api/songs/${song.id}/grants`, "PUT", {
        principal: editorIdentity.principal,
        role: null,
      })
    ).status(),
  ).toBe(204);
  const saved = await (await api(owner.page, "/api/library")).json();
  const history = await (
    await api(owner.page, `/api/songs/${song.id}/history`)
  ).json();
  await signIn(editor.page, "editor");
  const renewedIdentity = await (
    await editor.page.request.get("/auth/session")
  ).json();
  expect(renewedIdentity.principal).toBe(editorIdentity.principal);
  expect(renewedIdentity.sessionId).not.toBe(editorIdentity.sessionId);
  expect(
    (await (await api(editor.page, "/api/library")).json()).capabilities[
      song.id
    ],
  ).toBeUndefined();
  expect(await protectedRecord(editor.page)).toEqual(retained);
  let downloads = 0;
  editor.page.on("download", () => {
    downloads++;
  });
  const refusal = editor.page.waitForResponse((response) =>
    response.url().endsWith(`/api/recovery-keys/${retained[0]!.keyId}/unlock`),
  );
  await editor.page
    .getByRole("button", { name: "Review pending work", exact: true })
    .click();
  expect((await refusal).status()).toBe(403);
  await expect(
    editor.page.getByRole("link", { name: "Sign in", exact: true }),
  ).toBeVisible();
  await expect(editor.page.getByText(song.title, { exact: true })).toHaveCount(
    0,
  );
  await expect(
    editor.page.getByRole("region", {
      name: "Protected pending work",
      exact: true,
    }),
  ).toHaveCount(0);
  expect(downloads).toBe(0);
  expect(await protectedRecord(editor.page)).toEqual(retained);
  expect(await (await api(owner.page, "/api/library")).json()).toEqual(saved);
  expect(
    await (await api(owner.page, `/api/songs/${song.id}/history`)).json(),
  ).toEqual(history);
  // A separate explicit local deletion never needs the refused decryption key.
  editor.page.once("dialog", (dialog) => dialog.accept());
  await editor.page
    .getByRole("button", { name: "Remove protected pending work", exact: true })
    .click();
  await expect(editor.page.getByRole("status")).toContainText(
    "Protected pending work removed",
  );
  expect(await protectedRecord(editor.page)).toEqual([]);
  const untouched = await editor.page.evaluate(async () => {
    const request = indexedDB.open("scoremap", 1);
    const db = await new Promise<IDBDatabase>((resolve) => {
      request.onsuccess = () => resolve(request.result);
    });
    const read = db
      .transaction("library")
      .objectStore("library")
      .get("current");
    const value = await new Promise<unknown>((resolve) => {
      read.onsuccess = () => resolve(read.result);
    });
    db.close();
    return value;
  });
  expect(untouched).toEqual(anonymous);
  await Promise.all([owner.context.close(), editor.context.close()]);
});
