import { test, expect, type Page, type Browser } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFile } from "node:fs/promises";
import type { Library, Song } from "../../src/features/library/domain";
const fixture = JSON.parse(
  await readFile(
    process.env.SCOREMAP_TEST_USERS ?? "config/development-users.example.json",
    "utf8",
  ),
) as {
  realm: string;
  users: {
    username: string;
    id: string;
    email: string;
    credentials: { value: string }[];
  }[];
};
test.beforeAll(async ({ request }) => {
  await expect
    .poll(
      async () => {
        try {
          return (await request.get("/health/ready")).status();
        } catch {
          return 0;
        }
      },
      { timeout: 30000 },
    )
    .toBe(200);
});
async function login(
  browser: Browser,
  username: string,
  options: Parameters<Browser["newContext"]>[0] = {},
) {
  const context = await browser.newContext(options);
  const page = await context.newPage();
  await signIn(page, username);
  return { context, page };
}
async function signIn(page: Page, username: string) {
  await page.goto("/");
  await page.getByRole("link", { name: "Sign in", exact: true }).click();
  const user = fixture.users.find((u) => u.username === username)!;
  await page.locator("#username").fill(username);
  await page.locator("#password").fill(user.credentials[0]!.value);
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  if (
    await page
      .getByRole("heading", { name: "Update Account Information" })
      .isVisible()
  ) {
    await page
      .getByRole("textbox", { name: "Email", exact: true })
      .fill(user.email);
    await page.getByRole("button", { name: "Submit", exact: true }).click();
  }
  await expect(page.getByText(`${username} · Private library`)).toBeVisible();
}
async function api(page: Page, path: string, method = "GET", body?: unknown) {
  const identity = (await (await page.request.get("/auth/session")).json()) as {
    csrf: string;
  };
  return page.request.fetch(path, {
    method,
    headers: { "X-ScoreMap-CSRF": identity.csrf },
    ...(body ? { data: body } : {}),
  });
}
async function saveView(page: Page, change: (library: Library) => void) {
  const view = await (await api(page, "/api/library")).json();
  const library = structuredClone(view.library) as Library;
  change(library);
  const response = await api(page, "/api/library", "PUT", {
    library,
    expectedRevision: view.library.revision,
    versions: view.versions,
    commandId: crypto.randomUUID(),
    mode: "edit",
  });
  expect(response.status()).toBe(200);
  return response.json();
}
function syntheticSong(): Song {
  const id = crypto.randomUUID();
  return {
    id,
    title: `Synthetic recovery ${id.slice(0, 8)}`,
    artist: "Synthetic fixture",
    notes: "Original retained cue",
    sections: [
      {
        id: crypto.randomUUID(),
        name: "Bridge",
        repeat: 3,
        notes: "Quiet entry",
        chords: [{ root: "Db", quality: "minor" }],
      },
    ],
    references: [
      {
        id: crypto.randomUUID(),
        title: "Synthetic reference",
        url: "https://example.com/score",
      },
    ],
  };
}
async function openSong(page: Page, title: string) {
  const toggle = page.getByRole("button", {
    name: "Library",
    exact: true,
    includeHidden: true,
  });
  await toggle.waitFor({ state: "attached" });
  if (await toggle.isVisible()) await toggle.click();
  await page.getByRole("button", { name: new RegExp(title) }).click();
}
test("real OIDC, current JSON import, atomic save and a clean second session", async ({
  browser,
}) => {
  const { context, page } = await login(browser, "owner-a");
  const initial = await api(page, "/api/library");
  expect(initial.status()).toBe(200);
  const before = await initial.json();
  const id = crypto.randomUUID();
  const sectionId = crypto.randomUUID();
  const title = `Synthetic trial ${id.slice(0, 8)}`;
  const backup = {
    format: "scoremap-backup",
    version: 1,
    library: {
      schemaVersion: 1,
      revision: 12,
      songs: [
        {
          id,
          title,
          artist: "Synthetic fixture",
          notes: "Imported original note",
          sections: [
            {
              id: sectionId,
              name: "Verse",
              repeat: 2,
              chords: [{ root: "C", quality: "major" }],
              notes: "Original section note",
            },
          ],
          references: [],
        },
      ],
      repertoires: [],
    },
  };
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByLabel("Import backup file").setInputFiles({
    name: "synthetic-current-scoremap.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(backup)),
  });
  await page.getByRole("button", { name: new RegExp(title) }).click();
  await expect(
    page.getByRole("heading", { name: title, exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Saved to your private library", { exact: true }),
  ).toBeVisible();
  const imported = await (await api(page, "/api/library")).json();
  expect(imported.library.songs).toHaveLength(before.library.songs.length + 1);
  expect(
    imported.library.songs.find((s: { id: string }) => s.id === id),
  ).toEqual(backup.library.songs[0]);
  await page
    .getByText("Song details & personal notes", { exact: true })
    .click();
  const notes = page.getByLabel("Song notes", { exact: true });
  await notes.fill("Edited through the real connected UI");
  await notes.blur();
  await expect
    .poll(async () => {
      const view = await (await api(page, "/api/library")).json();
      return view.library.songs.find((s: { id: string }) => s.id === id)?.notes;
    })
    .toBe("Edited through the real connected UI");
  await page.screenshot({
    path: "test-results/connected/private-library.png",
    fullPage: true,
  });
  const axe = await new AxeBuilder({ page }).analyze();
  expect(axe.violations).toEqual([]);
  const second = await login(browser, "owner-a");
  await expect(
    second.page.getByRole("button", { name: new RegExp(title) }),
  ).toBeVisible();
  await second.page.getByRole("button", { name: new RegExp(title) }).click();
  await second.page
    .getByText("Song details & personal notes", { exact: true })
    .click();
  await expect(
    second.page.getByLabel("Song notes", { exact: true }),
  ).toHaveValue("Edited through the real connected UI");
  const stranger = await login(browser, "owner-b");
  const hidden = await (await api(stranger.page, "/api/library")).json();
  expect(hidden.library.songs.some((s: { id: string }) => s.id === id)).toBe(
    false,
  );
  const forged = structuredClone(hidden.library);
  forged.songs.push(backup.library.songs[0]);
  const refused = await api(stranger.page, "/api/library", "PUT", {
    library: forged,
    expectedRevision: hidden.library.revision,
    versions: {},
    commandId: crypto.randomUUID(),
    mode: "edit",
  });
  expect(refused.status()).toBe(409);
  const noCsrf = await page.request.put("/api/library", { data: {} });
  expect(noCsrf.status()).toBe(400);
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(
    page.getByRole("link", { name: "Sign in", exact: true }),
  ).toBeVisible();
  expect((await page.request.get("/api/library")).status()).toBe(401);
  await Promise.all([
    context.close(),
    second.context.close(),
    stranger.context.close(),
  ]);
});

test("song-scoped editor/viewer grants, revocation, versions and retry receipts", async ({
  browser,
}) => {
  const owner = await login(browser, "owner-a");
  const editor = await login(browser, "editor");
  const viewer = await login(browser, "viewer");
  const initial = await (await api(owner.page, "/api/library")).json();
  const id = crypto.randomUUID();
  const title = `Synthetic permissions ${id.slice(0, 8)}`;
  const library = structuredClone(initial.library);
  library.songs.push({
    id,
    title,
    artist: "Synthetic",
    notes: "Initial",
    sections: [],
    references: [],
  });
  const created = await api(owner.page, "/api/library", "PUT", {
    library,
    expectedRevision: initial.library.revision,
    versions: initial.versions,
    commandId: crypto.randomUUID(),
    mode: "edit",
  });
  expect(created.status()).toBe(200);
  await owner.page.reload();
  await owner.page.getByRole("button", { name: new RegExp(title) }).click();
  await owner.page.getByText("Song access", { exact: true }).click();
  async function grant(recipient: Page, role: string) {
    const identity = await (
      await recipient.request.get("/auth/session")
    ).json();
    await owner.page
      .getByLabel("Recipient sharing identity")
      .fill(identity.principal);
    await owner.page
      .getByRole("combobox", { name: "Permission", exact: true })
      .selectOption(role);
    const [ack] = await Promise.all([
      owner.page.waitForResponse(
        (response) =>
          response.url().includes("/grants") &&
          response.request().method() === "PUT",
      ),
      owner.page
        .getByRole("button", { name: "Save access", exact: true })
        .click(),
    ]);
    expect(ack.status()).toBe(204);
    await expect(
      owner.page.getByRole("status").filter({
        hasText: role === "revoke" ? "Access revoked." : "Song access saved.",
      }),
    ).toBeVisible();
  }
  await grant(editor.page, "editor");
  await grant(viewer.page, "viewer");
  await editor.page.reload();
  await editor.page.getByRole("button", { name: new RegExp(title) }).click();
  await viewer.page.reload();
  await viewer.page.getByRole("button", { name: new RegExp(title) }).click();
  await expect(
    viewer.page.getByRole("button", { name: "Delete song", exact: true }),
  ).toHaveCount(0);
  await expect(
    viewer.page.getByLabel("New section", { exact: true }),
  ).toHaveCount(0);
  const visible = await (await api(viewer.page, "/api/library")).json();
  const forbidden = structuredClone(visible.library);
  forbidden.songs.find((s: { id: string }) => s.id === id).notes =
    "Viewer forged update";
  const denied = await api(viewer.page, "/api/library", "PUT", {
    library: forbidden,
    expectedRevision: visible.library.revision,
    versions: visible.versions,
    commandId: crypto.randomUUID(),
    mode: "edit",
  });
  expect(denied.status()).toBe(403);
  const editable = await (await api(editor.page, "/api/library")).json();
  const changed = structuredClone(editable.library);
  changed.songs.find((s: { id: string }) => s.id === id).notes =
    "Acknowledged editor change";
  const command = {
    library: changed,
    expectedRevision: editable.library.revision,
    versions: editable.versions,
    commandId: crypto.randomUUID(),
    mode: "edit",
  };
  const first = await api(editor.page, "/api/library", "PUT", command);
  expect(first.status()).toBe(200);
  const committed = await first.json();
  const retry = await api(editor.page, "/api/library", "PUT", command);
  expect(retry.status()).toBe(200);
  expect(await retry.json()).toEqual(committed);
  const stale = await api(editor.page, "/api/library", "PUT", {
    ...command,
    commandId: crypto.randomUUID(),
  });
  expect(stale.status()).toBe(409);
  const invalid = await api(editor.page, "/api/library", "PUT", {
    ...command,
    commandId: crypto.randomUUID(),
    mode: "performance",
  });
  expect(invalid.status()).toBe(400);
  const verify = await (await api(owner.page, "/api/library")).json();
  expect(
    verify.library.songs.find((s: { id: string }) => s.id === id).notes,
  ).toBe("Acknowledged editor change");
  expect(verify.versions[id]).toBe(committed.versions[id]);
  await grant(editor.page, "revoke");
  const revoked = await (await api(editor.page, "/api/library")).json();
  expect(revoked.library.songs.some((song: Song) => song.id === id)).toBe(
    false,
  );
  const oldReceipt = await api(editor.page, "/api/library", "PUT", command);
  expect(oldReceipt.status()).toBe(403);
  await expect(
    editor.page.getByText("Your session or permissions changed.", {
      exact: false,
    }),
  ).toBeVisible({ timeout: 20000 });
  await Promise.all([
    owner.context.close(),
    editor.context.close(),
    viewer.context.close(),
  ]);
});

test("current-format song history, retained deletion, restore and irreversible purge", async ({
  browser,
}) => {
  const owner = await login(browser, "owner-a");
  const editor = await login(browser, "editor");
  const stranger = await login(browser, "owner-b");
  const song = syntheticSong();
  const repertoireId = crypto.randomUUID();
  await saveView(owner.page, (library) => {
    library.songs.push(song);
    library.repertoires.push({
      id: repertoireId,
      title: "Synthetic recovery set",
      songIds: [song.id],
    });
  });
  await saveView(owner.page, (library) => {
    library.songs.find((s) => s.id === song.id)!.notes = "Newer saved cue";
  });
  const editorIdentity = await (
    await editor.page.request.get("/auth/session")
  ).json();
  expect(
    (
      await api(owner.page, `/api/songs/${song.id}/grants`, "PUT", {
        principal: editorIdentity.principal,
        role: "editor",
        mode: "edit",
      })
    ).status(),
  ).toBe(204);
  expect(
    (await api(editor.page, `/api/songs/${song.id}/history`)).status(),
  ).toBe(200);
  expect(
    (await api(stranger.page, `/api/songs/${song.id}/history`)).status(),
  ).toBe(403);
  await owner.page.reload();
  await openSong(owner.page, song.title);
  await owner.page.getByText("Song history", { exact: true }).click();
  await owner.page
    .locator("summary")
    .filter({ hasText: /^Version 1 ·/ })
    .click();
  owner.page.once("dialog", (dialog) => dialog.accept());
  await owner.page
    .getByRole("button", { name: "Restore version 1", exact: true })
    .click();
  await expect
    .poll(
      async () =>
        (await (await api(owner.page, "/api/library")).json()).versions[
          song.id
        ],
    )
    .toBe(3);
  const restored = await (await api(owner.page, "/api/library")).json();
  expect(restored.library.songs.find((s: Song) => s.id === song.id)).toEqual(
    song,
  );
  expect(
    (await (await api(owner.page, `/api/songs/${song.id}/history`)).json()).map(
      (entry: { revision: number }) => entry.revision,
    ),
  ).toEqual([3, 2, 1]);
  owner.page.once("dialog", (dialog) => dialog.accept());
  await owner.page
    .getByRole("button", { name: "Delete song", exact: true })
    .click();
  await expect
    .poll(
      async () =>
        (await (await api(owner.page, "/api/library")).json()).versions[
          song.id
        ],
    )
    .toBeUndefined();
  expect(
    (await api(editor.page, `/api/songs/${song.id}/history`)).status(),
  ).toBe(403);
  expect(
    (await (await api(editor.page, "/api/trash")).json()).some(
      (s: Song) => s.id === song.id,
    ),
  ).toBe(false);
  const restoreCommand = {
    expectedRevision: 4,
    commandId: crypto.randomUUID(),
    mode: "edit",
    confirmed: true,
  };
  expect(
    (
      await api(
        editor.page,
        `/api/songs/${song.id}/restore`,
        "POST",
        restoreCommand,
      )
    ).status(),
  ).toBe(403);
  expect(
    (
      await api(owner.page, `/api/songs/${song.id}/restore`, "POST", {
        ...restoreCommand,
        confirmed: false,
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await api(owner.page, `/api/songs/${song.id}/restore`, "POST", {
        ...restoreCommand,
        mode: "performance",
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await api(owner.page, `/api/songs/${song.id}/restore`, "POST", {
        ...restoreCommand,
        expectedRevision: 3,
      })
    ).status(),
  ).toBe(409);
  await owner.page.getByText("Deleted songs", { exact: true }).click();
  const deleted = owner.page.getByRole("region", {
    name: `Deleted song ${song.title}`,
    exact: true,
  });
  await expect(deleted).toBeVisible();
  owner.page.once("dialog", (dialog) => dialog.accept());
  await deleted
    .getByRole("button", { name: "Restore song", exact: true })
    .click();
  await expect(deleted).toHaveCount(0);
  const after = await (await api(owner.page, "/api/library")).json();
  expect(after.versions[song.id]).toBe(5);
  expect(after.library.songs.find((s: Song) => s.id === song.id)).toEqual(song);
  expect(
    after.library.repertoires.find((r: { id: string }) => r.id === repertoireId)
      .songIds,
  ).toEqual([]);
  expect(
    (await api(editor.page, `/api/songs/${song.id}/history`)).status(),
  ).toBe(403);
  expect(
    (
      await api(owner.page, `/api/songs/${song.id}/purge`, "POST", {
        ...restoreCommand,
        commandId: crypto.randomUUID(),
        expectedRevision: 5,
        confirmation: song.title,
      })
    ).status(),
  ).toBe(400);
  await saveView(owner.page, (library) => {
    library.songs = library.songs.filter((s) => s.id !== song.id);
  });
  const beforePurge = await (await api(owner.page, "/api/library")).json();
  const purgeCommand = {
    expectedRevision: 6,
    commandId: crypto.randomUUID(),
    mode: "edit",
    confirmed: true,
    confirmation: song.title,
  };
  expect(
    (
      await api(owner.page, `/api/songs/${song.id}/purge`, "POST", {
        ...purgeCommand,
        confirmation: "Wrong title",
      })
    ).status(),
  ).toBe(400);
  const purge = await api(
    owner.page,
    `/api/songs/${song.id}/purge`,
    "POST",
    purgeCommand,
  );
  expect(purge.status()).toBe(200);
  const acknowledgement = await purge.json();
  expect(acknowledgement).toEqual({
    commandId: purgeCommand.commandId,
    songId: song.id,
    revision: 7,
    retention: "purged",
  });
  const retry = await api(
    owner.page,
    `/api/songs/${song.id}/purge`,
    "POST",
    purgeCommand,
  );
  expect(retry.status()).toBe(200);
  expect(await retry.json()).toEqual(acknowledgement);
  expect(
    (await api(owner.page, `/api/songs/${song.id}/history`)).status(),
  ).toBe(403);
  expect(
    (
      await api(owner.page, `/api/songs/${song.id}/restore`, "POST", {
        ...restoreCommand,
        commandId: crypto.randomUUID(),
        expectedRevision: 7,
      })
    ).status(),
  ).toBe(409);
  const resurrection = await api(owner.page, "/api/library", "PUT", {
    library: {
      ...beforePurge.library,
      songs: [...beforePurge.library.songs, song],
    },
    expectedRevision: beforePurge.library.revision,
    versions: beforePurge.versions,
    commandId: crypto.randomUUID(),
    mode: "edit",
    import: true,
  });
  expect(resurrection.status()).toBe(409);
  expect(await (await api(owner.page, "/api/library")).json()).toEqual(
    beforePurge,
  );
  await Promise.all([
    owner.context.close(),
    editor.context.close(),
    stranger.context.close(),
  ]);
});

test("protected pending work survives logout, refuses another account and recovers explicitly on a narrow touch screen", async ({
  browser,
}) => {
  const owner = await login(browser, "owner-a", {
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const song = syntheticSong();
  await saveView(owner.page, (library) => {
    library.songs.push(song);
  });
  await owner.page.reload();
  await openSong(owner.page, song.title);
  await owner.page
    .getByText("Song details & personal notes", { exact: true })
    .click();
  const note = `Protected unacknowledged draft ${crypto.randomUUID()}`;
  await owner.page.route("**/api/library", async (route) => {
    if (route.request().method() === "PUT") await route.abort("failed");
    else await route.continue();
  });
  await owner.page.getByLabel("Song notes", { exact: true }).fill(note);
  await owner.page.getByLabel("Song notes", { exact: true }).blur();
  await expect(
    owner.page.getByText("Unsaved changes", { exact: true }),
  ).toBeVisible();
  const persisted = await owner.page.evaluate(async () => {
    const request = indexedDB.open("scoremap-protected-pending", 1);
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const all = db.transaction("pending").objectStore("pending").getAll();
    const records = await new Promise<Record<string, unknown>[]>(
      (resolve, reject) => {
        all.onsuccess = () => resolve(all.result);
        all.onerror = () => reject(all.error);
      },
    );
    db.close();
    return records.map((record) => ({
      fields: Object.keys(record).sort(),
      encrypted:
        record.cipher instanceof ArrayBuffer && record.cipher.byteLength > 32,
      text: JSON.stringify(record),
      keyId: record.keyId,
    }));
  });
  expect(persisted).toHaveLength(1);
  expect(persisted[0]!.fields).toEqual(["cipher", "commandId", "iv", "keyId"]);
  expect(persisted[0]!.encrypted).toBe(true);
  expect(persisted[0]!.text).not.toContain(note);
  const ownerKey = persisted[0]!.keyId;
  await owner.page.unroute("**/api/library");
  owner.page.once("dialog", (dialog) => dialog.accept());
  await owner.page
    .getByRole("button", { name: "Sign out", exact: true })
    .click();
  await expect(
    owner.page.getByRole("link", { name: "Sign in", exact: true }),
  ).toBeVisible();
  await expect(
    owner.page.getByLabel("Song notes", { exact: true }),
  ).toHaveCount(0);
  await signIn(owner.page, "owner-b");
  expect(
    (
      await api(
        owner.page,
        `/api/recovery-keys/${String(ownerKey)}/unlock`,
        "POST",
      )
    ).status(),
  ).toBe(403);
  await expect(owner.page.getByText(song.title, { exact: true })).toHaveCount(
    0,
  );
  await expect(
    owner.page.getByRole("button", {
      name: "Export pending work to compare",
      exact: true,
    }),
  ).toHaveCount(0);
  await owner.page
    .getByRole("button", { name: "Sign out", exact: true })
    .click();
  await expect(
    owner.page.getByRole("link", { name: "Sign in", exact: true }),
  ).toBeVisible();
  await signIn(owner.page, "owner-a");
  const [download] = await Promise.all([
    owner.page.waitForEvent("download"),
    owner.page
      .getByRole("button", {
        name: "Export pending work to compare",
        exact: true,
      })
      .click(),
  ]);
  const content = JSON.parse(await readFile((await download.path())!, "utf8"));
  expect(content.library.songs.find((s: Song) => s.id === song.id).notes).toBe(
    note,
  );
  expect(
    (await (await api(owner.page, "/api/library")).json()).library.songs.find(
      (s: Song) => s.id === song.id,
    ).notes,
  ).toBe(song.notes);
  expect(
    await owner.page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(
    (await new AxeBuilder({ page: owner.page }).analyze()).violations,
  ).toEqual([]);
  await owner.context.close();
});

test("disabled credentials, unauthenticated routes, callback state and server-only session tokens", async ({
  browser,
}) => {
  const anonymous = await browser.newContext();
  const page = await anonymous.newPage();
  await page.goto("/");
  expect((await page.request.get("/api/library")).status()).toBe(401);
  expect((await page.request.get("/api/songs/guessed/history")).status()).toBe(
    401,
  );
  expect((await page.request.post("/auth/logout")).status()).toBe(401);
  const invalid = await page.request.get(
    "/signin-oidc?code=forged&state=untrusted",
    { maxRedirects: 0 },
  );
  expect(invalid.status()).toBe(400);
  expect(await (await page.request.get("/auth/session")).json()).toEqual({
    authenticated: false,
  });
  await page.getByRole("link", { name: "Sign in", exact: true }).click();
  const disabled = fixture.users.find((user) => user.username === "disabled")!;
  await page.locator("#username").fill(disabled.username);
  await page.locator("#password").fill(disabled.credentials[0]!.value);
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await expect(
    page.getByText("Account is disabled, contact your administrator.", {
      exact: true,
    }),
  ).toBeVisible();
  expect(
    (await page.request.get("http://localhost:5280/api/library")).status(),
  ).toBe(401);
  await anonymous.close();
  const owner = await login(browser, "owner-a");
  const cookies = await owner.context.cookies("http://localhost:5280");
  const session = cookies.find((cookie) => cookie.name === "scoremap.session")!;
  expect(session.httpOnly).toBe(true);
  expect(session.sameSite).toBe("Lax");
  expect(await owner.page.evaluate(() => document.cookie)).not.toContain(
    "scoremap.session",
  );
  const browserStorage = await owner.page.evaluate(() =>
    JSON.stringify({
      local: { ...localStorage },
      session: { ...sessionStorage },
    }),
  );
  expect(browserStorage).not.toMatch(
    /access_token|refresh_token|id_token|eyJ[A-Za-z0-9_-]{12,}\./u,
  );
  const identityResponse = await owner.page.request.get("/auth/session");
  expect(
    (identityResponse.headers()["cache-control"] ?? "").split(/,\s*/u),
  ).toContain("no-store");
  expect((await api(owner.page, "/api/no-such-route")).status()).toBe(404);
  const identity = await identityResponse.json();
  const forgedOrigin = await owner.page.request.put("/api/library", {
    headers: {
      Origin: "https://untrusted.example.invalid",
      "X-ScoreMap-CSRF": identity.csrf,
    },
    data: {},
  });
  expect(forgedOrigin.status()).toBe(403);
  await owner.context.close();
});

test("restore/purge serialize and a failed multi-song transaction rolls back earlier inserts", async ({
  browser,
}) => {
  const owner = await login(browser, "owner-a");
  const song = syntheticSong();
  await saveView(owner.page, (library) => {
    library.songs.push(song);
  });
  await saveView(owner.page, (library) => {
    library.songs = library.songs.filter((s) => s.id !== song.id);
  });
  const restore = {
    expectedRevision: 2,
    commandId: crypto.randomUUID(),
    mode: "edit",
    confirmed: true,
  };
  const purge = {
    ...restore,
    commandId: crypto.randomUUID(),
    confirmation: song.title,
  };
  const [restored, purged] = await Promise.all([
    api(owner.page, `/api/songs/${song.id}/restore`, "POST", restore),
    api(owner.page, `/api/songs/${song.id}/purge`, "POST", purge),
  ]);
  expect([restored.status(), purged.status()].sort()).toEqual([200, 409]);
  if (restored.status() === 200) {
    const active = await (await api(owner.page, "/api/library")).json();
    expect(active.library.songs.find((s: Song) => s.id === song.id)).toEqual(
      song,
    );
    expect(active.versions[song.id]).toBe(3);
    await saveView(owner.page, (library) => {
      library.songs = library.songs.filter((s) => s.id !== song.id);
    });
    expect(
      (
        await api(owner.page, `/api/songs/${song.id}/purge`, "POST", {
          ...purge,
          commandId: crypto.randomUUID(),
          expectedRevision: 4,
        })
      ).status(),
    ).toBe(200);
  }
  const before = await (await api(owner.page, "/api/library")).json();
  const firstInsert = syntheticSong();
  const command = {
    library: {
      ...before.library,
      songs: [...before.library.songs, firstInsert, song],
    },
    expectedRevision: before.library.revision,
    versions: before.versions,
    commandId: crypto.randomUUID(),
    mode: "edit",
  };
  expect((await api(owner.page, "/api/library", "PUT", command)).status()).toBe(
    409,
  );
  expect(await (await api(owner.page, "/api/library")).json()).toEqual(before);
  expect(
    (await api(owner.page, `/api/songs/${firstInsert.id}/history`)).status(),
  ).toBe(403);
  expect(
    (await api(owner.page, `/api/songs/${song.id}/history`)).status(),
  ).toBe(403);
  await owner.context.close();
});
