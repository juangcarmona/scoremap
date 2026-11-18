import type { ImportProvenance } from "./importSelection";
import { isRichSong } from "./score";
import { planImportedMigration } from "./migrationPlanning";
import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import { emptyLibrary, validateLibrary, type Library } from "./domain";
interface ScoreMapDatabase extends DBSchema {
  library: { key: string; value: Library };
}
export interface PreparedLibrarySave {
  retained: Promise<void>;
  save(expectedRevision: number): Promise<Library>;
}
export interface LibraryStore {
  readonly scope?: "private";
  close?(): Promise<void>;
  load(): Promise<Library>;
  migrationSources?(): Promise<{ key: string; library: Library }[]>;
  prepare?(
    candidate: Library,
    intent?: "import",
    source?: ImportProvenance,
  ): PreparedLibrarySave;
  whenProtected?(): Promise<void>;
  commit(
    candidate: Library,
    expectedRevision: number,
    intent?: "import",
    source?: ImportProvenance,
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
  async migrationSources(): Promise<{ key: string; library: Library }[]> {
    const db = await this.connection;
    const tx = db.transaction("library", "readonly");
    const sources: { key: string; library: Library }[] = [];
    let cursor = await tx.store.openCursor();
    while (cursor) {
      if (cursor.key.startsWith("migration-"))
        sources.push({
          key: cursor.key,
          library: validateLibrary(cursor.value),
        });
      cursor = await cursor.continue();
    }
    await tx.done;
    return sources;
  }
  async commit(
    candidate: Library,
    expectedRevision: number,
    intent?: "import",
  ): Promise<Library> {
    validateLibrary(candidate);
    const source = intent === "import" ? structuredClone(candidate) : null;
    if (intent === "import")
      candidate = validateLibrary(await planImportedMigration(candidate));
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
      if (source)
        await tx.store.add(source, `migration-import-source:${actualRevision}`);
      if (
        stored &&
        candidate.songs.some(
          (song) =>
            isRichSong(song) &&
            stored.songs.some(
              (before) => before.id === song.id && !isRichSong(before),
            ),
        )
      )
        await tx.store.add(
          structuredClone(stored),
          `migration-source:${actualRevision}`,
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
