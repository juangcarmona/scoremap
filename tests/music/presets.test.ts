import { afterEach, describe, expect, it, vi } from "vitest";
import { deleteDB } from "idb";
import {
  LocalPresetStore,
  RemotePresetStore,
} from "../../src/features/library/presetStorage";
import type {
  PresetMutation,
  VoicingPreset,
} from "../../src/features/library/voicingPresets";
const stores: LocalPresetStore[] = [];
const names: string[] = [];
function local() {
  const name = crypto.randomUUID();
  names.push(name);
  const store = new LocalPresetStore(name);
  stores.push(store);
  return store;
}
const preset: VoicingPreset = {
  id: "preset",
  name: "Open seventh",
  harmony: { root: "C", quality: "major-seventh" },
  pitches: [
    { spelling: "C", octave: 2, midi: 36 },
    { spelling: "G", octave: 2, midi: 43 },
    { spelling: "E", octave: 4, midi: 64 },
    { spelling: "B", octave: 4, midi: 71 },
  ],
  custom: false,
};
const create: PresetMutation = {
  operation: "save",
  id: preset.id,
  expectedRevision: 0,
  mode: "edit",
  content: preset,
};
afterEach(async () => {
  vi.restoreAllMocks();
  await Promise.all(stores.splice(0).map((store) => store.close()));
  await Promise.all(names.splice(0).map((name) => deleteDB(name)));
});
describe("Independently owned conditional reusable voicings", () => {
  it("versions exact copied content, refuses stale and performance writes and retains deletion tombstones", async () => {
    const store = local();
    const first = await store.mutate(create);
    expect(first).toEqual({ id: preset.id, revision: 1, preset });
    const content = structuredClone(preset);
    content.pitches[3] = { spelling: "B", octave: 5, midi: 83 };
    const second = await store.mutate({
      ...create,
      expectedRevision: 1,
      content,
    });
    expect(second.revision).toBe(2);
    expect(first.preset).toEqual(preset);
    await expect(
      store.mutate({ ...create, expectedRevision: 1 }),
    ).rejects.toThrow(/Newer/);
    await expect(
      store.mutate({ ...create, mode: "performance", expectedRevision: 2 }),
    ).rejects.toThrow(/Performance/);
    expect(await store.list()).toEqual([second]);
    await store.mutate({
      operation: "delete",
      id: preset.id,
      expectedRevision: 2,
      mode: "edit",
      content: null,
    });
    expect(await store.list()).toEqual([]);
    await expect(store.mutate(create)).rejects.toThrow(/deleted/);
  });
  it("aborts content when receipt persistence fails and permits a safe explicit retry", async () => {
    const store = local();
    const original = IDBObjectStore.prototype.add;
    vi.spyOn(IDBObjectStore.prototype, "add").mockImplementationOnce(function (
      this: IDBObjectStore,
      ...args: Parameters<IDBObjectStore["add"]>
    ) {
      if (this.name === "receipts")
        throw new DOMException("Receipt storage full", "QuotaExceededError");
      return original.apply(this, args);
    });
    await expect(store.mutate(create)).rejects.toThrow(/storage full/);
    expect(await store.list()).toEqual([]);
    expect((await store.mutate(create)).revision).toBe(1);
  });
  it("reuses the same command after a lost transport acknowledgement without changing the requested scope", async () => {
    const requests: unknown[] = [];
    const request = vi.fn(async (_path: string, init?: RequestInit) => {
      requests.push(JSON.parse(String(init?.body)));
      if (requests.length === 1) throw new Error("Lost response");
      return { id: preset.id, revision: 1, preset };
    });
    const store = new RemotePresetStore("principal-a", request as never);
    await expect(store.mutate(create)).rejects.toThrow(/Lost/);
    expect(await store.mutate(create)).toEqual({
      id: preset.id,
      revision: 1,
      preset,
    });
    expect(requests[0]).toEqual(requests[1]);
  });
});
