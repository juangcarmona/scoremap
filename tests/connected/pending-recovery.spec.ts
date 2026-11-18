import { test, expect, type Page, type Dialog } from "@playwright/test";
import { readFile } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
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
    "privateOfflineMinutes",
    "sessionId",
  ]);
  expect(Number.isInteger(metadata.privateOfflineMinutes)).toBe(true);
  expect(metadata.privateOfflineMinutes).toBeGreaterThanOrEqual(0);
  expect(metadata.privateOfflineMinutes).toBeLessThanOrEqual(480);
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
  expect(retained[0]!.fields).toEqual([
    "cipher",
    "commandId",
    "formatVersion",
    "generation",
    "iv",
    "keyId",
  ]);
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

function ownedIds(value: unknown, result = new Set<string>()) {
  if (Array.isArray(value)) value.forEach((child) => ownedIds(child, result));
  else if (value && typeof value === "object")
    for (const [key, child] of Object.entries(value)) {
      if (key === "sourcePreset") continue;
      if (key === "id" && typeof child === "string") result.add(child);
      else ownedIds(child, result);
    }
  return result;
}
function normalizedMusic(value: unknown) {
  const ids = new Map<string, string>();
  function collect(value: unknown) {
    if (Array.isArray(value)) value.forEach(collect);
    else if (value && typeof value === "object")
      for (const key of Object.keys(value).sort()) {
        if (key === "sourcePreset") continue;
        const child = (value as Record<string, unknown>)[key];
        if (key === "id" && typeof child === "string")
          ids.set(child, `owned-${ids.size}`);
        else collect(child);
      }
  }
  collect(value);
  function replace(value: unknown, key = ""): unknown {
    if (key === "sourcePreset") return value;
    if (Array.isArray(value)) return value.map((child) => replace(child));
    if (value && typeof value === "object")
      return Object.fromEntries(
        Object.entries(value).map(([name, child]) => [
          name,
          replace(child, name),
        ]),
      );
    return typeof value === "string" ? (ids.get(value) ?? value) : value;
  }
  return replace(value);
}

