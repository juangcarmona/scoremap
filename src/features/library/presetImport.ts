import { openDB } from "idb";
import { requireValue } from "./validation";
export type PresetImportPlan = { ids: string[]; commands: string[] };
const database = () =>
  openDB("scoremap-preset-imports", 1, {
    upgrade(db) {
      db.createObjectStore("plans");
    },
  });
export async function presetImportPlan(
  scope: string,
  source: string,
  count: number,
) {
  const bytes = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(source),
  );
  const key =
    scope +
    ":" +
    Array.from(new Uint8Array(bytes), (byte) =>
      byte.toString(16).padStart(2, "0"),
    ).join("");
  const db = await database();
  try {
    const tx = db.transaction("plans", "readwrite");
    let plan = (await tx.store.get(key)) as PresetImportPlan | undefined;
    if (!plan) {
      plan = {
        ids: Array.from({ length: count }, () => crypto.randomUUID()),
        commands: Array.from({ length: count }, () => crypto.randomUUID()),
      };
      await tx.store.add(plan, key);
    }
    await tx.done;
    requireValue(
      plan.ids.length === count && plan.commands.length === count,
      "The retained import mapping is inconsistent. Keep the source file and compare saved resources.",
    );
    return { key, plan };
  } finally {
    db.close();
  }
}
export async function finishPresetImport(key: string) {
  const db = await database();
  try {
    await db.delete("plans", key);
  } finally {
    db.close();
  }
}
