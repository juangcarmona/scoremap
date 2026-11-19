import { createContext, useContext, useState, type ReactNode } from "react";

export class PersonalEditBarrier {
  private epoch = 0;
  private editing = false;
  private updating = false;
  private pending = new Set<Promise<unknown>>();

  setEditing(editing: boolean) {
    if (this.editing !== editing) {
      this.editing = editing;
      this.epoch++;
    }
  }

  beginUpdate() {
    if (this.updating) throw new Error("An update is already being applied.");
    this.updating = true;
    this.epoch++;
    return () => {
      this.updating = false;
    };
  }

  runNotation<T>(work: () => Promise<T>): Promise<T> {
    if (this.updating)
      throw new Error(
        "Wait for the application update before changing note names.",
      );
    const pending = work();
    this.pending.add(pending);
    void pending.then(
      () => this.pending.delete(pending),
      () => this.pending.delete(pending),
    );
    return pending;
  }

  begin() {
    const epoch = this.epoch;
    return () => {
      if (this.updating || !this.editing || this.epoch !== epoch)
        throw new Error(
          "Switch to Edit and restart this operation. Existing data and the source file are kept.",
        );
    };
  }

  run<T>(check: () => void, work: () => Promise<T>): Promise<T> {
    check();
    const pending = work();
    this.pending.add(pending);
    void pending.then(
      () => this.pending.delete(pending),
      () => this.pending.delete(pending),
    );
    return pending;
  }

  async whenIdle() {
    let failure: unknown;
    while (this.pending.size) {
      const results = await Promise.allSettled([...this.pending]);
      failure ??= results.find(
        (result) => result.status === "rejected",
      )?.reason;
    }
    if (failure !== undefined) throw failure;
  }
}

const Context = createContext<PersonalEditBarrier | null>(null);

export function PersonalEditProvider({ children }: { children: ReactNode }) {
  const [barrier] = useState(() => new PersonalEditBarrier());
  return <Context.Provider value={barrier}>{children}</Context.Provider>;
}

export function usePersonalEditBarrier() {
  const barrier = useContext(Context);
  if (!barrier) throw new Error("Personal edit admission is unavailable.");
  return barrier;
}
