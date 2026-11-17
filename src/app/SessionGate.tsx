import type { SessionInfo } from "../shared/auth/session";
import { useCallback, useEffect, useState } from "react";
import {
  useQuery,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { App } from "./App";
import { PrivateLibraryStore } from "../features/library/privateStorage";
const client = new QueryClient();
function PrivateSession() {
  const [locked, setLocked] = useState(false);
  const lock = useCallback(() => setLocked(true), []);
  useEffect(() => {
    window.addEventListener("offline", lock);
    return () => window.removeEventListener("offline", lock);
  }, [lock]);
  const session = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const response = await fetch("/auth/session", {
        cache: "no-store",
        credentials: "same-origin",
      });
      if (!response.ok)
        throw new Error(
          "The server cannot confirm your session. Your private music is locked.",
        );
      return (await response.json()) as SessionInfo | { authenticated: false };
    },
    retry: false,
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
  });
  const identity = session.data?.authenticated ? session.data : null;
  if (session.isPending)
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
      </main>
    );
  return (
    <OpenLibrary key={identity.principal} identity={identity} onLock={lock} />
  );
}
function OpenLibrary({
  identity,
  onLock,
}: {
  identity: SessionInfo;
  onLock: () => void;
}) {
  const [store] = useState(() => new PrivateLibraryStore(identity, onLock));
  useEffect(() => {
    const timer = window.setInterval(() => {
      void store.checkAccess().catch(onLock);
    }, 10000);
    return () => {
      clearInterval(timer);
      void store.close();
    };
  }, [store, onLock]);
  return <App store={store} identity={identity} />;
}

export function SessionGate() {
  return (
    <QueryClientProvider client={client}>
      <PrivateSession />
    </QueryClientProvider>
  );
}
