import { test, expect, type Page } from "@playwright/test";
import { api, login, saveView, syntheticSong } from "./helpers";
import { richRevision, grant } from "./canonical-fixtures";
import type { RichSong } from "../../src/features/library/score";
import type { Library } from "../../src/features/library/domain";
async function resources(page: Page) {
  return Promise.all(
    [
      "/api/preferences/notation",
      "/api/voicing-presets",
      "/api/device-configurations",
    ].map(async (path) => (await api(page, path)).json()),
  );
}
async function deleteSeventeen(page: Page, song: RichSong) {
  const before = await (await api(page, "/api/library")).json();
  expect(before.versions[song.id]).toBe(17);
  const prior = await (await api(page, `/api/songs/${song.id}/history`)).json();
  const command = {
    library: {
      ...before.library,
      songs: before.library.songs.filter(
        (value: { id: string }) => value.id !== song.id,
      ),
      repertoires: before.library.repertoires.map(
        (value: Library["repertoires"][number]) => ({
          ...value,
          songIds: value.songIds.filter((id) => id !== song.id),
        }),
      ),
    },
    expectedRevision: before.library.revision,
    versions: before.versions,
    commandId: crypto.randomUUID(),
    mode: "edit",
  };
  const response = await api(page, "/api/library", "PUT", command);
  expect(response.status()).toBe(200);
  const deleted = await response.json();
  const history = await (
    await api(page, `/api/songs/${song.id}/history`)
  ).json();
  expect(history[0]).toMatchObject({
    revision: 18,
    content: song,
    deleted: true,
    operation: "delete",
    baseRevision: 17,
    commandId: command.commandId,
  });
  expect(history.slice(1)).toEqual(prior);
  expect(
    await (await api(page, "/api/library", "PUT", command)).json(),
  ).toEqual(deleted);
  expect(
    await (await api(page, `/api/songs/${song.id}/history`)).json(),
  ).toEqual(history);
  return { deleted, history };
}
async function restoreEighteen(page: Page, song: RichSong) {
  const command = {
    expectedRevision: 18,
    commandId: crypto.randomUUID(),
    mode: "edit",
    confirmed: true,
  };
  const response = await api(
    page,
    `/api/songs/${song.id}/restore`,
    "POST",
    command,
  );
  expect(response.status()).toBe(200);
  const receipt = await response.json();
  expect(
    await (
      await api(page, `/api/songs/${song.id}/restore`, "POST", command)
    ).json(),
  ).toEqual(receipt);
  const restored = await (await api(page, "/api/library")).json();
  expect(restored.versions[song.id]).toBe(19);
  expect(
    restored.library.songs.find(
      (value: { id: string }) => value.id === song.id,
    ),
  ).toEqual(song);
  return restored;
}

test("SB-SONG-RETAIN SB-SONG-RESTORE: complete independent rich arrangements delete 17→18 and restore 18→19 into an empty real owner's library without reviving grants or memberships", async ({
  browser,
}) => {
  const owner = await login(browser, "viewer"),
    editor = await login(browser, "editor"),
    viewer = await login(browser, "owner-b"),
    priorOwner = await login(browser, "owner-a");
  // This actor is exclusively synthetic. Remove old fixture grants/owned active fixtures so EMPTY is an actual service precondition.
  const current = await (await api(owner.page, "/api/library")).json();
  for (const song of current.library.songs as { id: string }[]) {
    if (current.capabilities[song.id] === "owner") continue;
    let removed = false;
    for (const controller of [priorOwner.page, editor.page, viewer.page]) {
      const view = await (await api(controller, "/api/library")).json();
      if (view.capabilities[song.id] === "owner") {
        await grant(controller, owner.page, song.id, null);
        removed = true;
        break;
      }
    }
    expect(removed).toBe(true);
  }
  await saveView(owner.page, (library) => {
    library.songs = [];
    library.repertoires = library.repertoires.map((value) => ({
      ...value,
      songIds: [],
    }));
  });
  expect(
    (await (await api(owner.page, "/api/library")).json()).library.songs,
  ).toEqual([]);
  const { song } = await richRevision(owner.page, 17);
  const repertoire = crypto.randomUUID();
  await saveView(owner.page, (library) => {
    library.repertoires.push({
      id: repertoire,
      title: "Retained empty-library repertoire",
      songIds: [song.id],
    });
  });
  await grant(owner.page, editor.page, song.id, "editor");
  await grant(owner.page, viewer.page, song.id, "viewer");
  const personal = await resources(owner.page);
  const { deleted, history } = await deleteSeventeen(owner.page, song);
  expect(deleted.library.songs).toEqual([]);
  expect(
    (await api(editor.page, `/api/songs/${song.id}/history`)).status(),
  ).toBe(403);
  expect(
    (
      await api(
        viewer.page,
        `/api/songs/${song.id}/arrangements/${song.arrangements[0]!.id}`,
      )
    ).status(),
  ).toBe(404);
  const trash = await (await api(owner.page, "/api/trash")).json();
  expect(
    trash.find((value: { id: string }) => value.id === song.id),
  ).toMatchObject({ id: song.id, revision: 18 });
  const restored = await restoreEighteen(owner.page, song);
  expect(restored.library.songs).toEqual([song]);
  expect(
    restored.library.repertoires.find(
      (value: { id: string }) => value.id === repertoire,
    ).songIds,
  ).toEqual([]);
  const afterHistory = await (
    await api(owner.page, `/api/songs/${song.id}/history`)
  ).json();
  expect(afterHistory[0]).toMatchObject({
    revision: 19,
    content: song,
    deleted: false,
    operation: "restore",
    baseRevision: 18,
  });
  expect(afterHistory.slice(1)).toEqual(history);
  expect(
    (await api(editor.page, `/api/songs/${song.id}/history`)).status(),
  ).toBe(403);
  expect(
    (await api(viewer.page, `/api/songs/${song.id}/history`)).status(),
  ).toBe(403);
  expect(await resources(owner.page)).toEqual(personal);
  await Promise.all([
    owner.context.close(),
    editor.context.close(),
    viewer.context.close(),
    priorOwner.context.close(),
  ]);
});

