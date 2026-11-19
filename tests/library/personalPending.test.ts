// @vitest-environment node
import { expect, it } from "vitest";
import { PersonalPending } from "../../src/features/library/personalPending";
import { PersonalEditBarrier } from "../../src/features/library/PersonalEditBarrier";

it("protects personal changes before transport and reconciles the original command after reopening", async () => {
  const principal = crypto.randomUUID();
  const key = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString(
    "base64",
  );
  const request = {
    mode: "latin",
    primary: "latin",
    expectedRevision: 0,
    commandId: crypto.randomUUID(),
  };
  let lose = true,
    sends = 0;
  const transport = async <T>(path: string, init?: RequestInit): Promise<T> => {
    if (path.startsWith("/api/personal-recovery-keys"))
      return { id: "synthetic-key", key } as T;
    expect(JSON.parse(String(init?.body))).toEqual(request);
    sends++;
    if (lose) throw new Error("Unknown response");
    return { mode: "latin", primary: "latin", revision: 1 } as T;
  };
  const first = new PersonalPending(principal, transport, () => true);
  await expect(
    first.mutate("notation", request, (value) => value),
  ).rejects.toThrow("Unknown response");
  const rows = await first.list();
  expect(rows).toHaveLength(1);
  expect(JSON.stringify(rows)).not.toContain("latin");
  first.close();
  const second = new PersonalPending(principal, transport, () => true);
  expect(sends).toBe(1);
  const retained = await second.list();
  expect(await second.review(retained[0]!.key)).toEqual({
    kind: "notation",
    request,
  });
  lose = false;
  await second.retry(retained[0]!.key);
  expect(sends).toBe(2);
  expect(await second.list()).toEqual([]);
  second.close();
});

it("keeps ciphertext when a valid-looking acknowledgement contains another setting and refuses another principal before unlocking", async () => {
  const principal = crypto.randomUUID();
  const key = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString(
    "base64",
  );
  let unlocks = 0;
  const transport = async <T>(path: string): Promise<T> => {
    if (path.includes("/unlock")) unlocks++;
    if (path.startsWith("/api/personal-recovery-keys"))
      return { id: "synthetic-key", key } as T;
    return { mode: "anglo", primary: "anglo", revision: 1 } as T;
  };
  const owner = new PersonalPending(principal, transport, () => true);
  await expect(
    owner.mutate(
      "notation",
      {
        mode: "latin",
        primary: "latin",
        expectedRevision: 0,
        commandId: crypto.randomUUID(),
      },
      (value) => value,
    ),
  ).rejects.toThrow("differs");
  const records = await owner.list();
  expect(records).toHaveLength(1);
  const outsider = new PersonalPending(
    crypto.randomUUID(),
    transport,
    () => true,
  );
  expect(await outsider.list()).toEqual([]);
  await expect(outsider.review(records[0]!.key)).rejects.toThrow(
    "another account",
  );
  expect(unlocks).toBe(0);
  await owner.remove(records[0]!.key);
  expect(await owner.list()).toEqual([]);
  outsider.close();
  owner.close();
});

it("locks a late personal acknowledgement after termination and preserves its already protected command", async () => {
  const principal = crypto.randomUUID();
  const key = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString(
    "base64",
  );
  let release!: () => void, start!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const started = new Promise<void>((resolve) => {
    start = resolve;
  });
  const transport = async <T>(path: string): Promise<T> => {
    if (path.startsWith("/api/personal-recovery-keys"))
      return { id: "synthetic-key", key } as T;
    start();
    await gate;
    return { mode: "latin", primary: "latin", revision: 1 } as T;
  };
  const first = new PersonalPending(principal, transport, () => true);
  const change = first.mutate(
    "notation",
    {
      mode: "latin",
      primary: "latin",
      expectedRevision: 0,
      commandId: crypto.randomUUID(),
    },
    (value) => value,
  );
  await started;
  await first.whenProtected();
  first.close();
  const rejected = expect(change).rejects.toThrow("locked");
  release();
  await rejected;
  const reopened = new PersonalPending(principal, transport, () => true);
  const records = await reopened.list();
  expect(records).toHaveLength(1);
  await reopened.remove(records[0]!.key);
  reopened.close();
});

