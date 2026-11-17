import type { SessionInfo } from "../shared/auth/session";
import { useCallback, useEffect, useState } from "react";
import {
  useQuery,
  useQueryClient,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { App } from "./App";
import {
  PrivateLibraryStore,
  discardProtectedPending,
} from "../features/library/privateStorage";
import {
  SessionDeadline,
  sessionRequestAnchor,
} from "../shared/auth/sessionDeadline";
const client = new QueryClient();
function PrivateSession() {
  const [locked, setLocked] = useState(false);
  const [removal, setRemoval] = useState("");
  const [lockedPrincipal, setLockedPrincipal] = useState("");
  const lock = useCallback(() => {
    const previous = client.getQueryData<{ identity: SessionInfo }>([
      "session",
    ]);
    const principal = previous?.identity.principal ?? "";
    setLockedPrincipal((current) => current || principal);
    void client.cancelQueries({ queryKey: ["session"] });
    client.removeQueries({ queryKey: ["session"] });
    setLocked(true);
  }, []);
  useEffect(() => {
    window.addEventListener("offline", lock);
    return () => window.removeEventListener("offline", lock);
  }, [lock]);
  const session = useQuery({
    queryKey: ["session"],
    enabled: !locked,
    queryFn: async ({ signal }) => {
      try {
        const anchor = sessionRequestAnchor();
        const response = await fetch("/auth/session", {
          cache: "no-store",
          credentials: "same-origin",
          signal,
        });
        if (!response.ok)
          throw new Error(
            "The server cannot confirm your session. Your private music is locked.",
          );
        const identity = (await response.json()) as
          SessionInfo | { authenticated: false };
        if (!identity.authenticated) {
          if (client.getQueryData(["session"])) lock();
          return null;
        }
        const deadline = new SessionDeadline(identity, anchor);
        if (!deadline.remaining())
          throw new Error("Your session has expired. Sign in again.");
        const previous = client.getQueryData<{
          identity: SessionInfo;
          deadline: SessionDeadline;
        } | null>(["session"]);
        if (
          previous?.identity.sessionId === identity.sessionId &&
          (!previous.deadline.remaining() ||
            Date.parse(identity.checkedAt) <
              Date.parse(previous.identity.checkedAt) - 250)
        )
          throw new Error(
            "Your previous session deadline is no longer trustworthy. Sign in again.",
          );
        return { identity, deadline };
      } catch (error) {
        if (!signal.aborted) lock();
        throw error;
      }
    },
    retry: false,
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
  });
  const identity = session.data?.identity ?? null;
  if (session.isPending && !locked)
    return (
      <main className="startup">
        <h1>ScoreMap</h1>
        <p role="status">Checking your session…</p>
      </main>
    );
  if (!identity || session.isError || locked)
    return (
      <main className="startup">
        <h1>ScoreMap</h1>
        <h2>Your private music</h2>
        <p>
          {locked || session.isError
            ? "Your session or permissions changed. Pending work is protected; sign in again to recover it."
            : "Sign in to import your ScoreMap backups, edit songs and recover your saved library on another device."}
        </p>
        <a className="mode-button" href="/auth/login">
          Sign in
        </a>
        {lockedPrincipal && locked && (
          <>
            <button
              type="button"
              onClick={() => {
                if (
                  window.confirm(
                    "Remove this account's protected pending work from this browser without opening it? Saved songs and your anonymous library will be kept.",
                  )
                )
                  void discardProtectedPending(lockedPrincipal)
                    .then(() =>
                      setRemoval(
                        "Protected pending work removed from this browser. Saved music is unchanged.",
                      ),
                    )
                    .catch(() =>
                      setRemoval(
                        "This browser could not remove the protected record. It has not been opened.",
                      ),
                    );
              }}
            >
              Remove protected pending work
            </button>
            {removal && <p role="status">{removal}</p>}
          </>
        )}
      </main>
    );
  return (
    <OpenLibrary
      key={identity.sessionId}
      identity={identity}
      deadline={session.data!.deadline}
      onLock={lock}
    />
  );
}
function OpenLibrary({
  identity,
  onLock,
  deadline,
}: {
  identity: SessionInfo;
  onLock: () => void;
  deadline: SessionDeadline;
}) {
  const [store] = useState(
    () =>
      new PrivateLibraryStore(identity, onLock, () => deadline.remaining() > 0),
  );
  const queryClient = useQueryClient();
  useEffect(() => {
    store.updateAuthorization(() => deadline.remaining() > 0);
    const checkDeadline = () => {
      if (!deadline.remaining()) store.lockAccess();
    };
    const expire = window.setTimeout(
      () => store.lockAccess(),
      deadline.remaining(),
    );
    const inspect = window.setInterval(checkDeadline, 1000);
    const offline = () => store.lockAccess();
    window.addEventListener("focus", checkDeadline);
    document.addEventListener("visibilitychange", checkDeadline);
    window.addEventListener("offline", offline);
    return () => {
      clearInterval(inspect);
      clearTimeout(expire);
      window.removeEventListener("focus", checkDeadline);
      document.removeEventListener("visibilitychange", checkDeadline);
      window.removeEventListener("offline", offline);
    };
  }, [store, deadline]);
  useEffect(() => {
    const timer = window.setInterval(() => {
      void store.checkAccess().catch(() => store.lockAccess());
    }, 10000);
    return () => {
      clearInterval(timer);
      void store.close();
      queryClient.removeQueries({
        predicate: (query) => query.queryKey[1] === identity.principal,
      });
    };
  }, [store, onLock, queryClient, identity.principal]);
  return <App store={store} identity={identity} />;
}

export function SessionGate() {
  return (
    <QueryClientProvider client={client}>
      <PrivateSession />
    </QueryClientProvider>
  );
}
