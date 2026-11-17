export interface SessionInfo {
  authenticated: true;
  principal: string;
  name: string;
  csrf: string;
  sessionId: string;
  checkedAt: string;
  expiresAt: string;
}
