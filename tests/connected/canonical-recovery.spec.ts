import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { api, login, openSong, saveView } from "./helpers";
import { uniqueRichFixture } from "./rich-fixtures";
import { LibrarySession } from "../../src/features/library/application";
import type { Library } from "../../src/features/library/domain";
import type { RichSong } from "../../src/features/library/score";

async function revisionTwelve(page: Page) {
  const source = JSON.parse(
    await readFile("tests/fixtures/library-v2.json", "utf8"),
  ) as Library;
  const original = source.songs[0] as RichSong;
  delete original.migration;
  const { song } = uniqueRichFixture(original);
  song.arrangements[1]!.parts[1]!.events[1]!.pitch = {
    spelling: "B",
    octave: 6,
    midi: 95,
  };
  let view = await saveView(page, (library) => {
    library.schemaVersion = 2;
    library.songs.push(song);
  });
  for (let revision = 2; revision <= 12; revision++)
    view = await saveView(page, (library) => {
      library.songs.find((candidate) => candidate.id === song.id)!.notes =
        `Acknowledged revision ${revision}`;
    });
  expect(view.versions[song.id]).toBe(12);
  return {
    song: view.library.songs.find(
      (candidate: RichSong) => candidate.id === song.id,
    ) as RichSong,
    view,
  };
}
function edited(song: RichSong) {
  const arrangement = structuredClone(song.arrangements[0]!);
  arrangement.parts[1]!.events[1]!.pitch = {
    spelling: "B",
    octave: 5,
    midi: 83,
  };
  Object.assign(arrangement.bindings[1]!, {
    range: [60, 96],
    sound: "Bright Rhodes",
    layer: "upper",
  });
  return arrangement;
}
function gate() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

test("SB-REMOTE-COMMIT: actual Song 12→13 atomically saves performed pitches and bindings; application acknowledgement preserves a newer draft and original retry preserves history", async ({
  browser,
}) => {
  const owner = await login(browser, "owner-a");
  const { song, view } = await revisionTwelve(owner.page);
  const personal = await (
    await api(owner.page, "/api/preferences/notation")
  ).json();
  const committed = gate(),
    release = gate(),
    second = gate();
  const arrangement = edited(song);
  const commandId = crypto.randomUUID();
  let calls = 0;
  let originalRequest: unknown;
  const session = new LibrarySession({
    scope: "private",
    load: async () => structuredClone(view.library),
    commit: async (library, expectedRevision) => {
      if (++calls > 1) {
        await second.promise;
        throw new Error(
          "Newer interaction intentionally retained without transport",
        );
      }
      originalRequest = {
        library,
        expectedRevision,
        versions: view.versions,
        commandId,
        mode: "edit",
      };
      const response = await api(
        owner.page,
        "/api/library",
        "PUT",
        originalRequest,
      );
      expect(response.status()).toBe(200);
      const receipt = await response.json();
      expect(receipt.versions[song.id]).toBe(13);
      committed.resolve();
      await release.promise;
      return receipt.library;
    },
  });
  await session.load();
  const saving = session.execute({
    type: "replaceArrangement",
    songId: song.id,
    arrangementId: arrangement.id,
    expected: song.arrangements[0]!,
    arrangement,
  });
  let later: Promise<unknown> | undefined;
  try {
    await committed.promise;
    later = session
      .execute({
        type: "updateSong",
        songId: song.id,
        patch: {
          notes: "Newer local interaction after the revision-13 request",
        },
      })
      .catch((error) => error);
    release.resolve();
    await saving;
    expect(session.durableRevision).toBe(view.library.revision + 1);
    expect(
      session.data!.songs.find((value) => value.id === song.id)!.notes,
    ).toBe("Newer local interaction after the revision-13 request");
    const actual = await (await api(owner.page, "/api/library")).json();
    const saved = actual.library.songs.find(
      (value: RichSong) => value.id === song.id,
    );
    expect(actual.versions[song.id]).toBe(13);
    expect(saved).toEqual({
      ...song,
      arrangements: [arrangement, song.arrangements[1]],
    });
    expect(
      actual.library.songs.filter((value: RichSong) => value.id !== song.id),
    ).toEqual(
      view.library.songs.filter((value: RichSong) => value.id !== song.id),
    );
    const history = await (
      await api(owner.page, `/api/songs/${song.id}/history`)
    ).json();
    expect(history[0].content).toEqual(saved);
    expect(history[1].content).toEqual(song);
    expect(history[0].commandId).toBe(commandId);
    const retry = await api(owner.page, "/api/library", "PUT", originalRequest);
    expect(retry.status()).toBe(200);
    expect((await retry.json()).versions[song.id]).toBe(13);
    expect(
      await (await api(owner.page, `/api/songs/${song.id}/history`)).json(),
    ).toEqual(history);
    expect(
      await (await api(owner.page, "/api/preferences/notation")).json(),
    ).toEqual(personal);
  } finally {
    release.resolve();
    second.resolve();
    await saving.catch(() => undefined);
    await later;
    await owner.context.close();
  }
});

