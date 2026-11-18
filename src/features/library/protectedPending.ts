import { openDB } from "idb";

export type PendingKey = string | [string, string];
export interface PendingRecord {
  keyId: string;
  iv: Uint8Array;
  cipher: ArrayBuffer;
  commandId: string;
  formatVersion?: 2;
  generation?: number;
  copies?: Record<
    string,
    { commandId: string; identities: Record<string, string> }
  >;
}
export interface RetainedDraft {
  key: PendingKey;
  record: PendingRecord;
}
export const pendingDatabase = () =>
  openDB("scoremap-protected-pending", 1, {
    upgrade(db) {
      db.createObjectStore("pending");
    },
  });
function ownedKey(key: IDBValidKey, principal: string): PendingKey | null {
  if (key === principal) return principal; // Preserve older running-client records.
  if (
    Array.isArray(key) &&
    key.length === 2 &&
    key[0] === principal &&
    typeof key[1] === "string"
  )
    return [principal, key[1]];
  return null;
}
export async function retainedDrafts(principal: string) {
  const db = await pendingDatabase();
  try {
    const tx = db.transaction("pending", "readonly");
    const drafts: RetainedDraft[] = [];
    let cursor = await tx.store.openCursor();
    while (cursor) {
      const key = ownedKey(cursor.primaryKey, principal);
      if (key) drafts.push({ key, record: cursor.value as PendingRecord });
      cursor = await cursor.continue();
    }
    await tx.done;
    return drafts;
  } finally {
    db.close();
  }
}
export async function readPending(key: PendingKey) {
  const db = await pendingDatabase();
  try {
    const value = (await db.get("pending", key)) as PendingRecord | undefined;
    if (!value) throw new Error("No protected pending work was found.");
    if (
      (value.formatVersion !== undefined && value.formatVersion !== 2) ||
      typeof value.keyId !== "string" ||
      typeof value.commandId !== "string" ||
      !(value.cipher instanceof ArrayBuffer) ||
      !(value.iv instanceof Uint8Array)
    )
      throw new Error(
        "This protected draft cannot be read by this version. It has been kept unchanged; you can explicitly remove it without opening it.",
      );
    return value;
  } finally {
    db.close();
  }
}
export async function writePending(key: PendingKey, record: PendingRecord) {
  const db = await pendingDatabase();
  try {
    const tx = db.transaction("pending", "readwrite");
    const existing = (await tx.store.get(key)) as PendingRecord | undefined;
    const current = !(
      existing?.formatVersion === 2 &&
      (existing.generation ?? 0) > (record.generation ?? 0)
    );
    if (current) await tx.store.put(record, key);
    await tx.done;
    return current;
  } finally {
    db.close();
  }
}
export async function removePending(key: PendingKey, commandId?: string) {
  const db = await pendingDatabase();
  try {
    const tx = db.transaction("pending", "readwrite");
    const existing = (await tx.store.get(key)) as PendingRecord | undefined;
    if (
      existing &&
      (commandId === undefined || existing.commandId === commandId)
    )
      await tx.store.delete(key);
    await tx.done;
  } finally {
    db.close();
  }
}
export async function discardProtectedPending(principal: string) {
  const db = await pendingDatabase();
  try {
    const tx = db.transaction("pending", "readwrite");
    let cursor = await tx.store.openCursor();
    while (cursor) {
      if (ownedKey(cursor.primaryKey, principal)) await cursor.delete();
      cursor = await cursor.continue();
    }
    await tx.done;
  } finally {
    db.close();
  }
}
