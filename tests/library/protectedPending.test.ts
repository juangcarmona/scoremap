// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  pendingDatabase,
  retainedDrafts,
  readPending,
  writePending,
  removePending,
  discardProtectedPending,
  type PendingRecord,
} from "../../src/features/library/protectedPending";
import { IndexedLibraryStore } from "../../src/features/library/storage";
function record(commandId: string, generation = 1): PendingRecord {
  return {
    keyId: "opaque-server-key",
    commandId,
    generation,
    formatVersion: 2,
    iv: new Uint8Array(12),
    cipher: new ArrayBuffer(32),
  };
}
describe("Protected draft atomic ownership and generation boundaries", () => {
  it("keeps two editing contexts, a legacy record and another principal separate", async () => {
    const principal = crypto.randomUUID(),
      other = crypto.randomUUID();
    await writePending([principal, "context-a"], record("a"));
    await writePending([principal, "context-b"], record("b"));
    const legacy = record("legacy");
    delete legacy.formatVersion;
    delete legacy.generation;
    await writePending(principal, legacy);
    await writePending([other, "context"], record("other"));
    expect(
      (await retainedDrafts(principal))
        .map((draft) => draft.record.commandId)
        .sort(),
    ).toEqual(["a", "b", "legacy"]);
    expect(
      (await retainedDrafts(other)).map((draft) => draft.record.commandId),
    ).toEqual(["other"]);
    expect(await readPending(principal)).toEqual(legacy);
  });
  it("older protection and acknowledgement cannot replace or delete newer work", async () => {
    const key: [string, string] = [crypto.randomUUID(), "context"];
    expect(await writePending(key, record("new", 2))).toBe(true);
    expect(await writePending(key, record("old", 1))).toBe(false);
    await removePending(key, "old");
    expect((await readPending(key)).commandId).toBe("new");
    await removePending(key, "new");
    await expect(readPending(key)).rejects.toThrow("No protected pending work");
  });
  it("explicit principal deletion preserves other accounts and anonymous storage", async () => {
    const principal = crypto.randomUUID(),
      other = crypto.randomUUID();
    const anonymous = new IndexedLibraryStore(
      `anonymous-${crypto.randomUUID()}`,
    );
    const initial = await anonymous.load();
    await writePending(principal, record("old-format-key"));
    await writePending([principal, "context-a"], record("a"));
    await writePending([principal, "context-b"], record("b"));
    await writePending([other, "context"], record("other"));
    await discardProtectedPending(principal);
    expect(await retainedDrafts(principal)).toEqual([]);
    expect((await retainedDrafts(other))[0]!.record.commandId).toBe("other");
    expect(await anonymous.load()).toEqual(initial);
    await anonymous.close();
  });
  it("unknown protected versions refuse reading without repairing or replacing their bytes", async () => {
    const key: [string, string] = [crypto.randomUUID(), "future"];
    const future = { ...record("future"), formatVersion: 999 };
    const db = await pendingDatabase();
    await db.put("pending", future, key);
    await expect(readPending(key)).rejects.toThrow("kept unchanged");
    expect(await db.get("pending", key)).toEqual(future);
    db.close();
    await removePending(key);
    expect(await retainedDrafts(key[0])).toEqual([]);
  });
});