test("SB-LIBRARY-RESTORE: a full rich Song restores 18→19 into a populated private library without changing its surviving song, history, memberships or personal resources", async ({
  browser,
}) => {
  const owner = await login(browser, "owner-a");
  const survivor = syntheticSong();
  await saveView(owner.page, (library) => {
    library.songs.push(survivor);
    library.repertoires.push({
      id: crypto.randomUUID(),
      title: "Surviving membership",
      songIds: [survivor.id],
    });
  });
  const { song } = await richRevision(owner.page, 17);
  const personal = await resources(owner.page);
  const survivorHistory = await (
    await api(owner.page, `/api/songs/${survivor.id}/history`)
  ).json();
  const { deleted, history } = await deleteSeventeen(owner.page, song);
  expect(deleted.library.songs).toContainEqual(survivor);
  const restored = await restoreEighteen(owner.page, song);
  expect(
    restored.library.songs.filter(
      (value: { id: string }) => value.id !== song.id,
    ),
  ).toEqual(deleted.library.songs);
  expect(restored.library.repertoires).toEqual(deleted.library.repertoires);
  expect(
    (
      await (await api(owner.page, `/api/songs/${song.id}/history`)).json()
    ).slice(1),
  ).toEqual(history);
  expect(
    await (await api(owner.page, `/api/songs/${survivor.id}/history`)).json(),
  ).toEqual(survivorHistory);
  expect(await resources(owner.page)).toEqual(personal);
  await owner.context.close();
});

test("SB-SONG-PURGE: separately named irreversible confirmation purges complete retained revision 18 while preserving an active song and independent personal resources", async ({
  browser,
}) => {
  const owner = await login(browser, "owner-a");
  const survivor = syntheticSong();
  await saveView(owner.page, (library) => {
    library.songs.push(survivor);
  });
  const configurationId = crypto.randomUUID();
  expect(
    (
      await api(owner.page, "/api/device-configurations", "POST", {
        operation: "save",
        id: configurationId,
        expectedRevision: 0,
        commandId: crypto.randomUUID(),
        mode: "edit",
        content: {
          id: configurationId,
          name: "Purge-independent keyboard",
          instrument: "keyboard",
          range: [21, 108],
        },
      })
    ).status(),
  ).toBe(200);
  const presetId = crypto.randomUUID();
  expect(
    (
      await api(owner.page, "/api/voicing-presets", "POST", {
        operation: "save",
        id: presetId,
        expectedRevision: 0,
        commandId: crypto.randomUUID(),
        mode: "edit",
        content: {
          id: presetId,
          name: "Purge-independent voicing",
          harmony: { root: "Db", quality: "major" },
          pitches: [
            { spelling: "Db", octave: 3, midi: 49 },
            { spelling: "F", octave: 3, midi: 53 },
            { spelling: "Ab", octave: 3, midi: 56 },
          ],
          custom: false,
        },
      })
    ).status(),
  ).toBe(200);
  const { song } = await richRevision(owner.page, 17);
  const personal = await resources(owner.page);
  const { deleted } = await deleteSeventeen(owner.page, song);
  const survivorHistory = await (
    await api(owner.page, `/api/songs/${survivor.id}/history`)
  ).json();
  await owner.page.reload();
  await owner.page.getByText("Deleted songs", { exact: true }).click();
  const retained = owner.page.getByRole("region", {
    name: `Deleted song ${song.title}`,
    exact: true,
  });
  owner.page.once("dialog", async (dialog) => {
    expect(dialog.message()).toContain("ALL its saved musical history");
    expect(dialog.message()).toContain(song.title);
    await dialog.accept(song.title);
  });
  const completed = owner.page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === `/api/songs/${song.id}/purge` &&
      response.request().method() === "POST",
  );
  await retained
    .getByRole("button", { name: "Remove permanently", exact: true })
    .click();
  const response = await completed;
  expect(response.status()).toBe(200);
  const command = response.request().postDataJSON();
  expect(command.expectedRevision).toBe(18);
  const receipt = await response.json();
  expect(receipt).toEqual({
    commandId: command.commandId,
    songId: song.id,
    revision: 19,
    retention: "purged",
  });
  expect(JSON.stringify(receipt)).not.toContain(song.title);
  expect(
    await (
      await api(owner.page, `/api/songs/${song.id}/purge`, "POST", command)
    ).json(),
  ).toEqual(receipt);
  expect(
    (await api(owner.page, `/api/songs/${song.id}/history`)).status(),
  ).toBe(403);
  expect(
    (
      await api(owner.page, `/api/songs/${song.id}/restore`, "POST", {
        expectedRevision: 19,
        commandId: crypto.randomUUID(),
        mode: "edit",
        confirmed: true,
      })
    ).status(),
  ).toBe(409);
  expect(await (await api(owner.page, "/api/library")).json()).toEqual(deleted);
  expect(
    await (await api(owner.page, `/api/songs/${survivor.id}/history`)).json(),
  ).toEqual(survivorHistory);
  expect(await resources(owner.page)).toEqual(personal);
  await owner.context.close();
});
