import { test, expect } from "@playwright/test";
import { api, login, signIn, saveView, syntheticSong } from "./helpers";

test("personal key purpose and owner remain separate from revoked song grants, and personal keys cannot authorize a song commit", async ({
  browser,
}) => {
  const owner = await login(browser, "owner-a");
  const editor = await login(browser, "editor");
  const other = await login(browser, "owner-b");
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
  const songKey = await (
    await api(editor.page, "/api/recovery-keys", "POST")
  ).json();
  const personalKey = await (
    await api(editor.page, "/api/personal-recovery-keys", "POST")
  ).json();
  expect(personalKey.id).toMatch(/^[0-9a-f-]{36}$/);
  expect(
    (
      await api(
        editor.page,
        `/api/recovery-keys/${personalKey.id}/unlock`,
        "POST",
      )
    ).status(),
  ).toBe(403);
  expect(
    (
      await api(
        editor.page,
        `/api/personal-recovery-keys/${songKey.id}/unlock`,
        "POST",
      )
    ).status(),
  ).toBe(403);
  expect(
    (
      await api(
        other.page,
        `/api/personal-recovery-keys/${personalKey.id}/unlock`,
        "POST",
      )
    ).status(),
  ).toBe(403);
  expect(
    (
      await api(owner.page, `/api/songs/${song.id}/grants`, "PUT", {
        principal,
        role: null,
        mode: "edit",
      })
    ).status(),
  ).toBe(204);
  expect(
    (
      await api(editor.page, `/api/recovery-keys/${songKey.id}/unlock`, "POST")
    ).status(),
  ).toBe(403);
  const unlocked = await api(
    editor.page,
    `/api/personal-recovery-keys/${personalKey.id}/unlock`,
    "POST",
  );
  expect(unlocked.status()).toBe(200);
  expect((await unlocked.json()).key).toBe(personalKey.key);
  const before = await (await api(editor.page, "/api/library")).json();
  expect(
    (
      await api(editor.page, "/api/library", "PUT", {
        library: before.library,
        versions: before.versions,
        expectedRevision: before.library.revision,
        commandId: crypto.randomUUID(),
        recoveryKeyId: personalKey.id,
        mode: "edit",
      })
    ).status(),
  ).toBe(400);
  expect(await (await api(editor.page, "/api/library")).json()).toEqual(before);
  expect(
    (
      await api(
        editor.page,
        `/api/personal-recovery-keys/${personalKey.id}`,
        "DELETE",
      )
    ).status(),
  ).toBe(204);
  expect(
    (
      await api(
        editor.page,
        `/api/personal-recovery-keys/${personalKey.id}/unlock`,
        "POST",
      )
    ).status(),
  ).toBe(403);
  await Promise.all([
    owner.context.close(),
    editor.context.close(),
    other.context.close(),
  ]);
});

test("an encrypted personal preference survives lost acknowledgement and account switching, then explicitly reconciles without changing music", async ({
  browser,
}) => {
  const owner = await login(browser, "owner-a", {
    viewport: { width: 390, height: 844 },
    hasTouch: true,
  });
  const original = await (
    await api(owner.page, "/api/preferences/notation")
  ).json();
  if (original.mode !== "anglo")
    expect(
      (
        await api(owner.page, "/api/preferences/notation", "PUT", {
          mode: "anglo",
          primary: "anglo",
          expectedRevision: original.revision,
          commandId: crypto.randomUUID(),
        })
      ).status(),
    ).toBe(200);
  await owner.page.reload();
  const before = await (await api(owner.page, "/api/library")).json();
  const initial = await (
    await api(owner.page, "/api/preferences/notation")
  ).json();
  let originalCommand = "";
  await owner.page.route("**/api/preferences/notation", async (route) => {
    if (route.request().method() !== "PUT") return route.continue();
    originalCommand = route.request().postDataJSON().commandId;
    const response = await route.fetch();
    expect(response.status()).toBe(200);
    await route.abort("failed");
  });
  await owner.page
    .getByLabel("Note names", { exact: true })
    .selectOption("latin");
  await expect(
    owner.page.getByText("Note-name choice not saved", { exact: true }),
  ).toBeVisible();
  const panel = owner.page.getByRole("region", {
    name: "Protected personal changes",
  });
  await expect(panel).toBeVisible();
  const rows = await owner.page.evaluate(async () => {
    const open = indexedDB.open("scoremap-protected-personal", 1);
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      open.onsuccess = () => resolve(open.result);
      open.onerror = () => reject(open.error);
    });
    const all = db.transaction("pending").objectStore("pending").getAll();
    const values = await new Promise<{ cipher: ArrayBuffer; keyId: string }[]>(
      (resolve, reject) => {
        all.onsuccess = () => resolve(all.result);
        all.onerror = () => reject(all.error);
      },
    );
    db.close();
    return values.map((value) => ({
      fields: Object.keys(value).sort(),
      cipher: value.cipher instanceof ArrayBuffer,
      plaintext: JSON.stringify(value).includes("latin"),
    }));
  });
  expect(rows).toHaveLength(1);
  expect(rows[0]!.cipher).toBe(true);
  expect(rows[0]!.plaintext).toBe(false);
  expect(rows[0]!.fields).toEqual([
    "cipher",
    "commandId",
    "iv",
    "keyId",
    "requestHash",
  ]);
  await owner.page.unroute("**/api/preferences/notation");
  owner.page.once("dialog", (dialog) => dialog.accept());
  await owner.page
    .getByRole("button", { name: "Sign out", exact: true })
    .click();
  await expect(
    owner.page.getByRole("link", { name: "Sign in", exact: true }),
  ).toBeVisible();
  await signIn(owner.page, "owner-b");
  await expect(panel).toHaveCount(0);
  await owner.page
    .getByRole("button", { name: "Sign out", exact: true })
    .click();
  await expect(
    owner.page.getByRole("link", { name: "Sign in", exact: true }),
  ).toBeVisible();
  await signIn(owner.page, "owner-a");
  await expect(panel).toBeVisible();
  const saved = await (
    await api(owner.page, "/api/preferences/notation")
  ).json();
  expect(saved).toEqual({
    mode: "latin",
    primary: "latin",
    revision: initial.revision + 1,
  });
  await panel
    .getByRole("button", { name: "Review personal draft 1", exact: true })
    .click();
  await expect(panel.getByLabel("Personal draft comparison")).toContainText(
    originalCommand,
  );
  const [download] = await Promise.all([
    owner.page.waitForEvent("download"),
    panel
      .getByRole("button", {
        name: "Export personal draft for comparison",
        exact: true,
      })
      .click(),
  ]);
  expect(download.suggestedFilename()).toBe("scoremap-personal-draft.json");
  const sent = owner.page.waitForRequest(
    (request) =>
      new URL(request.url()).pathname === "/api/preferences/notation" &&
      request.method() === "PUT",
  );
  await panel
    .getByRole("button", {
      name: "Retry original personal change and reopen",
      exact: true,
    })
    .click();
  expect((await sent).postDataJSON().commandId).toBe(originalCommand);
  await expect(panel).toHaveCount(0);
  expect(
    await (await api(owner.page, "/api/preferences/notation")).json(),
  ).toEqual(saved);
  expect(await (await api(owner.page, "/api/library")).json()).toEqual(before);
  await expect(
    owner.page.getByLabel("Note names", { exact: true }),
  ).toHaveValue("latin");
  await owner.context.close();
});
