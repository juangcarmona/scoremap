import {
  applyCommand,
  requireEdit,
  validateLibrary,
  type Command,
  type Library,
  type Mode,
} from "./domain";
import type { LibraryStore } from "./storage";
export class LibrarySession {
  mode: Mode = "edit";
  data: Library | null = null;
  durableRevision = 0;
  error = "";
  pending = 0;
  whenIdle() { return this.queue; }
  private queue: Promise<unknown> = Promise.resolve();
  constructor(
    private store: LibraryStore,
    private changed: () => void = () => undefined,
  ) {}
  async load() {
    this.data = await this.store.load();
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
    const next = this.queue.then(work).finally(() => { this.pending -= 1; this.changed(); });
    this.queue = next.catch(() => undefined);
    return next;
  }

  execute(command: Command) {
    return this.schedule(async () => {
      if (!this.data) throw new Error("Local data has not loaded.");
      const candidate = applyCommand(this.data, this.mode, command);
      this.data = candidate;
      this.changed();
      await this.save(candidate);
    });
  }
  replace(value: unknown, confirmed: boolean) {
    return this.schedule(async () => {
      requireEdit(this.mode);
      if (!confirmed) return;
      if (!this.data) throw new Error("Local data has not loaded.");
      const candidate = structuredClone(validateLibrary(value));
      // Replacement is visible only after commit; failures retain the current candidate.
      const saved = await this.store.commit(candidate, this.durableRevision);
      this.data = saved;
      this.durableRevision = saved.revision;
      this.error = "";
      this.changed();
    });
  }
  private async save(candidate: Library) {
    try {
      const saved = await this.store.commit(candidate, this.durableRevision);
      this.data = saved;
      this.durableRevision = saved.revision;
      this.error = "";
    } catch (error) {
      this.error = `Not saved: ${error instanceof Error ? error.message : "local storage failed."} Your unsaved work is available for export.`;
      throw error;
    } finally {
      this.changed();
    }
  }
  retrySave() {
    return this.schedule(async () => {
      requireEdit(this.mode);
      if (!this.data) throw new Error("Local data has not loaded.");
      await this.save(this.data);
    });
  }
}
