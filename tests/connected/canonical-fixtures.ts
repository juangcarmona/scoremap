import { expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { api, saveView } from "./helpers";
import { uniqueRichFixture } from "./rich-fixtures";
import type { Library } from "../../src/features/library/domain";
import type { RichSong } from "../../src/features/library/score";
export async function richRevision(page: Page, revision: number) {
  const fixture = JSON.parse(
    await readFile("tests/fixtures/library-v2.json", "utf8"),
  ) as Library;
  const source = fixture.songs[0] as RichSong;
  delete source.migration;
  const { song } = uniqueRichFixture(source);
  song.arrangements[1]!.parts[1]!.events[1]!.pitch = {
    spelling: "B",
    octave: 6,
    midi: 95,
  };
  let view = await saveView(page, (library) => {
    library.schemaVersion = 2;
    library.songs.push(song);
  });
  for (let next = 2; next <= revision; next++)
    view = await saveView(page, (library) => {
      library.songs.find((value) => value.id === song.id)!.notes =
        `Acknowledged revision ${next}`;
    });
  expect(view.versions[song.id]).toBe(revision);
  return {
    song: view.library.songs.find(
      (value: RichSong) => value.id === song.id,
    ) as RichSong,
    view,
  };
}
export async function grant(
  owner: Page,
  recipient: Page,
  song: string,
  role: "editor" | "viewer" | null,
) {
  const principal = (
    await (await recipient.request.get("/auth/session")).json()
  ).principal;
  expect(
    (
      await api(owner, `/api/songs/${song}/grants`, "PUT", {
        principal,
        role,
        mode: "edit",
      })
    ).status(),
  ).toBe(204);
}
export async function protectedDigest(page: Page) {
  return page.evaluate(async () => {
    const request = indexedDB.open("scoremap-protected-pending", 1);
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const read = db.transaction("pending").objectStore("pending").getAll();
    const rows = await new Promise<{ cipher: ArrayBuffer; keyId: string }[]>(
      (resolve, reject) => {
        read.onsuccess = () => resolve(read.result);
        read.onerror = () => reject(read.error);
      },
    );
    db.close();
    return Promise.all(
      rows.map(async (row) => ({
        keyId: row.keyId,
        digest: Array.from(
          new Uint8Array(await crypto.subtle.digest("SHA-256", row.cipher)),
          (value) => value.toString(16).padStart(2, "0"),
        ).join(""),
      })),
    );
  });
}
