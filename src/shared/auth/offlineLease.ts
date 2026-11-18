import {
  SessionDeadline,
  sessionClock,
  type SessionClock,
  type sessionRequestAnchor,
} from "./sessionDeadline";
import type { SessionInfo } from "./session";
export interface OfflineLeaseInfo {
  id: string;
  principal: string;
  sessionId: string;
  checkedAt: string;
  expiresAt: string;
  authorizationExpiresAt: string;
  configuredMinutes: number;
  scope: {
    songs: Record<string, "owner" | "editor" | "viewer">;
    personal: boolean;
    repertoires: boolean;
    createSongs: boolean;
  };
}
export class OfflineAuthority {
  private deadline: SessionDeadline | null = null;
  private receipt: OfflineLeaseInfo | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private listeners = new Set<() => void>();
  constructor(private clock: SessionClock = sessionClock) {}
  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
  activate(
    info: OfflineLeaseInfo,
    identity: SessionInfo,
    anchor: ReturnType<typeof sessionRequestAnchor>,
  ) {
    const checked = Date.parse(info.checkedAt),
      expires = Date.parse(info.expiresAt),
      authorization = Date.parse(info.authorizationExpiresAt),
      known = Date.parse(identity.expiresAt);
    if (
      !info.id ||
      info.principal !== identity.principal ||
      info.sessionId !== identity.sessionId ||
      !Number.isSafeInteger(info.configuredMinutes) ||
      info.configuredMinutes < 1 ||
      info.configuredMinutes > 480 ||
      !Number.isFinite(checked) ||
      !Number.isFinite(expires) ||
      !Number.isFinite(authorization) ||
      !Number.isFinite(known) ||
      expires <= checked ||
      expires > authorization ||
      expires - checked > info.configuredMinutes * 60000 ||
      !info.scope ||
      typeof info.scope.personal !== "boolean" ||
      typeof info.scope.repertoires !== "boolean" ||
      typeof info.scope.createSongs !== "boolean" ||
      !info.scope.songs ||
      typeof info.scope.songs !== "object" ||
      Array.isArray(info.scope.songs) ||
      Object.entries(info.scope.songs).some(
        ([id, role]) => !id || !["owner", "editor", "viewer"].includes(role),
      )
    ) {
      this.stop();
      throw new Error(
        "The service did not authorize a valid bounded offline scope.",
      );
    }
    const receipt = structuredClone(info);
    receipt.expiresAt = new Date(Math.min(expires, known)).toISOString();
    const deadline = new SessionDeadline(
      { ...identity, checkedAt: info.checkedAt, expiresAt: receipt.expiresAt },
      anchor,
      this.clock,
    );
    if (!deadline.remaining()) {
      this.stop();
      throw new Error(
        "Offline authorization expired before protection completed. Check online again.",
      );
    }
    if (this.timer !== null) clearTimeout(this.timer);
    this.deadline = deadline;
    this.receipt = receipt;
    this.timer = setTimeout(() => this.stop(), deadline.remaining());
  }
  remaining() {
    const remaining = this.deadline?.remaining() ?? 0;
    if (!remaining && this.receipt) this.stop();
    return remaining;
  }
  matches(identity: Pick<SessionInfo, "principal" | "sessionId">) {
    return (
      this.remaining() > 0 &&
      this.receipt?.principal === identity.principal &&
      this.receipt.sessionId === identity.sessionId
    );
  }
  allowsSong(id: string, write: boolean) {
    if (!this.remaining()) return false;
    const roles = this.receipt?.scope.songs;
    const role = roles && Object.hasOwn(roles, id) ? roles[id] : undefined;
    return (
      role !== undefined && (!write || role === "owner" || role === "editor")
    );
  }
  get info() {
    return this.remaining() && this.receipt
      ? structuredClone(this.receipt)
      : null;
  }
  stop() {
    const previous = this.receipt;
    this.receipt = null;
    this.deadline = null;
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = null;
    if (previous) for (const listener of this.listeners) listener();
  }
}
