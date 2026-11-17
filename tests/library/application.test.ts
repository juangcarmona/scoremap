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

describe("Admitted drafts and delayed acknowledgements", () => {
  it("protects the newer complete candidate before the older service reply and never replaces it with that older reply", async () => {
    let releaseFirst!: () => void,
      releaseSecond!: () => void,
      firstStarted!: () => void;
    const firstGate = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    const secondGate = new Promise<void>((resolve) => {
      releaseSecond = resolve;
    });
    const started = new Promise<void>((resolve) => {
      firstStarted = resolve;
    });
    let durable = emptyLibrary(),
      sends = 0;
    const retained: string[][] = [];
    const store: LibraryStore = {
      load: async () => structuredClone(durable),
      commit: async () => {
        throw new Error("Prepared saves must use their transport boundary");
      },
      whenProtected: async () => undefined,
      prepare: (candidate) => {
        retained.push(candidate.songs.map((song) => song.id));
        return {
          retained: Promise.resolve(),
          save: async (expected) => {
            sends++;
            if (sends === 1) {
              firstStarted();
              await firstGate;
            } else await secondGate;
            expect(expected).toBe(durable.revision);
            durable = { ...structuredClone(candidate), revision: expected + 1 };
            return structuredClone(durable);
          },
        };
      },
    };
    const session = new LibrarySession(store);
    await session.load();
    const first = session.execute({ type: "createSong", id: "a", title: "A" });
    await started;
    const second = session.execute({ type: "createSong", id: "b", title: "B" });
    await session.whenProtected();
    expect(retained).toEqual([["a"], ["a", "b"]]);
    expect(session.data?.songs.map((song) => song.id)).toEqual(["a", "b"]);
    releaseFirst();
    await first;
    expect(durable.songs.map((song) => song.id)).toEqual(["a"]);
    expect(session.data?.songs.map((song) => song.id)).toEqual(["a", "b"]);
    expect(session.durableRevision).toBe(1);
    releaseSecond();
    await second;
    expect(session.data).toEqual(durable);
    expect(session.durableRevision).toBe(2);
  });
  it("a failed protection boundary preserves the intended draft, sends no transport and permits explicit protection retry", async () => {
    let fail = true,
      sends = 0;
    const store: LibraryStore = {
      scope: "private",
      load: async () => emptyLibrary(),
      commit: async () => {
        throw new Error("Unexpected unstaged transport");
      },
      prepare: (candidate) => ({
        retained: fail
          ? Promise.reject(new Error("Protection quota"))
          : Promise.resolve(),
        save: async (expected) => {
          sends++;
          return { ...candidate, revision: expected + 1 };
        },
      }),
    };
    const session = new LibrarySession(store);
    await session.load();
    await expect(
      session.execute({ type: "createSong", id: "draft", title: "Draft" }),
    ).rejects.toThrow("Protection quota");
    expect(sends).toBe(0);
    expect(session.data?.songs[0]?.title).toBe("Draft");
    expect(session.durableRevision).toBe(0);
    expect(session.error).toContain("Save not confirmed");
    fail = false;
    await session.retrySave();
    expect(sends).toBe(1);
    expect(session.data?.songs[0]?.title).toBe("Draft");
    expect(session.durableRevision).toBe(1);
    expect(session.error).toBe("");
  });
});

it("bounds private queued saves while protecting every admitted interaction", async () => {
  let durable = emptyLibrary(),
    release!: () => void,
    started!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const active = new Promise<void>((resolve) => {
    started = resolve;
  });
  const protectedSizes: number[] = [],
    sentSizes: number[] = [];
  const store: LibraryStore = {
    scope: "private",
    load: async () => durable,
    commit: async () => {
      throw new Error("Prepared transport required");
    },
    prepare: (candidate) => {
      protectedSizes.push(candidate.songs.length);
      return {
        retained: Promise.resolve(),
        save: async (expected) => {
          sentSizes.push(candidate.songs.length);
          if (sentSizes.length === 1) {
            started();
            await gate;
          }
          expect(expected).toBe(durable.revision);
          durable = { ...structuredClone(candidate), revision: expected + 1 };
          return structuredClone(durable);
        },
      };
    },
  };
  const session = new LibrarySession(store);
  await session.load();
  const writes = [
    session.execute({ type: "createSong", id: "first", title: "First" }),
  ];
  await active;
  for (let n = 1; n <= 100; n++)
    writes.push(
      session.execute({ type: "createSong", id: `s${n}`, title: `Song ${n}` }),
    );
  expect(protectedSizes).toHaveLength(101);
  expect(session.pending).toBe(2);
  release();
  await Promise.all(writes);
  expect(sentSizes).toEqual([1, 101]);
  expect(session.data).toEqual(durable);
  expect(session.durableRevision).toBe(2);
});

it("retains queued private edits after an unknown save and waits for explicit retry", async () => {
  let fail = true,
    sends = 0,
    started!: () => void,
    release!: () => void;
  const active = new Promise<void>((resolve) => {
    started = resolve;
  });
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const store: LibraryStore = {
    scope: "private",
    load: async () => emptyLibrary(),
    commit: async () => {
      throw new Error("Prepared transport required");
    },
    prepare: (candidate) => ({
      retained: Promise.resolve(),
      save: async (expected) => {
        sends++;
        if (fail) {
          started();
          await gate;
          throw new Error("Unknown response");
        }
        return { ...candidate, revision: expected + 1 };
      },
    }),
  };
  const session = new LibrarySession(store);
  await session.load();
  const first = session.execute({ type: "createSong", id: "a", title: "A" });
  await active;
  const second = session.execute({ type: "createSong", id: "b", title: "B" });
  const results = Promise.allSettled([first, second]);
  release();
  expect((await results).map((result) => result.status)).toEqual([
    "rejected",
    "rejected",
  ]);
  expect(sends).toBe(1);
  expect(session.data?.songs.map((song) => song.id)).toEqual(["a", "b"]);
  expect(session.error).toContain("Save not confirmed");
  fail = false;
  await session.retrySave();
  expect(sends).toBe(2);
  expect(session.error).toBe("");
});
