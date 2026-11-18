import { test, expect, type Page } from "@playwright/test";
import { createHash } from "node:crypto";
import {
  api,
  login,
  openSong,
  saveView,
  signIn,
  syntheticSong,
} from "./helpers";
async function prepare(page: Page) {
  const panel = page.getByRole("region", {
    name: "Private offline preparation",
  });
  await panel
    .getByRole("button", { name: "Prepare private offline copy", exact: true })
    .click();
  await expect(panel.getByRole("status")).toContainText(
    "Offline copy protected and ready.",
  );
}
async function pending(page: Page) {
  return page.evaluate(async () => {
    const open = indexedDB.open("scoremap-protected-pending", 1);
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      open.onsuccess = () => resolve(open.result);
      open.onerror = () => reject(open.error);
    });
    const request = db.transaction("pending").objectStore("pending").getAll();
    const rows = await new Promise<
      { cipher: ArrayBuffer; commandId: string }[]
    >((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    db.close();
    return Promise.all(
      rows.map(async (row) => ({
        commandId: row.commandId,
        digest: Array.from(
          new Uint8Array(await crypto.subtle.digest("SHA-256", row.cipher)),
          (byte) => byte.toString(16).padStart(2, "0"),
        ).join(""),
      })),
    );
  });
}

test("a revoked real editor loses offline access before reconnect exposure and cannot unlock or replay its retained draft", async ({
  browser,
}) => {
  const owner = await login(browser, "owner-a"),
    editor = await login(browser, "editor");
  const song = syntheticSong();
  await saveView(owner.page, (library) => {
    library.songs.push(song);
  });
  const principal = (
    await (await editor.page.request.get("/auth/session")).json()
  ).principal;
  expect(
    (
      await api(owner.page, `/api/songs/${song.id}/grants`, "PUT", {
        principal,
        role: "editor",
        mode: "edit",
      })
    ).status(),
  ).toBe(204);
  const before = await (await api(owner.page, "/api/library")).json();
  const history = await (
    await api(owner.page, `/api/songs/${song.id}/history`)
  ).json();
  await editor.page.reload();
  await openSong(editor.page, song.title);
  await prepare(editor.page);
  await editor.context.setOffline(true);
  await editor.page
    .getByText("Song details & personal notes", { exact: true })
    .click();
  await editor.page
    .getByLabel("Song notes", { exact: true })
    .fill("A protected offline draft must never bypass revocation");
  await expect(editor.page.locator(".save-state")).toHaveText(
    "Unsaved changes",
  );
  await expect.poll(async () => (await pending(editor.page)).length).toBe(1);
  const retained = await pending(editor.page);
  expect(
    (
      await api(owner.page, `/api/songs/${song.id}/grants`, "PUT", {
        principal,
        role: null,
        mode: "edit",
      })
    ).status(),
  ).toBe(204);
  let writes = 0;
  editor.page.on("request", (request) => {
    if (
      new URL(request.url()).pathname === "/api/library" &&
      request.method() === "PUT"
    )
      writes++;
  });
  await editor.context.setOffline(false);
  await expect(
    editor.page.getByRole("link", { name: "Sign in", exact: true }),
  ).toBeVisible();
  await expect(editor.page.getByText(song.title, { exact: true })).toHaveCount(
    0,
  );
  expect(writes).toBe(0);
  await editor.context.clearCookies();
  await signIn(editor.page, "editor");
  const recovery = editor.page.getByRole("region", {
    name: "Protected pending work",
  });
  await recovery
    .getByRole("button", { name: "Review pending work", exact: true })
    .click();
  await expect(
    editor.page.getByRole("link", { name: "Sign in", exact: true }),
  ).toBeVisible();
  expect(await pending(editor.page)).toEqual(retained);
  expect(writes).toBe(0);
  const after = await (await api(owner.page, "/api/library")).json();
  expect(
    after.library.songs.find(
      (candidate: { id: string }) => candidate.id === song.id,
    ),
  ).toEqual(
    before.library.songs.find(
      (candidate: { id: string }) => candidate.id === song.id,
    ),
  );
  expect(after.versions[song.id]).toBe(before.versions[song.id]);
  expect(
    await (await api(owner.page, `/api/songs/${song.id}/history`)).json(),
  ).toEqual(history);
  editor.page.once("dialog", (dialog) => dialog.accept());
  await editor.page
    .getByRole("button", { name: "Remove protected pending work", exact: true })
    .click();
  await expect.poll(async () => (await pending(editor.page)).length).toBe(0);
  await Promise.all([owner.context.close(), editor.context.close()]);
});

