import { test, expect } from "@playwright/test";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { api, login, saveView, syntheticSong } from "../connected/helpers";

const state = process.env.SCOREMAP_DEPLOYMENT_STATE;
if (!state || process.env.SCOREMAP_QUALIFICATION_TLS !== "1")
  throw new Error(
    "This test requires the disposable Production qualification.",
  );
const fixture = join(state, "migration-fault-fixture.private.json");

test("seed: prepare legacy music and stable import command", async ({
  browser,
}) => {
  const owner = await login(browser, "owner-a");
  try {
    const original = syntheticSong();
    await saveView(owner.page, (library) => {
      library.songs.push(original);
    });
    const before = await (await api(owner.page, "/api/library")).json();
    const imported = syntheticSong();
    const command = {
      library: {
        ...before.library,
        songs: [...before.library.songs, imported],
      },
      expectedRevision: before.library.revision,
      versions: before.versions,
      commandId: crypto.randomUUID(),
      mode: "edit",
      import: true,
    };
    await writeFile(
      fixture,
      JSON.stringify({ original, imported, before, command }),
      { mode: 0o600 },
    );
  } finally {
    await owner.context.close();
  }
});

test("fault: migration failure retains the previous library and source", async ({
  browser,
}) => {
  const owner = await login(browser, "owner-a");
  try {
    const { before, command, imported } = JSON.parse(
      await readFile(fixture, "utf8"),
    );
    const response = await api(owner.page, "/api/library", "PUT", command);
    expect(response.status()).toBe(500);
    expect(await (await api(owner.page, "/api/library")).json()).toEqual(
      before,
    );
    expect(
      (await api(owner.page, `/api/songs/${imported.id}/history`)).status(),
    ).toBe(403);
  } finally {
    await owner.context.close();
  }
});

test("retry: identical import succeeds once and retains the legacy original", async ({
  browser,
}) => {
  const owner = await login(browser, "owner-a");
  try {
    const { before, command, original, imported } = JSON.parse(
      await readFile(fixture, "utf8"),
    );
    const saved = await api(owner.page, "/api/library", "PUT", command);
    expect(saved.status()).toBe(200);
    const after = await saved.json();
    expect(
      after.library.songs.find(
        (song: { id: string }) => song.id === original.id,
      ),
    ).toEqual(original);
    const migrated = after.library.songs.find(
      (song: { id: string }) => song.id === imported.id,
    );
    expect(migrated).toMatchObject({
      id: imported.id,
      title: imported.title,
      schemaVersion: 2,
    });
    expect(
      migrated.arrangements.flatMap(
        (arrangement: { parts: { events: unknown[] }[] }) =>
          arrangement.parts.flatMap((part) => part.events),
      ),
    ).toEqual([]);
    const history = await (
      await api(owner.page, `/api/songs/${imported.id}/history`)
    ).json();
    expect(
      history.map((entry: { revision: number }) => entry.revision),
    ).toEqual([1, 0]);
    expect(history[0].content).toEqual(migrated);
    expect(history[1].content).toEqual(imported);
    const duplicate = await api(owner.page, "/api/library", "PUT", command);
    expect(duplicate.status()).toBe(200);
    expect(await duplicate.json()).toEqual(after);
    expect(await (await api(owner.page, "/api/library")).json()).toEqual(after);
    expect(after.library.revision).toBe(before.library.revision + 1);
    expect(
      await (await api(owner.page, `/api/songs/${imported.id}/history`)).json(),
    ).toEqual(history);
  } finally {
    await owner.context.close();
  }
});
