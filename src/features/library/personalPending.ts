import {
  postApiPersonalRecoveryKeys,
  postApiPersonalRecoveryKeysByIdUnlock,
  postApiVoicingPresets,
  postApiDeviceConfigurations,
  putApiPreferencesNotation,
  type Transport,
} from "../../shared/api/private-client.gen";
import type {
  NotationRequest,
  PresetRequest,
  DeviceConfigurationRequest,
} from "../../shared/api/private-api.gen";
import { savedDeviceConfiguration } from "./deviceConfigurations";
import { openDB } from "idb";
import { object, requireValue, sameData } from "./validation";
import { savedPreset } from "./presetStorage";
import { notationSettings } from "../../shared/music/notation";

type Kind = "notation" | "preset" | "device";
export type PersonalKey = [string, string, Kind, string];
interface RecordValue {
  keyId: string;
  iv: Uint8Array;
  cipher: ArrayBuffer;
  commandId: string;
  requestHash: string;
}
interface Draft {
  kind: Kind;
  request: Record<string, unknown>;
}
function sendPersonal(
  request: Transport,
  kind: Kind,
  body: Record<string, unknown>,
) {
  switch (kind) {
    case "notation":
      return putApiPreferencesNotation(
        request,
        body as unknown as NotationRequest,
      );
    case "preset":
      return postApiVoicingPresets(request, body as unknown as PresetRequest);
    case "device":
      return postApiDeviceConfigurations(
        request,
        body as unknown as DeviceConfigurationRequest,
      );
  }
}
const database = () =>
  openDB("scoremap-protected-personal", 1, {
    upgrade(db) {
      db.createObjectStore("pending");
    },
  });
