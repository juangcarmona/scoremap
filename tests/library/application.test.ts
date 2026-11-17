import { describe, expect, it } from "vitest";
import { LibrarySession } from "../../src/features/library/application";
import { emptyLibrary } from "../../src/features/library/domain";
import type { LibraryStore } from "../../src/features/library/storage";
function fixture() {
  let durable = emptyLibrary();
  let fail = false;
  const store: LibraryStore = {
    load: async () => structuredClone(durable),
    commit: async (candidate, expected) => {
      if (fail) throw new Error("quota");
      if (expected !== durable.revision) throw new Error("conflict");
      durable = {
        ...structuredClone(candidate),
        revision: durable.revision + 1,
      };
      return structuredClone(durable);
    },
  };
  return {
    session: new LibrarySession(store),
    durable: () => durable,
    fail: (v: boolean) => {
      fail = v;
    },
  };
}
describe("Serialized application commands", () => {
  it("SB-PERSIST-RECOVER: rapid commands serialize against the latest candidate", async () => {
    const { session, durable } = fixture();
    await session.load();
    await Promise.all([
      session.execute({ type: "createSong", id: "a", title: "A" }),
      session.execute({ type: "createSong", id: "b", title: "B" }),
    ]);
    expect(durable().songs.map((s) => s.id)).toEqual(["a", "b"]);
    expect(session.durableRevision).toBe(2);
  });
  it("SB-PERSIST-FAILURE: unsaved work remains exportable and an explicit retry recovers it", async () => {
    const f = fixture();
    await f.session.load();
    f.fail(true);
    await expect(
      f.session.execute({ type: "createSong", id: "a", title: "A" }),
    ).rejects.toThrow("quota");
    expect(f.session.data?.songs).toHaveLength(1);
    expect(f.durable().songs).toEqual([]);
    expect(f.session.error).toMatch(/Not saved/);
    f.fail(false);
    await f.session.retrySave();
    expect(f.durable().songs).toHaveLength(1);
    expect(f.session.error).toBe("");
  });
  it("SB-PERFORMANCE-REJECT SB-PERFORMANCE SB-EDIT-RESUME: mode switching preserves content and guards direct mutation and import", async () => {
    const { session, durable } = fixture();
    await session.load();
    const before = structuredClone(session.data);
    session.setMode("performance");
    await expect(
      session.execute({ type: "createSong", id: "a", title: "A" }),
    ).rejects.toThrow(/Performance/);
    await expect(session.replace(emptyLibrary(), true)).rejects.toThrow(
      /Performance/,
    );
    expect(session.data).toEqual(before);
    expect(durable()).toEqual(before);
    session.setMode("edit");
    await session.execute({ type: "createSong", id: "a", title: "A" });
    expect(session.data?.songs).toHaveLength(1);
  });
  it("SB-BACKUP-CANCEL: cancel replacement performs no write", async () => {
    const { session } = fixture();
    await session.load();
    await session.execute({ type: "createSong", id: "a", title: "A" });
    const before = structuredClone(session.data);
    await session.replace(emptyLibrary(), false);
    expect(session.data).toEqual(before);
  });
  it("SB-PERSIST-FAILURE: failed confirmed replacement preserves current data", async () => {
    const f = fixture();
    await f.session.load();
    await f.session.execute({ type: "createSong", id: "a", title: "A" });
    const before = structuredClone(f.session.data);
    f.fail(true);
    await expect(f.session.replace(emptyLibrary(), true)).rejects.toThrow();
    expect(f.session.data).toEqual(before);
  });
  it("SB-BACKUP-IMPORT SB-BACKUP-IMPORT-EMPTY: successful replacement uses a fresh local revision", async () => {
    const { session } = fixture();
    await session.load();
    await session.execute({ type: "createSong", id: "a", title: "A" });
    await session.replace({ ...emptyLibrary(), revision: 99 }, true);
    expect(session.data?.songs).toEqual([]);
    expect(session.durableRevision).toBe(2);
  });
  it("recovery cannot replace unsaved work or bypass performance mode", async () => {
    const f = fixture();
    await f.session.load();
    f.session.setMode("performance");
    let invoked = false;
    const recover = async () => {
      invoked = true;
    };
    await expect(f.session.reconcile(recover)).rejects.toThrow(/Performance/);
    expect(invoked).toBe(false);
    f.session.setMode("edit");
    f.fail(true);
    await expect(
      f.session.execute({ type: "createSong", id: "draft", title: "Unsaved" }),
    ).rejects.toThrow();
    await expect(f.session.reconcile(recover)).rejects.toThrow(/unsaved work/);
    expect(invoked).toBe(false);
    expect(f.session.data?.songs[0]?.title).toBe("Unsaved");
  });
  it("recovery serializes with edits and refreshes the acknowledged revision", async () => {
    const f = fixture();
    await f.session.load();
    await Promise.all([
      f.session.execute({
        type: "createSong",
        id: "song",
        title: "Saved first",
      }),
      f.session.reconcile(async () => {
        f.durable().songs[0]!.title = "Restored version";
        f.durable().revision++;
      }),
      f.session.execute({
        type: "createSong",
        id: "second",
        title: "Saved after",
      }),
    ]);
    expect(f.durable().songs.map((song) => song.title)).toEqual([
      "Restored version",
      "Saved after",
    ]);
    expect(f.session.durableRevision).toBe(3);
  });
});
