import { test, expect } from "@playwright/test";
import { api, login, openSong, saveView, syntheticSong } from "./helpers";
import { richRevision, grant, protectedDigest } from "./canonical-fixtures";

test("SB-ISOLATION: an independent actual owner cannot read a guessed nested arrangement; both owners' complete resources remain unchanged", async ({
  browser,
}) => {
  const owner = await login(browser, "owner-a"),
    other = await login(browser, "owner-b");
  const { song } = await richRevision(owner.page, 1);
  await saveView(other.page, (library) => {
    library.songs.push(syntheticSong());
  });
  const before = await (await api(owner.page, "/api/library")).json();
  const otherBefore = await (await api(other.page, "/api/library")).json();
  const history = await (
    await api(owner.page, `/api/songs/${song.id}/history`)
  ).json();
  const path = `/api/songs/${song.id}/arrangements/${song.arrangements[0]!.id}`;
  expect(await (await api(owner.page, path)).json()).toEqual(
    song.arrangements[0],
  );
  const refused = await api(other.page, path);
  const absent = await api(
    other.page,
    `/api/songs/${crypto.randomUUID()}/arrangements/${crypto.randomUUID()}`,
  );
  expect(refused.status()).toBe(404);
  const refusedBody = await refused.json(),
    absentBody = await absent.json();
  expect(typeof refusedBody.traceId).toBe("string");
  delete refusedBody.traceId;
  delete absentBody.traceId;
  expect(refusedBody).toEqual(absentBody);
  expect(JSON.stringify(refusedBody)).not.toContain(song.title);
  expect(await (await api(owner.page, "/api/library")).json()).toEqual(before);
  expect(await (await api(other.page, "/api/library")).json()).toEqual(
    otherBefore,
  );
  expect(
    await (await api(owner.page, `/api/songs/${song.id}/history`)).json(),
  ).toEqual(history);
  await owner.context.close();
  await other.context.close();
});

test("SB-ROLE-REVOKE: a protected performed-note write based on actual revision 21 refuses after an acknowledged editor-to-viewer downgrade", async ({
  browser,
}) => {
  const owner = await login(browser, "owner-a"),
    editor = await login(browser, "editor");
  const { song, view } = await richRevision(owner.page, 21);
  await grant(owner.page, editor.page, song.id, "editor");
  const notation = await (
    await api(editor.page, "/api/preferences/notation")
  ).json();
  expect(
    (
      await api(editor.page, "/api/preferences/notation", "PUT", {
        mode: "anglo",
        primary: "anglo",
        expectedRevision: notation.revision,
        commandId: crypto.randomUUID(),
      })
    ).status(),
  ).toBe(200);
  await editor.page.reload();
  await openSong(editor.page, song.title);
  let release!: () => void, requested!: () => void;
  const held = new Promise<void>((done) => {
    release = done;
  });
  const ready = new Promise<void>((done) => {
    requested = done;
  });
  let status = 0;
  await editor.page.route("**/api/library", async (route) => {
    if (route.request().method() !== "PUT") return route.continue();
    expect(route.request().postDataJSON().versions[song.id]).toBe(21);
    requested();
    await held;
    const response = await route.fetch();
    status = response.status();
    await route.fulfill({ response }).catch(() => undefined);
  });
  const history = await (
    await api(owner.page, `/api/songs/${song.id}/history`)
  ).json();
  try {
    await editor.page
      .getByLabel("Active performed part", { exact: true })
      .selectOption(song.arrangements[0]!.parts[1]!.id);
    const builder = editor.page.getByRole("region", {
      name: "Played-note builder for Right",
      exact: true,
    });
    await builder
      .getByRole("button", { name: "Raise B4 one octave", exact: true })
      .click();
    await builder
      .getByRole("button", { name: "Apply played notes", exact: true })
      .click();
    await ready;
    const protectedBefore = await protectedDigest(editor.page);
    expect(protectedBefore).toHaveLength(1);
    const keyPath = `/api/recovery-keys/${protectedBefore[0]!.keyId}/unlock`;
    expect((await api(editor.page, keyPath, "POST")).status()).toBe(200);
    const issued = await api(editor.page, "/api/offline-lease", "POST", {
      songIds: [song.id],
    });
    expect(issued.status()).toBe(200);
    const offlineKeyPath = `/api/recovery-keys/${(await issued.json()).keys.songs.id}/unlock`;
    await grant(owner.page, editor.page, song.id, "viewer");
    release();
    await expect.poll(() => status).toBe(403);
    await expect(
      editor.page.getByText("Your session or permissions changed.", {
        exact: false,
      }),
    ).toBeVisible();
    expect(await protectedDigest(editor.page)).toEqual(protectedBefore);
    expect((await api(editor.page, keyPath, "POST")).status()).toBe(403);
    expect((await api(editor.page, offlineKeyPath, "POST")).status()).toBe(403);
    const readable = await (await api(editor.page, "/api/library")).json();
    expect(readable.capabilities[song.id]).toBe("viewer");
    expect(readable.versions[song.id]).toBe(21);
    expect(
      readable.library.songs.find(
        (value: { id: string }) => value.id === song.id,
      ),
    ).toEqual(song);
    expect(await (await api(owner.page, "/api/library")).json()).toEqual(view);
    expect(
      await (await api(owner.page, `/api/songs/${song.id}/history`)).json(),
    ).toEqual(history);
  } finally {
    release();
    await editor.context.close();
    await owner.context.close();
  }
});
