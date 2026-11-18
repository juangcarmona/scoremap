import type { PersonalPending } from "./personalPending";
import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import {
  validatePresetMutation,
  validatePreset,
  type PresetMutation,
  type SavedPreset,
} from "./voicingPresets";
import { object, requireValue } from "./validation";
export interface PresetStore {
  readonly scope: string;
  list(): Promise<SavedPreset[]>;
  mutate(request: PresetMutation, commandId?: string): Promise<SavedPreset>;
  close?(): Promise<void>;
}
export function savedPreset(value: unknown): SavedPreset {
  object(value, ["id", "revision", "preset"]);
  requireValue(
    typeof value.id === "string" &&
      value.id.trim() &&
      Number.isSafeInteger(value.revision) &&
      Number(value.revision) > 0,
    "Invalid acknowledged preset.",
  );
  if (value.preset !== null)
    requireValue(
      validatePreset(value.preset).id === value.id,
      "Invalid preset identity.",
    );
  return value as SavedPreset;
}
abstract class RetriablePresetStore implements PresetStore {
  abstract readonly scope: string;
  private retries = new Map<string, string>();
  abstract list(): Promise<SavedPreset[]>;
  protected abstract send(
    request: PresetMutation & { commandId: string },
  ): Promise<SavedPreset>;
  async mutate(request: PresetMutation, retainedCommandId?: string) {
    validatePresetMutation(request);
    const key = JSON.stringify(request);
    const commandId =
      retainedCommandId ?? this.retries.get(key) ?? crypto.randomUUID();
    this.retries.set(key, commandId);
    const saved = savedPreset(await this.send({ ...request, commandId }));
    this.retries.delete(key);
    return saved;
  }
}
export class RemotePresetStore extends RetriablePresetStore {
  constructor(
    readonly scope: string,
    private request: <T>(path: string, init?: RequestInit) => Promise<T>,
    private pending: Pick<PersonalPending, "mutate">,
  ) {
    super();
  }
  async list() {
    const value = await this.request<unknown>("/api/voicing-presets");
    requireValue(Array.isArray(value), "Invalid saved-preset response.");
    return value.map(savedPreset);
  }
  protected send(request: PresetMutation & { commandId: string }) {
    return this.pending.mutate("preset", request, savedPreset);
  }
}
interface PresetDatabase extends DBSchema {
  presets: { key: string; value: SavedPreset };
  receipts: {
    key: string;
    value: { hash: string; id: string; revision: number };
  };
}
export class LocalPresetStore extends RetriablePresetStore {
  readonly scope = "anonymous";
  private connection: Promise<IDBPDatabase<PresetDatabase>> | null = null;
  constructor(private databaseName = "scoremap-voicings") {
    super();
  }
  private database() {
    return (this.connection ??= openDB<PresetDatabase>(this.databaseName, 1, {
      upgrade(db) {
        db.createObjectStore("presets");
        db.createObjectStore("receipts");
      },
    }));
  }
  async list() {
    return (await (await this.database()).getAll("presets"))
      .map(savedPreset)
      .filter((value) => value.preset !== null);
  }
  protected async send(request: PresetMutation & { commandId: string }) {
    const bytes = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(JSON.stringify(request)),
    );
    const hash = Array.from(new Uint8Array(bytes), (byte) =>
      byte.toString(16).padStart(2, "0"),
    ).join("");
    const db = await this.database();
    const tx = db.transaction(["presets", "receipts"], "readwrite");
    void tx.done.catch(() => undefined);
    try {
      const current = await tx.objectStore("presets").get(request.id);
      const revision = current?.revision ?? 0;
      const receipt = await tx.objectStore("receipts").get(request.commandId);
      if (receipt) {
        requireValue(
          receipt.hash === hash && receipt.revision === revision && current,
          "This preset command was acknowledged, but newer content exists. Load the saved version.",
        );
        await tx.done;
        return current;
      }
      requireValue(
        revision === request.expectedRevision && current?.preset !== null,
        "Newer or deleted preset content exists. Keep/export the preview and load the saved version.",
      );
      const next: SavedPreset = {
        id: request.id,
        revision: revision + 1,
        preset:
          request.operation === "delete"
            ? null
            : structuredClone(request.content),
      };
      await tx.objectStore("presets").put(next, request.id);
      await tx
        .objectStore("receipts")
        .add(
          { hash, id: request.id, revision: next.revision },
          request.commandId,
        );
      await tx.done;
      return next;
    } catch (error) {
      try {
        tx.abort();
      } catch {
        /* Already completed. */
      }
      await tx.done.catch(() => undefined);
      throw error;
    }
  }
  async close() {
    const connection = this.connection;
    this.connection = null;
    if (connection) (await connection).close();
  }
}
