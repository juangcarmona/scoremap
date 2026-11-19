import { expect, it } from "vitest";
import { PersonalEditBarrier } from "../../src/features/library/PersonalEditBarrier";

it("waits for an admitted personal write and refuses work from the previous edit session", async () => {
  const barrier = new PersonalEditBarrier();
  barrier.setEditing(true);
  const check = barrier.begin();
  let finish!: () => void;
  const write = barrier.run(
    check,
    () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
  );
  barrier.setEditing(false);
  expect(() => barrier.run(check, async () => undefined)).toThrow(
    /Switch to Edit/,
  );
  let idle = false;
  const waiting = barrier.whenIdle().then(() => {
    idle = true;
  });
  await Promise.resolve();
  expect(idle).toBe(false);
  finish();
  await write;
  await waiting;
  expect(idle).toBe(true);
  barrier.setEditing(true);
  expect(check).toThrow(/Switch to Edit/);
});

it("unblocks a mode change after an ambiguous write failure without hiding that failure", async () => {
  const barrier = new PersonalEditBarrier();
  barrier.setEditing(true);
  let fail!: (reason: Error) => void;
  const write = barrier.run(
    barrier.begin(),
    () =>
      new Promise<void>((_resolve, reject) => {
        fail = reject;
      }),
  );
  const failure = expect(write).rejects.toThrow("Unconfirmed response");
  barrier.setEditing(false);
  const idle = expect(barrier.whenIdle()).rejects.toThrow(
    "Unconfirmed response",
  );
  fail(new Error("Unconfirmed response"));
  await failure;
  await idle;
});