test("fresh offline authorization is scoped, rejects forged scope and keys, and cannot activate a browser from login or a direct API response alone", async ({
  browser,
}) => {
  const owner = await login(browser, "owner-a"),
    other = await login(browser, "owner-b");
  const song = syntheticSong(),
    hidden = syntheticSong();
  await saveView(owner.page, (library) => {
    library.songs.push(song);
  });
  await saveView(other.page, (library) => {
    library.songs.push(hidden);
  });
  const response = await api(owner.page, "/api/offline-lease", "POST", {
    songIds: [song.id],
  });
  expect(response.status()).toBe(200);
  const lease = await response.json();
  expect(Object.keys(lease.scope.songs)).toEqual([song.id]);
  expect(
    lease.view.library.songs.map((candidate: { id: string }) => candidate.id),
  ).toEqual([song.id]);
  expect(Object.keys(lease.view.versions)).toEqual([song.id]);
  expect(JSON.stringify(lease.view)).not.toContain(hidden.title);
  expect(
    (
      await api(owner.page, "/api/offline-lease", "POST", {
        songIds: [hidden.id],
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await api(owner.page, "/api/offline-lease", "POST", {
        songIds: [song.id, song.id],
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await api(owner.page, "/api/offline-lease", "POST", {
        songIds: [song.id],
        configuredMinutes: 481,
      })
    ).status(),
  ).toBe(400);
  const music = lease.keys.songs,
    personal = lease.keys.personal;
  expect(
    (
      await api(other.page, `/api/recovery-keys/${music.id}/unlock`, "POST")
    ).status(),
  ).toBe(403);
  expect(
    (
      await api(owner.page, `/api/recovery-keys/${personal.id}/unlock`, "POST")
    ).status(),
  ).toBe(403);
  const unlocked = await api(
    owner.page,
    `/api/recovery-keys/${music.id}/unlock`,
    "POST",
  );
  expect(unlocked.status()).toBe(200);
  const same =
    createHash("sha256")
      .update((await unlocked.json()).key)
      .digest("hex") === createHash("sha256").update(music.key).digest("hex");
  expect(same).toBe(true);
  expect(
    (
      await api(owner.page, `/api/recovery-keys/${music.id}`, "DELETE")
    ).status(),
  ).toBe(204);
  expect(
    (
      await api(owner.page, `/api/recovery-keys/${music.id}/unlock`, "POST")
    ).status(),
  ).toBe(403);
  expect(
    (
      await api(
        owner.page,
        `/api/personal-recovery-keys/${personal.id}`,
        "DELETE",
      )
    ).status(),
  ).toBe(204);
  expect(
    (
      await api(
        owner.page,
        `/api/personal-recovery-keys/${personal.id}/unlock`,
        "POST",
      )
    ).status(),
  ).toBe(403);
  await owner.context.setOffline(true);
  await expect(
    owner.page.getByRole("link", { name: "Sign in", exact: true }),
  ).toBeVisible();
  await expect(owner.page.getByText(song.title, { exact: true })).toHaveCount(
    0,
  );
  await Promise.all([owner.context.close(), other.context.close()]);
});

test("an actual offline-copy storage refusal creates no usable offline authority and preserves the acknowledged service state", async ({
  browser,
}) => {
  const owner = await login(browser, "owner-a");
  const song = syntheticSong();
  await saveView(owner.page, (library) => {
    library.songs.push(song);
  });
  await owner.page.reload();
  await openSong(owner.page, song.title);
  const before = await (await api(owner.page, "/api/library")).json();
  await owner.page.evaluate(() => {
    const original = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (
      this: IDBObjectStore,
      ...args: Parameters<IDBObjectStore["put"]>
    ) {
      if (this.transaction.db.name === "scoremap-protected-offline")
        throw new DOMException(
          "Synthetic offline copy quota",
          "QuotaExceededError",
        );
      return original.apply(this, args);
    };
  });
  const panel = owner.page.getByRole("region", {
    name: "Private offline preparation",
  });
  await panel
    .getByRole("button", { name: "Prepare private offline copy", exact: true })
    .click();
  await expect(panel.getByRole("alert")).toContainText(
    "Synthetic offline copy quota",
  );
  await expect(panel.getByRole("status")).toHaveCount(0);
  expect(await (await api(owner.page, "/api/library")).json()).toEqual(before);
  await owner.context.setOffline(true);
  await expect(
    owner.page.getByRole("link", { name: "Sign in", exact: true }),
  ).toBeVisible();
  await expect(owner.page.getByText(song.title, { exact: true })).toHaveCount(
    0,
  );
  await owner.context.close();
});

test("a real prepared private context locks on detected wall-clock rollback while the provider session remains independently valid", async ({
  browser,
}) => {
  const owner = await login(browser, "owner-a");
  await owner.page.clock.install({ time: new Date() });
  const song = syntheticSong();
  await saveView(owner.page, (library) => {
    library.songs.push(song);
  });
  await owner.page.reload();
  await openSong(owner.page, song.title);
  await prepare(owner.page);
  await owner.context.setOffline(true);
  await owner.page.clock.runFor(1000);
  await owner.page.clock.setSystemTime(new Date(Date.now() - 10000));
  await owner.page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(
    owner.page.getByRole("link", { name: "Sign in", exact: true }),
  ).toBeVisible();
  await expect(owner.page.getByText(song.title, { exact: true })).toHaveCount(
    0,
  );
  expect(
    (await (await owner.page.request.get("/auth/session")).json())
      .authenticated,
  ).toBe(true);
  await owner.context.close();
});
