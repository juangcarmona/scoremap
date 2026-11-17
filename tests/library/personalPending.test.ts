// @vitest-environment node
import { expect, it } from "vitest";
import { PersonalPending } from "../../src/features/library/personalPending";

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
