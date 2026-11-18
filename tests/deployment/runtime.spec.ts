import { test, expect } from "@playwright/test";
import { readFile, writeFile, chmod } from "node:fs/promises";
import path from "node:path";
import { api, login, openSong, saveView } from "../connected/helpers";
import { uniqueRichFixture } from "../connected/rich-fixtures";
import type { Library } from "../../src/features/library/domain";
import type { RichSong } from "../../src/features/library/score";
const directory = process.env.SCOREMAP_DEPLOYMENT_STATE!;
const state = JSON.parse(
  await readFile(path.join(directory, "state.private.json"), "utf8"),
) as { syntheticOnly: boolean; project: string; origin: string };
const origin = new URL(state.origin);
if (
  !state.syntheticOnly ||
  !state.project.startsWith("scoremap-qualification-") ||
  origin.protocol !== "https:" ||
  origin.hostname !== "localhost" ||
  ["5380", "5381"].includes(origin.port)
)
  throw new Error(
    "This journey requires an execution-owned disposable Production instance.",
  );
test("before: store complete synthetic music and independently owned resources through real Production identity", async ({
  browser,
}) => {
  const owner = await login(browser, "owner-a");
  const fixture = JSON.parse(
    await readFile("tests/fixtures/library-v2.json", "utf8"),
  ) as Library;
  const template = fixture.songs[0] as RichSong;
  delete template.migration;
  const { song } = uniqueRichFixture(template);
  await saveView(owner.page, (library) => {
    library.schemaVersion = 2;
    library.songs.push(song);
  });
  await owner.page.reload();
  await openSong(owner.page, song.title);
  await owner.page
    .getByText("Song details & personal notes", { exact: true })
    .click();
  const cue = "Synthetic Production restart and restored-keyring cue";
  await owner.page.getByLabel("Song notes", { exact: true }).fill(cue);
  await expect(owner.page.locator(".save-state")).toHaveText(
    "Saved to your private library",
  );
  await owner.page
    .getByLabel("Note names", { exact: true })
    .selectOption("dual-latin");
  await expect(
    owner.page.getByText("Note names saved to your account", { exact: true }),
  ).toBeVisible();
  const id = crypto.randomUUID();
  const preset = {
    id,
    name: "Synthetic independent restored voicing",
    harmony: { root: "Db", quality: "major" },
    pitches: [
      { spelling: "Db", octave: 3, midi: 49 },
      { spelling: "F", octave: 3, midi: 53 },
      { spelling: "Ab", octave: 4, midi: 68 },
    ],
    custom: false,
  };
  expect(
    (
      await api(owner.page, "/api/voicing-presets", "POST", {
        operation: "save",
        id,
        expectedRevision: 0,
        mode: "edit",
        content: preset,
        commandId: crypto.randomUUID(),
      })
    ).status(),
  ).toBe(200);
  const beforePurge = await (await api(owner.page, "/api/library")).json();
  const purged = (beforePurge.library as Library).songs.find(
    (entry) =>
      beforePurge.capabilities[entry.id] === "owner" &&
      entry.title.startsWith("Synthetic permissions "),
  );
  if (!purged)
    throw new Error(
      "The preceding synthetic role journey must supply an owned active song for the older-backup purge check.",
    );
  const deletionRevision = beforePurge.versions[purged.id] + 1;
  await saveView(owner.page, (library) => {
    library.songs = library.songs.filter((entry) => entry.id !== purged.id);
    library.repertoires = library.repertoires.map((repertoire) => ({
      ...repertoire,
      songIds: repertoire.songIds.filter((id) => id !== purged.id),
    }));
  });
  expect(
    (
      await api(owner.page, `/api/songs/${purged.id}/purge`, "POST", {
        expectedRevision: deletionRevision,
        commandId: crypto.randomUUID(),
        mode: "edit",
        confirmed: true,
        confirmation: purged.title,
      })
    ).status(),
  ).toBe(200);
  const view = await (await api(owner.page, "/api/library")).json();
  expect(
    view.library.songs.find((entry: RichSong) => entry.id === song.id),
  ).toEqual({ ...song, notes: cue });
  expect(view.versions[song.id]).toBe(2);
  const expected = {
    view,
    purged,
    presets: await (await api(owner.page, "/api/voicing-presets")).json(),
    notation: await (await api(owner.page, "/api/preferences/notation")).json(),
    history: await (
      await api(owner.page, `/api/songs/${song.id}/history`)
    ).json(),
    songId: song.id,
  };
  expect(expected.notation).toMatchObject({ mode: "dual", primary: "latin" });
  const cookies = (await owner.context.cookies(state.origin)).filter((cookie) =>
    /scoremap/i.test(cookie.name),
  );
  expect(cookies.length).toBeGreaterThan(0);
  expect(cookies.every((cookie) => cookie.secure && cookie.httpOnly)).toBe(
    true,
  );
  await writeFile(
    path.join(directory, "expected.private.json"),
    JSON.stringify(expected),
    { mode: 0o600 },
  );
  await owner.context.storageState({
    path: path.join(directory, "session.private.json"),
  });
  await chmod(path.join(directory, "session.private.json"), 0o600);
  await owner.context.close();
});
test("after: existing real session reconstructs complete content, history, presets and notation without reviving a purge", async ({
  browser,
}) => {
  const expected = JSON.parse(
    await readFile(path.join(directory, "expected.private.json"), "utf8"),
  );
  const context = await browser.newContext({
    storageState: path.join(directory, "session.private.json"),
  });
  const page = await context.newPage();
  await page.goto(state.origin);
  await expect(
    page.getByText("owner-a · Private library", { exact: true }),
  ).toBeVisible();
  expect(await (await api(page, "/api/library")).json()).toEqual(expected.view);
  expect(await (await api(page, "/api/preferences/notation")).json()).toEqual(
    expected.notation,
  );
  expect(await (await api(page, "/api/voicing-presets")).json()).toEqual(
    expected.presets,
  );
  expect(
    await (await api(page, `/api/songs/${expected.songId}/history`)).json(),
  ).toEqual(expected.history);
  expect(
    (await api(page, `/api/songs/${expected.purged.id}/history`)).status(),
  ).toBe(403);
  const replay = structuredClone(expected.view.library) as Library;
  replay.songs.push(expected.purged);
  expect(
    (
      await api(page, "/api/library", "PUT", {
        library: replay,
        versions: expected.view.versions,
        expectedRevision: expected.view.library.revision,
        commandId: crypto.randomUUID(),
        mode: "edit",
      })
    ).status(),
  ).toBe(409);
  expect(await (await api(page, "/api/library")).json()).toEqual(expected.view);
  await context.close();
});
