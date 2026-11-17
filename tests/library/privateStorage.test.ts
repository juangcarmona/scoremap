// @vitest-environment node
import { afterEach, expect, it, vi } from "vitest";
import { PrivateLibraryStore } from "../../src/features/library/privateStorage";
import { LibrarySession } from "../../src/features/library/application";
import { emptyLibrary, type Library } from "../../src/features/library/domain";
import { retainedDrafts } from "../../src/features/library/protectedPending";

afterEach(() => vi.unstubAllGlobals());
function fixture() {
  const identity = {
    authenticated: true as const,
    principal: crypto.randomUUID(),
    name: "Synthetic",
    csrf: "synthetic",
    sessionId: "synthetic",
    checkedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 60000).toISOString(),
  };
  let durable = emptyLibrary();
  let loseReply = false;
  const requests: {
    library: Library;
    expectedRevision: number;
    commandId: string;
  }[] = [];
  const receipts = new Map<string, object>();
  const view = () => ({
    library: structuredClone(durable),
    versions: Object.fromEntries(
      durable.songs.map((song) => [song.id, durable.revision]),
    ),
    capabilities: Object.fromEntries(
      durable.songs.map((song) => [song.id, "owner"]),
    ),
  });
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit) => {
      if (url === "/api/recovery-keys")
        return Response.json({
          id: "synthetic-key",
          key: Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString(
            "base64",
          ),
        });
      if (url !== "/api/library") throw new Error("Unexpected fixture request");
      if (init.method !== "PUT") return Response.json(view());
      const request = JSON.parse(
        String(init.body),
      ) as (typeof requests)[number];
      requests.push(request);
      const previous = receipts.get(request.commandId);
      if (previous) return Response.json(previous);
      expect(request.expectedRevision).toBe(durable.revision);
      durable = {
        ...structuredClone(request.library),
        revision: durable.revision + 1,
      };
      const saved = view();
      receipts.set(request.commandId, saved);
      if (loseReply) {
        loseReply = false;
        throw new Error("Actual response lost");
      }
      return Response.json(saved);
    }),
  );
  const store = new PrivateLibraryStore(
    identity,
    () => {
      throw new Error("Unexpected lock");
    },
    () => true,
  );
  return {
    identity,
    store,
    session: new LibrarySession(store),
    requests,
    durable: () => durable,
    loseReply: () => {
      loseReply = true;
    },
  };
}

it("coalesces a typing burst into one actual acknowledgement after encrypted retention", async () => {
  const f = fixture();
  await f.session.load();
  const writes = [
    f.session.execute({ type: "createSong", id: "song", title: "Song" }),
  ];
  await new Promise((resolve) => setTimeout(resolve, 20));
  for (let n = 1; n <= 40; n++)
    writes.push(
      f.session.execute({
        type: "updateSong",
        songId: "song",
        patch: { notes: "n".repeat(n) },
      }),
    );
  await f.session.whenProtected();
  expect(f.requests).toHaveLength(0);
  expect(await retainedDrafts(f.identity.principal)).toHaveLength(1);
  expect(f.session.durableRevision).toBe(0);
  await Promise.all(writes);
  expect(f.requests).toHaveLength(1);
  expect(f.durable().songs[0]?.notes).toBe("n".repeat(40));
  expect(f.session.data).toEqual(f.durable());
  expect(f.session.durableRevision).toBe(1);
  expect(await retainedDrafts(f.identity.principal)).toEqual([]);
  await f.store.close();
});

it("reconciles an ambiguous original receipt before sending newer protected work", async () => {
  const f = fixture();
  await f.session.load();
  f.loseReply();
  await expect(
    f.session.execute({ type: "createSong", id: "song", title: "Song" }),
  ).rejects.toThrow("Actual response lost");
  await expect(
    f.session.execute({
      type: "updateSong",
      songId: "song",
      patch: { notes: "Newest protected draft" },
    }),
  ).rejects.toThrow("Resolve the previous");
  expect(f.requests).toHaveLength(1);
  expect(f.durable().revision).toBe(1);
  expect(f.durable().songs[0]?.notes).toBe("");
  expect(await retainedDrafts(f.identity.principal)).toHaveLength(1);
  await f.session.retrySave();
  expect(f.requests).toHaveLength(3);
  expect(f.requests[1]).toEqual(f.requests[0]);
  expect(f.requests[2]?.commandId).not.toBe(f.requests[0]?.commandId);
  expect(f.requests[2]?.expectedRevision).toBe(1);
  expect(f.durable().revision).toBe(2);
  expect(f.durable().songs[0]?.notes).toBe("Newest protected draft");
  expect(f.session.error).toBe("");
  expect(await retainedDrafts(f.identity.principal)).toEqual([]);
  await f.store.close();
});

it("keeps song acknowledgement independent of a personal-resource protection failure while termination reports that failure", async () => {
  const f = fixture();
  await f.session.load();
  await expect(
    f.store.personal.mutate(
      "notation",
      {
        mode: "latin",
        primary: "latin",
        expectedRevision: 0,
        commandId: crypto.randomUUID(),
      },
      (value) => value,
    ),
  ).rejects.toThrow("Unexpected fixture request");
  await f.session.execute({
    type: "createSong",
    id: "song",
    title: "Saved music",
  });
  expect(f.durable().songs[0]?.title).toBe("Saved music");
  expect(f.session.error).toBe("");
  await expect(f.session.whenProtected()).rejects.toThrow(
    "Unexpected fixture request",
  );
  await f.store.close();
});
