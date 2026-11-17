import { openDB, type IDBPDatabase } from "idb";
import type { Device } from "./score";
import { object, name, requireValue, sameData } from "./validation";
import { MAX_IMPORT_BYTES } from "./backup";
export type SavedDeviceConfiguration = {
  id: string;
  revision: number;
  configuration: Device | null;
};
export type DeviceConfigurationMutation = {
  operation: "save" | "delete";
  id: string;
  expectedRevision: number;
  mode: "edit" | "performance";
  content: Device | null;
};
export type DeviceConfigurationRequest = DeviceConfigurationMutation & {
  commandId: string;
};
export function deviceConfiguration(value: unknown): Device {
  object(value, ["id", "name", "instrument", "range"]);
  name(value.id);
  name(value.name);
  name(value.instrument);
  const range = value.range;
  requireValue(
    Array.isArray(range) &&
      range.length === 2 &&
      range.every(
        (pitch) => Number.isSafeInteger(pitch) && pitch >= 0 && pitch <= 127,
      ) &&
      range[0] <= range[1],
    "A physical range must lie within 0..127 in ascending order.",
  );
  return value as Device;
}
export function savedDeviceConfiguration(
  value: unknown,
): SavedDeviceConfiguration {
  object(value, ["id", "revision", "configuration"]);
  name(value.id);
  requireValue(
    Number.isSafeInteger(value.revision) && Number(value.revision) > 0,
    "Invalid acknowledged configuration revision.",
  );
  if (value.configuration !== null)
    requireValue(
      deviceConfiguration(value.configuration).id === value.id,
      "Invalid configuration identity.",
    );
  return value as SavedDeviceConfiguration;
}
function validateMutation(request: DeviceConfigurationMutation) {
  requireValue(
    request.mode === "edit",
    "Switch to Edit before changing reusable configurations.",
  );
  name(request.id);
  requireValue(
    Number.isSafeInteger(request.expectedRevision) &&
      request.expectedRevision >= 0 &&
      request.expectedRevision < Number.MAX_SAFE_INTEGER,
    "A current configuration revision is required.",
  );
  requireValue(
    request.operation === "save" || request.operation === "delete",
    "Unknown configuration operation.",
  );
  if (request.operation === "save")
    requireValue(
      deviceConfiguration(request.content).id === request.id,
      "Keep the configuration identity consistent.",
    );
  else
    requireValue(
      request.content === null && request.expectedRevision > 0,
      "Delete only an acknowledged configuration after confirmation.",
    );
}
export function exportDeviceConfiguration(resource: SavedDeviceConfiguration) {
  savedDeviceConfiguration(resource);
  requireValue(
    resource.configuration !== null,
    "A deleted configuration cannot be exported.",
  );
  return JSON.stringify(
    { format: "scoremap-device-configuration", version: 1, resource },
    null,
    2,
  );
}
export function importDeviceConfiguration(text: string) {
  requireValue(
    new TextEncoder().encode(text).byteLength <= MAX_IMPORT_BYTES,
    "The configuration file exceeds the import limit.",
  );
  const value: unknown = JSON.parse(text);
  object(value, ["format", "version", "resource"]);
  requireValue(
    value.format === "scoremap-device-configuration" && value.version === 1,
    "Unsupported configuration format or version. Keep the original file.",
  );
  const resource = savedDeviceConfiguration(value.resource);
  requireValue(
    resource.configuration !== null,
    "A deleted configuration cannot be imported.",
  );
  return structuredClone(resource);
}
export class DeviceConfigurationStore {
  private connection: Promise<IDBPDatabase> | null = null;
  private retries = new Map<string, string>();
  constructor(
    readonly scope: string,
    private remote?: {
      list: () => Promise<unknown>;
      mutate: (request: DeviceConfigurationRequest) => Promise<unknown>;
    },
    private databaseName = "scoremap-device-configurations",
  ) {}
  private database() {
    return (this.connection ??= openDB(this.databaseName, 1, {
      upgrade(db) {
        db.createObjectStore("configurations");
        db.createObjectStore("receipts");
      },
    }));
  }
  async list() {
    const values: unknown = this.remote
      ? await this.remote.list()
      : await (await this.database()).getAll("configurations");
    requireValue(
      Array.isArray(values),
      "Invalid reusable-configuration response.",
    );
    return values
      .map(savedDeviceConfiguration)
      .filter((resource) => resource.configuration !== null);
  }
  async mutate(
    request: DeviceConfigurationMutation,
    retainedCommandId?: string,
  ) {
    validateMutation(request);
    const key = JSON.stringify(request);
    const commandId =
      retainedCommandId ?? this.retries.get(key) ?? crypto.randomUUID();
    this.retries.set(key, commandId);
    const payload = { ...structuredClone(request), commandId };
    const saved = savedDeviceConfiguration(
      this.remote
        ? await this.remote.mutate(payload)
        : await this.local(payload),
    );
    requireValue(
      saved.id === request.id &&
        saved.revision === request.expectedRevision + 1 &&
        sameData(
          saved.configuration,
          request.operation === "delete" ? null : request.content,
        ),
      "The acknowledged configuration differs. Keep the protected request and compare before retrying.",
    );
    this.retries.delete(key);
    return saved;
  }
  private async local(request: DeviceConfigurationRequest) {
    const hash = Array.from(
      new Uint8Array(
        await crypto.subtle.digest(
          "SHA-256",
          new TextEncoder().encode(JSON.stringify(request)),
        ),
      ),
      (byte) => byte.toString(16).padStart(2, "0"),
    ).join("");
    const db = await this.database();
    const tx = db.transaction(["configurations", "receipts"], "readwrite");
    void tx.done.catch(() => undefined);
    try {
      const current = (await tx
        .objectStore("configurations")
        .get(request.id)) as SavedDeviceConfiguration | undefined;
      const receipt = (await tx
        .objectStore("receipts")
        .get(request.commandId)) as
        { hash: string; id: string; revision: number } | undefined;
      if (receipt) {
        requireValue(
          receipt.hash === hash &&
            current?.id === receipt.id &&
            current.revision === receipt.revision,
          "The configuration command was used or newer content exists. Keep your preview.",
        );
        await tx.done;
        return structuredClone(current);
      }
      requireValue(
        (current?.revision ?? 0) === request.expectedRevision &&
          current?.configuration !== null,
        "Newer or deleted configuration content exists. Keep your preview.",
      );
      const saved = {
        id: request.id,
        revision: request.expectedRevision + 1,
        configuration:
          request.operation === "delete"
            ? null
            : structuredClone(request.content),
      };
      await tx.objectStore("configurations").put(saved, request.id);
      await tx
        .objectStore("receipts")
        .add(
          { hash, id: request.id, revision: saved.revision },
          request.commandId,
        );
      await tx.done;
      return saved;
    } catch (error) {
      try {
        tx.abort();
      } catch {
        /* An already completed transaction cannot abort again. */
      }
      await tx.done.catch(() => undefined);
      throw error;
    }
  }
  async close() {
    if (this.connection) (await this.connection).close();
  }
}
