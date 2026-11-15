import { afterEach, describe, expect, it, vi } from "vitest";
import { openDB, deleteDB } from "idb";
import { IndexedLibraryStore } from "../../src/features/library/storage";
import { applyCommand, emptyLibrary } from "../../src/features/library/domain";
const stores: IndexedLibraryStore[] = [];
const names: string[] = [];
function store(name = crypto.randomUUID()) {
  names.push(name);
  const s = new IndexedLibraryStore(name);
  stores.push(s);
  return s;
}
afterEach(async () => {
  vi.restoreAllMocks();
  await Promise.all(stores.splice(0).map((s) => s.close()));
  await Promise.all(names.splice(0).map((n) => deleteDB(n)));
});
describe("Atomic local persistence", () => {
  it("SB-PERSIST-RECOVER: a new connection recovers acknowledged identities and content", async () => {
    const name = crypto.randomUUID();
    const a = store(name);
    const candidate = applyCommand(emptyLibrary(), "edit", {
      type: "createSong",
      id: "s",
      title: "Synthetic work",
    });
    const saved = await a.commit(candidate, 0);
    expect(saved.revision).toBe(1);
    const b = store(name);
    expect(await b.load()).toEqual(saved);
  });
  it("SB-PERSIST-CONFLICT: stale concurrent writes never replace the newer durable revision", async () => {
    const name = crypto.randomUUID();
    const a = store(name),
      b = store(name);
    const snapshot = await b.load();
    const candidate = applyCommand(emptyLibrary(), "edit", {
      type: "createSong",
      id: "s",
      title: "Newer",
    });
    const saved = await a.commit(candidate, 0);
    await expect(b.commit(snapshot, 0)).rejects.toThrow(/newer data/);
    expect(await b.load()).toEqual(saved);
  });
  it("SB-PERSIST-FAILURE: quota failure preserves the previous acknowledged library", async () => {
    const s = store();
    const saved = await s.commit(
      applyCommand(emptyLibrary(), "edit", {
        type: "createSong",
        id: "s",
        title: "Retained",
      }),
      0,
    );
    const candidate = applyCommand(saved, "edit", {
      type: "updateSong",
      songId: "s",
      patch: { title: "Unsaved" },
    });
    const original = IDBObjectStore.prototype.put;
    const mock = vi
      .spyOn(IDBObjectStore.prototype, "put")
      .mockImplementationOnce(function (
        this: IDBObjectStore,
        ...args: Parameters<IDBObjectStore["put"]>
      ) {
        if (this.name === "library")
          throw new DOMException("Storage full", "QuotaExceededError");
        return original.apply(this, args);
      });
    await expect(s.commit(candidate, saved.revision)).rejects.toThrow(
      /Storage full/,
    );
    mock.mockRestore();
    expect(await s.load()).toEqual(saved);
  });
  it("SB-RECOVERY-INVALID: unsupported stored versions are preserved rather than reset", async () => {
    const name = crypto.randomUUID();
    const s = store(name);
    await s.load();
    const raw = await openDB(name, 1);
    const invalid = { schemaVersion: 999, precious: "Keep this raw data" };
    await raw.put("library", invalid, "current");
    await expect(s.load()).rejects.toThrow();
    await expect(s.commit(emptyLibrary(), 0)).rejects.toThrow();
    expect(await raw.get("library", "current")).toEqual(invalid);
    raw.close();
  });
  it("SB-BACKUP-REJECT: invalid candidates cannot enter storage", async () => {
    const s = store();
    const invalid = { ...emptyLibrary(), songs: [{ id: "dangling" }] };
    await expect(s.commit(invalid as never, 0)).rejects.toThrow();
    expect(await s.load()).toEqual(emptyLibrary());
  });
});
