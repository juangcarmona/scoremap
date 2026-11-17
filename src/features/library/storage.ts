import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import { emptyLibrary, validateLibrary, type Library } from "./domain";
interface ScoreMapDatabase extends DBSchema {
  library: { key: string; value: Library };
}
export interface LibraryStore {
  readonly scope?: "private";
  close?(): Promise<void>;
  load(): Promise<Library>;
  commit(
    candidate: Library,
    expectedRevision: number,
    intent?: "import",
  ): Promise<Library>;
}
export class IndexedLibraryStore implements LibraryStore {
  private connection: Promise<IDBPDatabase<ScoreMapDatabase>>;
  constructor(name = "scoremap") {
    this.connection = openDB<ScoreMapDatabase>(name, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("library"))
          db.createObjectStore("library");
      },
      blocking: () => {
        void this.close();
      },
    });
  }
  async load(): Promise<Library> {
    const db = await this.connection;
    const value = await db.get("library", "current");
    return value === undefined ? emptyLibrary() : validateLibrary(value);
  }
  async commit(candidate: Library, expectedRevision: number): Promise<Library> {
    validateLibrary(candidate);
    const db = await this.connection;
    const tx = db.transaction("library", "readwrite");
    void tx.done.catch(() => undefined);
    try {
      const stored = await tx.store.get("current");
      const actualRevision =
        stored === undefined ? 0 : validateLibrary(stored).revision;
      if (actualRevision !== expectedRevision)
        throw new Error(
          "Another ScoreMap tab saved newer data. Export your unsaved work, then reload before continuing.",
        );
      const next = validateLibrary({
        ...structuredClone(candidate),
        revision: actualRevision + 1,
      });
      await tx.store.put(next, "current");
      await tx.done;
      return next;
    } catch (error) {
      try {
        tx.abort();
      } catch {
        /* A finished transaction cannot be aborted again. */
      }
      await tx.done.catch(() => undefined);
      throw error;
    }
  }
  async close() {
    (await this.connection).close();
  }
}
