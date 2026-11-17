import { test, expect, type Page, type Browser } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFile } from "node:fs/promises";
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
async function login(browser: Browser, username: string) {
  const context = await browser.newContext();
  const page = await context.newPage();
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
  return { context, page };
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
  expect(revoked.library.songs).toEqual([]);
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
