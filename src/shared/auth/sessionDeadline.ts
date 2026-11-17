import type { SessionInfo } from "./session";

export interface SessionClock {
  wall: () => number;
  elapsed: () => number;
}
export const sessionClock: SessionClock = {
  wall: () => Date.now(),
  elapsed: () => performance.now(),
};
export function sessionRequestAnchor(clock = sessionClock) {
  return { wall: clock.wall(), elapsed: clock.elapsed() };
}

// Session metadata is a deadline, not a resource permission or an offline lease.
// Charge the entire request duration against the server's remaining lifetime.
export class SessionDeadline {
  private readonly duration: number;
  private lastWall: number;
  private lastElapsed: number;
  private invalid = false;
  constructor(
    readonly identity: SessionInfo,
    private readonly anchor: ReturnType<typeof sessionRequestAnchor>,
    private readonly clock = sessionClock,
  ) {
    this.duration =
      Date.parse(identity.expiresAt) - Date.parse(identity.checkedAt);
    this.lastWall = anchor.wall;
    this.lastElapsed = anchor.elapsed;
    if (
      !identity.authenticated ||
      !identity.principal ||
      !identity.sessionId ||
      !identity.csrf ||
      !Number.isFinite(this.duration) ||
      this.duration <= 0 ||
      this.duration > 8 * 60 * 60 * 1000
    )
      this.invalid = true;
  }
  remaining() {
    const wall = this.clock.wall();
    const elapsed = this.clock.elapsed();
    // Wall-clock rollback, an elapsed-clock reset or untrustworthy time locks.
    if (
      !Number.isFinite(wall) ||
      !Number.isFinite(elapsed) ||
      wall < this.lastWall - 250 ||
      elapsed < this.lastElapsed ||
      wall < this.anchor.wall - 250 ||
      elapsed < this.anchor.elapsed
    )
      this.invalid = true;
    this.lastWall = wall;
    this.lastElapsed = elapsed;
    if (this.invalid) return 0;
    return Math.max(
      0,
      this.duration -
        Math.max(wall - this.anchor.wall, elapsed - this.anchor.elapsed),
    );
  }
}