test("SB-PRIVATE-RECOVER: a clean independently authenticated browser reconstructs Song 13, both independent arrangements and separately acknowledged notation without replay", async ({
  browser,
}) => {
  const owner = await login(browser, "owner-a");
  const other = await login(browser, "owner-b");
  const otherLibrary = await (await api(other.page, "/api/library")).json();
  const otherNotation = await (
    await api(other.page, "/api/preferences/notation")
  ).json();
  const { song } = await revisionTwelve(owner.page);
  const arrangement = edited(song);
  const saved = await saveView(owner.page, (library) => {
    (
      library.songs.find((value) => value.id === song.id) as RichSong
    ).arrangements[0] = arrangement;
  });
  expect(saved.versions[song.id]).toBe(13);
  const beforeNotation = await (
    await api(owner.page, "/api/preferences/notation")
  ).json();
  const preference = await api(owner.page, "/api/preferences/notation", "PUT", {
    mode: "dual",
    primary: "latin",
    expectedRevision: beforeNotation.revision,
    commandId: crypto.randomUUID(),
  });
  expect(preference.status()).toBe(200);
  const acknowledged = await preference.json();
  const history = await (
    await api(owner.page, `/api/songs/${song.id}/history`)
  ).json();
  const fresh = await login(browser, "owner-a");
  let writes = 0;
  fresh.page.on("request", (request) => {
    if (request.method() === "PUT") writes++;
  });
  await openSong(fresh.page, song.title);
  const reconstructed = await (await api(fresh.page, "/api/library")).json();
  expect(reconstructed).toEqual(saved);
  expect(
    await (await api(fresh.page, "/api/preferences/notation")).json(),
  ).toEqual(acknowledged);
  expect(
    reconstructed.library.songs.find((value: RichSong) => value.id === song.id),
  ).toEqual({ ...song, arrangements: [arrangement, song.arrangements[1]] });
  await expect(
    fresh.page.getByLabel("Active performed part", { exact: true }),
  ).toHaveValue(arrangement.parts[0]!.id);
  const arrangementSelect = fresh.page.getByLabel("Active arrangement", {
    exact: true,
  });
  await arrangementSelect.selectOption(song.arrangements[1]!.id);
  await expect(
    fresh.page.getByLabel("Active performed part", { exact: true }),
  ).toHaveValue(song.arrangements[1]!.parts[0]!.id);
  await arrangementSelect.selectOption(arrangement.id);
  expect(
    await (await api(fresh.page, `/api/songs/${song.id}/history`)).json(),
  ).toEqual(history);
  expect(writes).toBe(0);
  expect(await (await api(other.page, "/api/library")).json()).toEqual(
    otherLibrary,
  );
  expect(
    await (await api(other.page, "/api/preferences/notation")).json(),
  ).toEqual(otherNotation);
  await fresh.context.close();
  await owner.context.close();
  await other.context.close();
});