it("does not replay a retained reusable resource in performance mode and keeps the exact command for an explicit edit-mode retry", async () => {
  const principal = crypto.randomUUID();
  const key = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString(
    "base64",
  );
  const content = {
    id: crypto.randomUUID(),
    name: "Synthetic range",
    instrument: "keyboard",
    range: [21, 108],
  };
  const request = {
    operation: "save",
    id: content.id,
    content,
    expectedRevision: 0,
    mode: "edit",
    commandId: crypto.randomUUID(),
  };
  let sends = 0,
    lose = true;
  const transport = async <T>(path: string, init?: RequestInit): Promise<T> => {
    if (path.startsWith("/api/personal-recovery-keys"))
      return { id: "synthetic-key", key } as T;
    expect(JSON.parse(String(init?.body))).toEqual(request);
    sends++;
    if (lose) throw new Error("Lost resource response");
    return { id: content.id, revision: 1, configuration: content } as T;
  };
  const store = new PersonalPending(principal, transport, () => true);
  await expect(
    store.mutate("device", request, (value) => value),
  ).rejects.toThrow("Lost resource response");
  const retained = await store.list();
  await expect(store.retry(retained[0]!.key, "performance")).rejects.toThrow(
    "Switch to Edit",
  );
  expect(sends).toBe(1);
  expect(await store.list()).toEqual(retained);
  lose = false;
  await store.retry(retained[0]!.key, "edit");
  expect(sends).toBe(2);
  expect(await store.list()).toEqual([]);
  store.close();
});

it("rechecks edit admission after unlocking a retained resource and before replay", async () => {
  const principal = crypto.randomUUID();
  const key = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString(
    "base64",
  );
  const content = {
    id: crypto.randomUUID(),
    name: "Synthetic",
    instrument: "keyboard",
    range: [21, 108],
  };
  const request = {
    operation: "save",
    id: content.id,
    content,
    expectedRevision: 0,
    mode: "edit",
    commandId: crypto.randomUUID(),
  };
  let sends = 0,
    release!: () => void,
    unlockStarted!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const started = new Promise<void>((resolve) => {
    unlockStarted = resolve;
  });
  const transport = async <T>(path: string): Promise<T> => {
    if (path.includes("/unlock")) {
      unlockStarted();
      await gate;
      return { key } as T;
    }
    if (path.startsWith("/api/personal-recovery-keys"))
      return { id: "synthetic-key", key } as T;
    sends++;
    throw new Error("Lost response");
  };
  const store = new PersonalPending(principal, transport, () => true);
  await expect(
    store.mutate("device", request, (value) => value),
  ).rejects.toThrow("Lost response");
  const retained = await store.list();
  let editing = true;
  const retry = store.retry(retained[0]!.key, "edit", () => {
    if (!editing) throw new Error("Switch to Edit");
  });
  await started;
  editing = false;
  release();
  await expect(retry).rejects.toThrow("Switch to Edit");
  expect(sends).toBe(1);
  expect(await store.list()).toEqual(retained);
  await store.remove(retained[0]!.key);
  store.close();
});

it("retains an unconfirmed personal write when a pending mode change follows a timeout", async () => {
  const principal = crypto.randomUUID();
  const key = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString("base64");
  const content = { id: crypto.randomUUID(), name: "Synthetic", instrument: "keyboard", range: [21, 108] };
  const request = { operation: "save", id: content.id, content, expectedRevision: 0, mode: "edit", commandId: crypto.randomUUID() };
  let fail!: (reason: Error) => void, started!: () => void;
  const waiting = new Promise<never>((_resolve, reject) => { fail = reject; });
  const sent = new Promise<void>((resolve) => { started = resolve; });
  const transport = async <T>(path: string): Promise<T> => {
    if (path.startsWith("/api/personal-recovery-keys")) return { id: "synthetic-key", key } as T;
    started();
    return waiting;
  };
  const store = new PersonalPending(principal, transport, () => true);
  const barrier = new PersonalEditBarrier();
  barrier.setEditing(true);
  const write = barrier.run(barrier.begin(), () => store.mutate("device", request, (value) => value));
  const failure = expect(write).rejects.toThrow("Unconfirmed response");
  await sent;
  barrier.setEditing(false);
  const idle = barrier.whenIdle();
  fail(new Error("Unconfirmed response"));
  await failure;
  await idle;
  const retained = await store.list();
  expect(retained).toHaveLength(1);
  expect(JSON.stringify(retained)).not.toContain("Synthetic");
  await store.remove(retained[0]!.key);
  store.close();
});