export async function discardPersonalPending(principal: string) {
  const db = await database();
  try {
    const tx = db.transaction("pending", "readwrite");
    let cursor = await tx.store.openCursor();
    while (cursor) {
      if (Array.isArray(cursor.key) && cursor.key[0] === principal)
        await cursor.delete();
      cursor = await cursor.continue();
    }
    await tx.done;
  } finally {
    db.close();
  }
}
function validateAcknowledgement(
  kind: Kind,
  request: Record<string, unknown>,
  value: unknown,
) {
  const saved =
    kind === "preset"
      ? savedPreset(value)
      : kind === "device"
        ? savedDeviceConfiguration(value)
        : notationSettings(value);
  requireValue(
    saved.revision === Number(request.expectedRevision) + 1,
    "The personal save acknowledgement has a different revision. Keep the protected change.",
  );
  if (kind === "notation")
    requireValue(
      sameData(
        {
          mode: (saved as Record<string, unknown>).mode,
          primary: (saved as Record<string, unknown>).primary,
        },
        { mode: request.mode, primary: request.primary },
      ),
      "The acknowledged note-name choice differs. Keep the protected change.",
    );
  else
    requireValue(
      (saved as Record<string, unknown>).id === request.id &&
        sameData(
          (saved as Record<string, unknown>)[
            kind === "preset" ? "preset" : "configuration"
          ],
          request.operation === "delete" ? null : request.content,
        ),
      "The acknowledged reusable resource differs. Keep the protected change.",
    );
  return saved;
}
export class PersonalPending {
  private readonly context = crypto.randomUUID();
  private generation = 0;
  private active = true;
  private epoch = 0;
  get version() {
    return this.epoch;
  }
  private protectionFailures = new Map<string, unknown>();
  private protection: Promise<void> = Promise.resolve();
  private key: Promise<{ id: string; key: CryptoKey }> | null = null;
  private listeners = new Set<() => void>();
  constructor(
    readonly principal: string,
    private request: <T>(path: string, init?: RequestInit) => Promise<T>,
    private authorized: () => boolean,
  ) {}
  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
  private changed() {
    for (const listener of this.listeners) listener();
  }
  private check(generation = this.generation) {
    if (!this.active || !this.authorized() || generation !== this.generation)
      throw new Error(
        "Your personal resources are locked. Sign in again to recover protected changes.",
      );
  }
  private async importKey(value: string) {
    return crypto.subtle.importKey(
      "raw",
      Uint8Array.from(atob(value), (letter) => letter.charCodeAt(0)),
      "AES-GCM",
      false,
      ["encrypt", "decrypt"],
    );
  }
  private obtainKey() {
    return (this.key ??= (
      postApiPersonalRecoveryKeys(this.request) as Promise<{
        id: string;
        key: string;
      }>
    )
      .then(async (value) => ({
        id: value.id,
        key: await this.importKey(value.key),
      }))
      .catch((error: unknown) => {
        this.key = null;
        throw error;
      }));
  }
  async installPreparedKey(material: { id: string; key: string }) {
    this.check();
    const generation = this.generation;
    const key = await this.importKey(material.key);
    this.check(generation);
    this.key = Promise.resolve({ id: material.id, key });
  }
  async whenProtected() {
    await this.protection;
    if (this.protectionFailures.size)
      throw this.protectionFailures.values().next().value;
  }
  async list() {
    this.check();
    const db = await database();
    try {
      const keys = await db.getAllKeys("pending");
      return keys
        .filter(
          (key): key is PersonalKey =>
            Array.isArray(key) &&
            key.length === 4 &&
            key[0] === this.principal &&
            typeof key[1] === "string" &&
            (key[2] === "notation" ||
              key[2] === "preset" ||
              key[2] === "device") &&
            typeof key[3] === "string",
        )
        .map((key) => ({ key, kind: key[2] }));
    } finally {
      db.close();
    }
  }
  async mutate<T>(
    kind: Kind,
    request: object,
    validate: (value: unknown) => T,
  ) {
    this.check();
    const generation = this.generation;
    const body = structuredClone(request) as Record<string, unknown>;
    requireValue(
      typeof body.commandId === "string" &&
        /^[0-9a-f-]{36}$/i.test(body.commandId),
      "A stable personal command identity is required.",
    );
    const commandId = body.commandId;
    const id = kind === "notation" ? "notation" : body.id;
    requireValue(
      typeof id === "string" && id.length > 0,
      "A personal resource identity is required.",
    );
    this.epoch++;
    const slot: PersonalKey = [
      this.principal,
      this.context,
      kind,
      id as string,
    ];
    const retained = this.protection
      .catch(() => undefined)
      .then(async () => {
        const recovery = await this.obtainKey();
        this.check(generation);
        const serialized = new TextEncoder().encode(
          JSON.stringify({ kind, request: body }),
        );
        const requestHash = Array.from(
          new Uint8Array(await crypto.subtle.digest("SHA-256", serialized)),
          (byte) => byte.toString(16).padStart(2, "0"),
        ).join("");
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const cipher = await crypto.subtle.encrypt(
          {
            name: "AES-GCM",
            iv,
            additionalData: new TextEncoder().encode(JSON.stringify(slot)),
          },
          recovery.key,
          serialized,
        );
        this.check(generation);
        const db = await database();
        try {
          const tx = db.transaction("pending", "readwrite");
          const previous = (await tx.store.get(slot)) as
            RecordValue | undefined;
          if (
            previous &&
            (previous.commandId !== commandId ||
              previous.requestHash !== requestHash)
          ) {
            await tx.done;
            throw new Error(
              "Recover the previous unconfirmed personal change before replacing it.",
            );
          }
          await tx.store.put(
            {
              keyId: recovery.id,
              iv,
              cipher,
              commandId,
              requestHash,
            } satisfies RecordValue,
            slot,
          );
          await tx.done;
        } finally {
          db.close();
        }
        this.changed();
      });
    const resource = JSON.stringify([kind, id]);
    this.protection = retained.then(
      () => {
        this.protectionFailures.delete(resource);
      },
      (error: unknown) => {
        this.protectionFailures.set(resource, error);
        throw error;
      },
    );
    await this.protection;
    this.check(generation);
    const acknowledged = validate(await sendPersonal(this.request, kind, body));
    this.check(generation);
    validateAcknowledgement(kind, body, acknowledged);
    this.epoch++;
    await this.remove(slot, commandId);
    return acknowledged;
  }
  async review(slot: PersonalKey): Promise<Draft> {
    this.check();
    requireValue(
      slot[0] === this.principal,
      "This personal draft belongs to another account.",
    );
    const generation = this.generation;
    const db = await database();
    let record: RecordValue;
    try {
      record = (await db.get("pending", slot)) as RecordValue;
    } finally {
      db.close();
    }
    if (
      !record ||
      !(record.iv instanceof Uint8Array) ||
      !(record.cipher instanceof ArrayBuffer)
    )
      throw new Error(
        "This protected personal record is unreadable and has been preserved.",
      );
    const response = (await postApiPersonalRecoveryKeysByIdUnlock(
      this.request,
      { id: record.keyId },
    )) as { key: string };
    const key = await this.importKey(response.key);
    const plaintext = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: new Uint8Array(record.iv),
        additionalData: new TextEncoder().encode(JSON.stringify(slot)),
      },
      key,
      record.cipher,
    );
    this.check(generation);
    const draft: unknown = JSON.parse(new TextDecoder().decode(plaintext));
    object(draft, ["kind", "request"]);
    requireValue(
      draft.kind === slot[2] &&
        typeof draft.request === "object" &&
        draft.request !== null &&
        !Array.isArray(draft.request) &&
        (draft.request as Record<string, unknown>).commandId ===
          record.commandId,
      "This personal draft is invalid and has been preserved.",
    );
    return draft as unknown as Draft;
  }
  async retry(
    slot: PersonalKey,
    mode: "edit" | "performance" = "performance",
    checkEdit?: () => void,
    runEdit?: <T>(work: () => Promise<T>) => Promise<T>,
  ) {
    const generation = this.generation;
    const draft = await this.review(slot);
    requireValue(
      draft.kind === "notation" || mode === "edit",
      "Switch to Edit before applying a reusable personal resource.",
    );
    if (draft.kind !== "notation") checkEdit?.();
    this.epoch++;
    const send = () => sendPersonal(this.request, draft.kind, draft.request);
    const acknowledged = validateAcknowledgement(
      draft.kind,
      draft.request,
      await (draft.kind !== "notation" && runEdit ? runEdit(send) : send()),
    );
    this.check(generation);
    this.epoch++;
    await this.remove(slot, String(draft.request.commandId));
    return acknowledged;
  }
  async discardOwn(kind: Kind, id: string, commandId: string) {
    await this.remove([this.principal, this.context, kind, id], commandId);
    this.protectionFailures.delete(JSON.stringify([kind, id]));
    this.protection = this.protection.catch(() => undefined);
  }
  async remove(slot: PersonalKey, commandId?: string) {
    this.check();
    requireValue(
      slot[0] === this.principal,
      "This personal draft belongs to another account.",
    );
    const db = await database();
    try {
      const tx = db.transaction("pending", "readwrite");
      const current = (await tx.store.get(slot)) as RecordValue | undefined;
      if (current && (!commandId || current.commandId === commandId))
        await tx.store.delete(slot);
      await tx.done;
    } finally {
      db.close();
    }
    this.changed();
  }
  close() {
    this.active = false;
    this.generation++;
    this.key = null;
    this.listeners.clear();
  }
}