test("stale protected work refuses overwrite and saves one complete independent recovery copy despite a lost copy acknowledgement and reload", async ({
  browser,
}) => {
  const owner = await login(browser, "owner-a");
  const song = await prepare(owner.page);
  await owner.page.route("**/api/library", (route) =>
    route.request().method() === "PUT"
      ? route.abort("failed")
      : route.continue(),
  );
  await edit(owner.page, song);
  await owner.page.unroute("**/api/library");
  const retained = await protectedRecord(owner.page);
  const second = await login(browser, "owner-a");
  const newer = await saveView(second.page, (library) => {
    library.songs.find((candidate) => candidate.id === song.id)!.notes =
      "Newer acknowledged device change";
  });
  const history = await (
    await api(second.page, `/api/songs/${song.id}/history`)
  ).json();
  await owner.page.reload();
  let recovery = owner.page.getByRole("region", {
    name: "Protected pending work",
    exact: true,
  });
  await recovery
    .getByRole("button", { name: "Review pending work", exact: true })
    .click();
  const refused = owner.page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/library") &&
      response.request().method() === "PUT",
  );
  await recovery
    .getByRole("button", { name: "Retry original save", exact: true })
    .click();
  expect((await refused).status()).toBe(409);
  expect(await protectedRecord(owner.page)).toEqual(retained);
  expect(await (await api(second.page, "/api/library")).json()).toEqual(newer);
  expect(
    await (await api(second.page, `/api/songs/${song.id}/history`)).json(),
  ).toEqual(history);
  let lost = false;
  await owner.page.route("**/api/library", async (route) => {
    if (route.request().method() !== "PUT" || lost) return route.continue();
    lost = true;
    const response = await route.fetch();
    expect(response.status()).toBe(200);
    await route.abort("failed");
  });
  owner.page.once("dialog", (dialog) => dialog.accept());
  await recovery
    .getByRole("button", {
      name: `Save as a new song: ${song.title}`,
      exact: true,
    })
    .click();
  await expect(owner.page.getByRole("alert")).toContainText("Failed to fetch");
  const copied = await (await api(second.page, "/api/library")).json();
  const copies = copied.library.songs.filter(
    (candidate: RichSong) =>
      candidate.title === `${song.title} (Recovered copy)`,
  );
  expect(copies).toHaveLength(1);
  const expected = structuredClone(song);
  expected.title += " (Recovered copy)";
  expected.arrangements[0]!.parts[1]!.events[1]!.pitch = {
    spelling: "B",
    octave: 5,
    midi: 83,
  };
  expect(normalizedMusic(copies[0])).toEqual(normalizedMusic(expected));
  expect(ownedIds(copies[0]).size).toBe(ownedIds(song).size);
  expect(
    [...ownedIds(copies[0])].filter((id) => ownedIds(song).has(id)),
  ).toEqual([]);
  expect(
    copied.library.songs.find(
      (candidate: RichSong) => candidate.id === song.id,
    ),
  ).toEqual(
    newer.library.songs.find((candidate: RichSong) => candidate.id === song.id),
  );
  expect(copied.library.repertoires).toEqual(newer.library.repertoires);
  const originalAfterCopy = await protectedRecord(owner.page);
  expect(originalAfterCopy[0]!.digest).toBe(retained[0]!.digest);
  expect(originalAfterCopy[0]!.commandId).toBe(retained[0]!.commandId);
  expect(originalAfterCopy[0]!.fields).toEqual([
    "cipher",
    "commandId",
    "copies",
    "formatVersion",
    "generation",
    "iv",
    "keyId",
  ]);
  await owner.page.unroute("**/api/library");
  await owner.page.reload();
  recovery = owner.page.getByRole("region", {
    name: "Protected pending work",
    exact: true,
  });
  await recovery
    .getByRole("button", { name: "Review pending work", exact: true })
    .click();
  let writes = 0;
  owner.page.on("request", (request) => {
    if (request.url().endsWith("/api/library") && request.method() === "PUT")
      writes++;
  });
  owner.page.once("dialog", (dialog) => dialog.accept());
  await recovery
    .getByRole("button", {
      name: `Save as a new song: ${song.title}`,
      exact: true,
    })
    .click();
  await expect(recovery.getByRole("status")).toContainText(
    "Recovery copy saved to your private library",
  );
  expect(writes).toBe(0);
  expect(await (await api(second.page, "/api/library")).json()).toEqual(copied);
  expect(
    await (await api(second.page, `/api/songs/${song.id}/history`)).json(),
  ).toEqual(history);
  expect(
    (
      await (
        await api(second.page, `/api/songs/${copies[0].id}/history`)
      ).json()
    ).map((entry: { revision: number }) => entry.revision),
  ).toEqual([1]);
  expect((await protectedRecord(owner.page))[0]!.digest).toBe(
    retained[0]!.digest,
  );
  expect(
    (await new AxeBuilder({ page: owner.page }).analyze()).violations,
  ).toEqual([]);
  await Promise.all([owner.context.close(), second.context.close()]);
});

