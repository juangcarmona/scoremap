import { describe, expect, it } from "vitest";
import type { SessionInfo } from "../src/shared/auth/session";
import { SessionDeadline } from "../src/shared/auth/sessionDeadline";

const identity: SessionInfo = {
  authenticated: true,
  principal: "synthetic-issuer|subject-A",
  name: "A",
  csrf: "synthetic-csrf",
  sessionId: "non-secret-session-A",
  checkedAt: "2026-11-17T10:00:00.000Z",
  expiresAt: "2026-11-17T10:05:00.000Z",
};
function fixture(overrides: Partial<SessionInfo> = {}) {
  let wall = 1000000;
  let elapsed = 100;
  const clock = { wall: () => wall, elapsed: () => elapsed };
  const deadline = new SessionDeadline(
    { ...identity, ...overrides },
    { wall, elapsed },
    clock,
  );
  return {
    deadline,
    move: (wallDelta: number, elapsedDelta = wallDelta) => {
      wall += wallDelta;
      elapsed += elapsedDelta;
    },
  };
}
describe("Server-confirmed session deadlines", () => {
  it("locks at the exact earlier provider expiry without waiting for a poll", () => {
    const f = fixture();
    f.move(299999);
    expect(f.deadline.remaining()).toBe(1);
    f.move(1);
    expect(f.deadline.remaining()).toBe(0);
    f.move(1);
    expect(f.deadline.remaining()).toBe(0);
  });
  it("charges response latency and suspended wall time without minting authority", () => {
    const f = fixture();
    f.move(8000);
    expect(f.deadline.remaining()).toBe(292000);
    f.move(292000, 0);
    expect(f.deadline.remaining()).toBe(0);
  });
  it("clock rollback and elapsed-clock reset irreversibly lock", () => {
    const f = fixture();
    f.move(10000);
    expect(f.deadline.remaining()).toBe(290000);
    f.move(-1000, 100);
    expect(f.deadline.remaining()).toBe(0);
    f.move(1000);
    expect(f.deadline.remaining()).toBe(0);
    const reset = fixture();
    reset.move(10, -1);
    expect(reset.deadline.remaining()).toBe(0);
  });
  it("refuses absent, expired, malformed and overlong session metadata", () => {
    for (const overrides of [
      { sessionId: "" },
      { principal: "" },
      { csrf: "" },
      { expiresAt: identity.checkedAt },
      { checkedAt: "invalid" },
      { expiresAt: "2026-11-17T18:00:00.001Z" },
    ])
      expect(fixture(overrides).deadline.remaining()).toBe(0);
  });
});
