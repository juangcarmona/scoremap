import { afterEach, expect, it } from "vitest";
import {
  OfflineAuthority,
  type OfflineLeaseInfo,
} from "../src/shared/auth/offlineLease";
import type { SessionInfo } from "../src/shared/auth/session";
const start = Date.parse("2026-11-17T10:00:00Z");
const identity: SessionInfo = {
  authenticated: true,
  principal: "synthetic-principal",
  name: "Synthetic",
  sessionId: "session",
  csrf: "synthetic",
  checkedAt: new Date(start).toISOString(),
  expiresAt: new Date(start + 8 * 3600000).toISOString(),
};
const authorities: OfflineAuthority[] = [];
afterEach(() => authorities.splice(0).forEach((authority) => authority.stop()));
function fixture(minutes = 480, knownMinutes = 480) {
  let wall = 0,
    elapsed = 0,
    locks = 0;
  const authority = new OfflineAuthority({
    wall: () => wall,
    elapsed: () => elapsed,
  });
  authorities.push(authority);
  authority.subscribe(() => locks++);
  const info: OfflineLeaseInfo = {
    id: "lease",
    principal: identity.principal,
    sessionId: identity.sessionId,
    checkedAt: new Date(start).toISOString(),
    expiresAt: new Date(start + minutes * 60000).toISOString(),
    authorizationExpiresAt: new Date(start + 8 * 3600000).toISOString(),
    configuredMinutes: minutes,
    scope: {
      songs: { S: "editor" },
      personal: true,
      repertoires: true,
      createSongs: true,
    },
  };
  const person = {
    ...identity,
    expiresAt: new Date(start + knownMinutes * 60000).toISOString(),
  };
  return {
    authority,
    info,
    person,
    activate: () => authority.activate(info, person, { wall: 0, elapsed: 0 }),
    move: (ms: number, elapsedMs = ms) => {
      wall += ms;
      elapsed += elapsedMs;
    },
    locks: () => locks,
  };
}
it("starts no offline authority from login, restart or a generic success and exposes only the explicit song scope", () => {
  const f = fixture();
  expect(f.authority.matches(identity)).toBe(false);
  expect(f.authority.allowsSong("S", true)).toBe(false);
  f.activate();
  expect(f.authority.matches(identity)).toBe(true);
  expect(f.authority.allowsSong("S", true)).toBe(true);
  expect(f.authority.allowsSong("T", false)).toBe(false);
  for (const id of ["__proto__", "constructor", "toString"])
    expect(f.authority.allowsSong(id, false)).toBe(false);
  expect(f.authority.matches({ ...identity, principal: "another" })).toBe(
    false,
  );
  const restarted = new OfflineAuthority();
  authorities.push(restarted);
  expect(restarted.matches(identity)).toBe(false);
});
it("SB-LEASE-EXPIRY domain deadline witness: locks at the exact eight-hour bound and repeated offline reads or edits never renew it", () => {
  const f = fixture();
  f.activate();
  f.move(8 * 3600000 - 1);
  expect(f.authority.allowsSong("S", true)).toBe(true);
  expect(f.authority.remaining()).toBe(1);
  f.move(1);
  expect(f.authority.allowsSong("S", false)).toBe(false);
  expect(f.locks()).toBe(1);
  f.move(1000);
  expect(f.authority.remaining()).toBe(0);
  expect(f.locks()).toBe(1);
});
it("ends at earlier configured or known session expiry and charges complete response latency", () => {
  const configured = fixture(1);
  configured.move(5000);
  configured.activate();
  expect(configured.authority.remaining()).toBe(55000);
  configured.move(55000);
  expect(configured.authority.remaining()).toBe(0);
  const earlier = fixture(480, 5);
  earlier.activate();
  earlier.move(5 * 60000);
  expect(earlier.authority.remaining()).toBe(0);
});
it("irreversibly locks on wall rollback, elapsed reset and unknown authority", () => {
  const rollback = fixture();
  rollback.activate();
  rollback.move(1000);
  expect(rollback.authority.remaining()).toBeGreaterThan(0);
  rollback.move(-500, 1);
  expect(rollback.authority.remaining()).toBe(0);
  rollback.move(1000);
  expect(rollback.authority.remaining()).toBe(0);
  const reset = fixture();
  reset.activate();
  reset.move(100, -1);
  expect(reset.authority.remaining()).toBe(0);
  const stopped = fixture();
  stopped.activate();
  stopped.authority.stop();
  expect(stopped.authority.allowsSong("S", true)).toBe(false);
});
it("refuses overlong, disabled, wrong-session and unsupported scope metadata without creating authority", () => {
  for (const change of [
    { configuredMinutes: 481 },
    { configuredMinutes: 0 },
    { sessionId: "other" },
    { expiresAt: new Date(start + 8 * 3600000 + 1).toISOString() },
    {
      scope: {
        songs: { S: "administrator" },
        personal: true,
        repertoires: true,
        createSongs: true,
      },
    },
  ]) {
    const f = fixture();
    expect(() =>
      f.authority.activate(
        { ...f.info, ...change } as OfflineLeaseInfo,
        identity,
        { wall: 0, elapsed: 0 },
      ),
    ).toThrow();
    expect(f.authority.matches(identity)).toBe(false);
  }
});