test("a retained legacy draft copies once through atomic v1 migration and reconciles the same rich copy after a lost acknowledgement", async ({
  browser,
}) => {
  const owner = await login(browser, "owner-a");
  const source = syntheticSong();
  await saveView(owner.page, (library) => {
    library.songs.push(source);
  });
  await owner.page.reload();
  await openSong(owner.page, source.title);
  await owner.page
    .getByText("Song details & personal notes", { exact: true })
    .click();
  await owner.page.route("**/api/library", (route) =>
    route.request().method() === "PUT"
      ? route.abort("failed")
      : route.continue(),
  );
  await owner.page
    .getByLabel("Song notes", { exact: true })
    .fill("Retained legacy draft reminder");
  await expect(owner.page.locator(".save-state")).toHaveText("Unsaved changes");
  await owner.page.unroute("**/api/library");
  const retained = await protectedRecord(owner.page);
  const second = await login(browser, "owner-a");
  await saveView(second.page, (library) => {
    library.songs.find((song) => song.id === source.id)!.notes =
      "Newer original reminder";
  });
  await owner.page.reload();
  let recovery = owner.page.getByRole("region", {
    name: "Protected pending work",
    exact: true,
  });
  await recovery
    .getByRole("button", { name: "Review pending work", exact: true })
    .click();
  await owner.page.route("**/api/library", async (route) => {
    if (route.request().method() !== "PUT") return route.continue();
    expect((await route.fetch()).status()).toBe(200);
    await route.abort("failed");
  });
  owner.page.once("dialog", (dialog) => dialog.accept());
  await recovery
    .getByRole("button", {
      name: `Save as a new song: ${source.title}`,
      exact: true,
    })
    .click();
  await expect(owner.page.getByRole("alert")).toContainText("Failed to fetch");
  const saved = await (await api(second.page, "/api/library")).json();
  const copies = saved.library.songs.filter(
    (song: RichSong) => song.title === `${source.title} (Recovered copy)`,
  );
  expect(copies).toHaveLength(1);
  const copy = copies[0] as RichSong;
  expect(copy.notes).toBe("Retained legacy draft reminder");
  expect(copy.migration?.sourceVersion).toBe(1);
  expect(copy.sections[0]!.chords[0]).toMatchObject({
    root: "Db",
    quality: "minor",
    start: { n: 0, d: 1 },
    duration: { n: 1, d: 1 },
  });
  expect(copy.arrangements).toHaveLength(1);
  expect(copy.arrangements[0]!.parts.flatMap((part) => part.events)).toEqual(
    [],
  );
  const history = await (
    await api(second.page, `/api/songs/${copy.id}/history`)
  ).json();
  expect(history.map((entry: { revision: number }) => entry.revision)).toEqual([
    1, 0,
  ]);
  expect(history[0].content).toEqual(copy);
  expect(history[1].content.notes).toBe("Retained legacy draft reminder");
  expect(history[1].content.sections[0].chords).toEqual([
    { root: "Db", quality: "minor" },
  ]);
  expect(
    saved.library.songs.find((song: RichSong) => song.id === source.id).notes,
  ).toBe("Newer original reminder");
  await owner.page.unroute("**/api/library");
  await owner.page.reload();
  recovery = owner.page.getByRole("region", {
    name: "Protected pending work",
    exact: true,
  });
  await recovery
    .getByRole("button", { name: "Review pending work", exact: true })
    .click();
  owner.page.once("dialog", (dialog) => dialog.accept());
  await recovery
    .getByRole("button", {
      name: `Save as a new song: ${source.title}`,
      exact: true,
    })
    .click();
  await expect(recovery.getByRole("status")).toContainText(
    "Recovery copy saved to your private library",
  );
  expect(await (await api(second.page, "/api/library")).json()).toEqual(saved);
  expect((await protectedRecord(owner.page))[0]!.digest).toBe(
    retained[0]!.digest,
  );
  await Promise.all([owner.context.close(), second.context.close()]);
});

test("typing protects the latest complete draft and coalesces a burst into one real service revision", async ({
  browser,
}) => {
  const owner = await login(browser, "owner-a");
  const song = await prepare(owner.page);
  const before = await (await api(owner.page, "/api/library")).json();
  const historyBefore = await (
    await api(owner.page, `/api/songs/${song.id}/history`)
  ).json();
  await owner.page
    .getByText("Song details & personal notes", { exact: true })
    .click();
  const notes = owner.page.getByLabel("Song notes", { exact: true });
  await notes.fill("");
  await expect(owner.page.locator(".save-state")).toHaveText(
    "Saved to your private library",
  );
  const cleared = await (await api(owner.page, "/api/library")).json();
  const historyCleared = await (
    await api(owner.page, `/api/songs/${song.id}/history`)
  ).json();
  let sends = 0;
  owner.page.on("request", (request) => {
    if (
      new URL(request.url()).pathname === "/api/library" &&
      request.method() === "PUT"
    )
      sends++;
  });
  const reminder =
    "Play softly, keep both hands independent, and watch the final repeat.";
  await notes.pressSequentially(reminder, { delay: 4 });
  await expect(notes).toHaveValue(reminder);
  await expect(owner.page.locator(".save-state")).toHaveText(
    "Saved to your private library",
  );
  const after = await (await api(owner.page, "/api/library")).json();
  const historyAfter = await (
    await api(owner.page, `/api/songs/${song.id}/history`)
  ).json();
  expect(sends).toBe(1);
  expect(after.library.revision).toBe(cleared.library.revision + 1);
  expect(historyAfter).toHaveLength(historyCleared.length + 1);
  const expected = structuredClone(cleared.library);
  expected.revision++;
  expected.songs.find((candidate: RichSong) => candidate.id === song.id).notes =
    reminder;
  expect(after.library).toEqual(expected);
  expect(historyAfter[0].content).toEqual(
    after.library.songs.find((candidate: RichSong) => candidate.id === song.id),
  );
  expect(cleared.library.revision).toBeGreaterThanOrEqual(
    before.library.revision,
  );
  expect(historyCleared.length).toBeGreaterThanOrEqual(historyBefore.length);
  await owner.page.reload();
  await openSong(owner.page, song.title);
  await owner.page
    .getByText("Song details & personal notes", { exact: true })
    .click();
  await expect(
    owner.page.getByLabel("Song notes", { exact: true }),
  ).toHaveValue(reminder);
  await owner.context.close();
});
