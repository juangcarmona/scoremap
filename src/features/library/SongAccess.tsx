import { putApiSongsByIdGrants } from "../../shared/api/private-client.gen";
import { useState } from "react";
import { PrivateLibraryStore } from "./privateStorage";
export function SongAccess({
  store,
  songId,
  editable,
}: {
  store: PrivateLibraryStore;
  songId: string;
  editable: boolean;
}) {
  const [principal, setPrincipal] = useState("");
  const [role, setRole] = useState("viewer");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  if (!editable) return null;
  if (store.capabilities[songId] !== "owner")
    return (
      <p className="muted">
        {store.capabilities[songId] === "viewer"
          ? "Read-only song shared with you"
          : "Editable song shared with you"}
      </p>
    );
  return (
    <details className="notice">
      <summary>Song access</summary>
      <p>
        Only you own this song. A grant applies to this song and its history.
      </p>
      <p>
        Your sharing identity: <code>{store.identity.principal}</code>
      </p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setBusy(true);
          setStatus("");
          void putApiSongsByIdGrants(
            store.request.bind(store),
            { id: songId },
            {
              principal,
              role: role === "revoke" ? null : role,
              mode: "edit",
            },
          )
            .then(() =>
              setStatus(
                role === "revoke" ? "Access revoked." : "Song access saved.",
              ),
            )
            .catch((error: unknown) =>
              setStatus(
                error instanceof Error
                  ? error.message
                  : "Access could not be saved.",
              ),
            )
            .finally(() => setBusy(false));
        }}
      >
        <label>
          Recipient sharing identity
          <input
            value={principal}
            onChange={(event) => setPrincipal(event.target.value)}
            required
            autoComplete="off"
          />
        </label>
        <label>
          Permission
          <select
            value={role}
            onChange={(event) => setRole(event.target.value)}
          >
            <option value="viewer">Viewer · read only</option>
            <option value="editor">Editor · change music</option>
            <option value="revoke">Revoke access</option>
          </select>
        </label>
        <button type="submit" disabled={busy}>
          {busy ? "Saving access…" : "Save access"}
        </button>
        <p role="status">{status}</p>
      </form>
    </details>
  );
}
