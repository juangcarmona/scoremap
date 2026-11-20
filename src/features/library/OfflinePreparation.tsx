import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { PrivateLibraryStore } from "./privateStorage";
import type { LibrarySession } from "./application";
import type { OfflineLeaseInfo } from "../../shared/auth/offlineLease";
export function OfflinePreparation({
  store,
  session,
}: {
  store: PrivateLibraryStore;
  session: LibrarySession;
}) {
  const client = useQueryClient();
  const [info, setInfo] = useState<OfflineLeaseInfo | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [expanded, setExpanded] = useState(session.mode === "edit");
  const [disconnected, setDisconnected] = useState(navigator.onLine === false);
  useEffect(() => setExpanded(session.mode === "edit"), [session.mode]);
  useEffect(() => store.offline.subscribe(() => setInfo(null)), [store]);
  useEffect(() => {
    const offline = () => setDisconnected(true),
      online = () => setDisconnected(false);
    window.addEventListener("offline", offline);
    window.addEventListener("online", online);
    return () => {
      window.removeEventListener("offline", offline);
      window.removeEventListener("online", online);
    };
  }, []);
  if (!store.identity.privateOfflineMinutes && !info) return null;
  return (
    <section
      className="notice offline-preparation"
      aria-label="Private offline preparation"
    >
      <details
        open={expanded}
        onToggle={(event) => setExpanded(event.currentTarget.open)}
      >
        <summary>Prepare for temporary offline use</summary>
        <p>
          Prepare this library and your personal settings while connected. Only
          the checked songs and permissions are covered. Restarting without a
          connection locks the copy. Reconnecting locks private work until
          current permissions are checked; changes never replay automatically.
        </p>
        <button
          type="button"
          disabled={busy || disconnected || session.reconciling}
          onClick={() => {
            void (async () => {
              setBusy(true);
              setError("");
              try {
                await session.whenIdle();
                if (session.error || session.pending || !session.data)
                  throw new Error(
                    "Confirm or recover pending saves before preparing offline use.",
                  );
                const prepared = await store.prepareOffline(session.data);
                const keys = [
                  ["voicing-presets", store.identity.principal],
                  ["device-configurations", store.identity.principal],
                ];
                await Promise.all(
                  keys.map((queryKey) => client.cancelQueries({ queryKey })),
                );
                const personal = store.preparedPersonal();
                client.setQueryData(keys[0]!, personal.presets);
                client.setQueryData(keys[1]!, personal.deviceConfigurations);
                setInfo(prepared);
              } catch (error) {
                setInfo(null);
                setError(
                  error instanceof Error
                    ? error.message
                    : "Offline preparation was not confirmed. Stay connected and try again.",
                );
              } finally {
                setBusy(false);
              }
            })();
          }}
        >
          {busy
            ? "Protecting the prepared copy…"
            : "Prepare private offline copy"}
        </button>
      </details>
      {info && (
        <p role="status">
          {disconnected
            ? "Offline: using the protected prepared scope."
            : "Offline copy protected and ready."}{" "}
          Access ends at {new Date(info.expiresAt).toLocaleTimeString()}. Local
          changes remain unconfirmed until a service commit.
        </p>
      )}
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
