import {
  applyCommand,
  requireEdit,
  validateLibrary,
  type Command,
  type Library,
  type Mode,
} from "./domain";
import type { ImportProvenance } from "./importSelection";
import type { LibraryStore, PreparedLibrarySave } from "./storage";
export class LibrarySession {
  mode: Mode = "edit";
  data: Library | null = null;
  durableRevision = 0;
  error = "";
  pending = 0;
  whenIdle() {
    return this.queue;
  }
  migrationSources() {
    return this.store.migrationSources?.() ?? Promise.resolve([]);
  }
  private queue: Promise<unknown> = Promise.resolve();
  private generation = 0;
  private barriers = 0;
  get reconciling() {
    return this.barriers > 0;
  }
  whenProtected() {
    return this.store.whenProtected?.() ?? this.queue;
  }
  constructor(
    private store: LibraryStore,
    private changed: () => void = () => undefined,
  ) {}
  async load() {
    this.data = await this.store.load();
    this.generation += 1;
    this.durableRevision = this.data.revision;
    this.changed();
  }
  setMode(mode: Mode) {
    this.mode = mode;
    this.changed();
  }
  private schedule(work: () => Promise<void>) {
    this.pending += 1;
    this.changed();
    const next = this.queue.then(work).finally(() => {
      this.pending -= 1;
      this.changed();
    });
    this.queue = next.catch(() => undefined);
    return next;
  }

  private admit(command: Command) {
    if (!this.data) throw new Error("Your library has not loaded.");
    const candidate = applyCommand(this.data, this.mode, command);
    const prepared = this.store.prepare?.(candidate);
    if (prepared)
      void prepared.retained.then(
        () => this.changed(),
        () => this.changed(),
      );
    this.generation += 1;
    this.data = candidate;
    this.changed();
    return { candidate, prepared, generation: this.generation };
  }
  async execute(command: Command) {
    // Restore/import are deliberate state barriers. A command behind one must
    // apply to its acknowledged result rather than a pre-restoration snapshot.
    if (this.barriers)
      return this.schedule(async () => {
        const write = this.admit(command);
        await this.save(write.candidate, write.generation, write.prepared);
      });
    const write = this.admit(command);
    return this.schedule(() =>
      this.save(write.candidate, write.generation, write.prepared),
    );
  }
  replace(value: unknown, confirmed: boolean, source?: ImportProvenance) {
    this.barriers += 1;
    return this.schedule(async () => {
      try {
        requireEdit(this.mode);
        if (!confirmed) return;
        if (!this.data) throw new Error("Your library has not loaded.");
        const candidate = structuredClone(validateLibrary(value));
        // Replacement is visible only after commit; failures retain the current candidate.
        const saved = await this.store.commit(
          candidate,
          this.durableRevision,
          "import",
          source,
        );
        this.data = saved;
        this.generation += 1;
        this.durableRevision = saved.revision;
        this.error = "";
        this.changed();
      } finally {
        this.barriers -= 1;
      }
    });
  }
  private async save(
    candidate: Library,
    generation: number,
    prepared?: PreparedLibrarySave,
  ) {
    try {
      if (prepared) await prepared.retained;
      const saved = prepared
        ? await prepared.save(this.durableRevision)
        : await this.store.commit(candidate, this.durableRevision);
      this.durableRevision = saved.revision;
      if (generation === this.generation) {
        this.data = saved;
        this.error = "";
      }
    } catch (error) {
      this.error = `${this.store.scope === "private" ? "Save not confirmed" : "Not saved"}: ${error instanceof Error ? error.message : "storage failed."} Keep your pending work until the saved result is confirmed.`;
      throw error;
    } finally {
      this.changed();
    }
  }
  retrySave() {
    return this.schedule(async () => {
      requireEdit(this.mode);
      if (!this.data) throw new Error("Your library has not loaded.");
      const prepared = this.store.prepare?.(this.data);
      await this.save(this.data, this.generation, prepared);
    });
  }
  reconcile(work: () => Promise<unknown>) {
    this.barriers += 1;
    return this.schedule(async () => {
      try {
        requireEdit(this.mode);
        if (this.error)
          throw new Error(
            "Save or export and compare your unsaved work before restoring music.",
          );
        await work();
        try {
          await this.load();
        } catch (error) {
          this.error =
            "The recovery was acknowledged, but the updated library could not be opened. Reload to check the saved result before editing.";
          throw error;
        }
      } finally {
        this.barriers -= 1;
      }
    });
  }
}
