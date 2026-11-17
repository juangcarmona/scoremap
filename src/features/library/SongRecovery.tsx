import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Song } from "./domain";
import type { PrivateLibraryStore } from "./privateStorage";
import { useNotation } from "../../shared/music/NotationContext";
import { formatChordSymbol } from "../../shared/music/notation";
import { downloadText, exportBackup } from "./backup";
import { isRichSong } from "./score";

type RetainedSong = { id: string; title: string; revision: number };
type Version = {
  revision: number;
  content: Song;
  deleted: boolean;
  created: string;
  actor: string | null;
  operation:
    | "create"
    | "edit"
    | "import"
    | "delete"
    | "restore"
    | "legacy-source"
    | null;
  baseRevision: number | null;
  sourceRevision: number | null;
  commandId: string | null;
};
type RecoveryProps = {
  store: PrivateLibraryStore;
  editable: boolean;
  recover: (work: () => Promise<unknown>) => Promise<void>;
};

export function SongHistory({
  store,
  song,
  editable,
  recover,
  deleted = false,
}: RecoveryProps & {
  song: RetainedSong;
  deleted?: boolean;
}) {
  const { preference } = useNotation();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("");
  const history = useQuery({
    queryKey: [
      "song-history",
      store.identity.principal,
      song.id,
      song.revision,
    ],
    queryFn: () =>
      store.request<Version[]>(
        `/api/songs/${encodeURIComponent(song.id)}/history`,
      ),
    enabled: open,
    retry: false,
  });
  async function exportVersion(revision: number) {
    const current = await store.request<Version[]>(
      `/api/songs/${encodeURIComponent(song.id)}/history`,
    );
    const version = current.find((entry) => entry.revision === revision);
    if (!version)
      throw new Error(
        "This historical version is no longer available. Reload before exporting.",
      );
    downloadText(
      exportBackup({
        schemaVersion: isRichSong(version.content) ? 2 : 1,
        revision: 0,
        songs: [version.content],
        repertoires: [],
      }),
      `scoremap-song-version-${version.revision}.json`,
    );
  }
  const canRestore =
    editable && (deleted || store.capabilities[song.id] !== "viewer");
  return (
    <details
      className="notice"
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary>
        {deleted ? `Retained history · ${song.title}` : "Song history"}
      </summary>
      {history.isPending && <p role="status">Loading saved versions…</p>}
      {history.error && <p role="alert">{history.error.message}</p>}
      {history.isSuccess && history.data.length === 0 && (
        <p>No saved versions are available.</p>
      )}
      {history.data?.map((version) => (
        <details key={version.revision}>
          <summary>
            Version {version.revision}
            {version.deleted ? " · deleted" : ""} ·{" "}
            {new Date(version.created).toLocaleString()}
          </summary>
          <p>
            {version.operation === "legacy-source"
              ? "Original legacy import source; its author was not recorded."
              : version.actor
                ? `${version.actor === store.identity.principal ? "You" : "Another authorized contributor"} · ${version.operation ?? "saved"}`
                : "Author and operation were not recorded for this older version."}
            {version.baseRevision !== null &&
              version.baseRevision !== undefined &&
              ` · Based on version ${version.baseRevision}`}
            {version.sourceRevision !== null &&
              version.sourceRevision !== undefined &&
              ` · Restored from version ${version.sourceRevision}`}
          </p>
          <h3>{version.content.title}</h3>
          {version.content.artist && <p>{version.content.artist}</p>}
          <p>{version.content.notes}</p>
          <button
            type="button"
            onClick={() =>
              void exportVersion(version.revision).catch((error: unknown) =>
                setStatus(
                  error instanceof Error
                    ? error.message
                    : "The historical version could not be exported.",
                ),
              )
            }
          >
            Export version {version.revision}
          </button>
          {version.content.sections.map((section) => (
            <div key={section.id}>
              <h4>
                {section.name} · repeat {section.repeat}
              </h4>
              <p>
                {section.chords
                  .map((chord) => formatChordSymbol(chord, preference))
                  .join(" · ")}
              </p>
              <p>{section.notes}</p>
            </div>
          ))}
          {canRestore && !version.deleted && (
            <button
              type="button"
              onClick={() => {
                if (
                  !window.confirm(
                    `Restore version ${version.revision} of “${song.title}” as a new saved version? Current history will be kept. Former sharing permissions and repertoire memberships will not be restored.`,
                  )
                )
                  return;
                setStatus("");
                void recover(() =>
                  store.recoverSong(
                    song.id,
                    "restore",
                    song.revision,
                    version.revision,
                  ),
                )
                  .then(() => {
                    setStatus("Version restored to your private library.");
                    return history.refetch();
                  })
                  .catch((error: unknown) =>
                    setStatus(
                      error instanceof Error
                        ? error.message
                        : "The version could not be restored.",
                    ),
                  );
              }}
            >
              Restore version {version.revision}
            </button>
          )}
        </details>
      ))}
      <p role="status">{status}</p>
    </details>
  );
}

export function DeletedSongs({
  store,
  editable,
  recover,
  revision,
}: RecoveryProps & { revision: number }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("");
  const trash = useQuery({
    queryKey: ["deleted-songs", store.identity.principal, revision],
    queryFn: () => store.request<RetainedSong[]>("/api/trash"),
    enabled: open,
    retry: false,
  });
  async function act(song: RetainedSong, operation: "restore" | "purge") {
    let confirmation: string | undefined;
    if (operation === "purge") {
      const title = window.prompt(
        `Permanently remove “${song.title}” and ALL its saved musical history? This cannot be undone. Previous exports and operator backups are separate. Type the exact song title to confirm.`,
      );
      if (title === null) return;
      if (title !== song.title) {
        setStatus("The title did not match. Nothing was removed.");
        return;
      }
      confirmation = title;
    } else if (
      !window.confirm(
        `Restore “${song.title}”? Former sharing permissions and repertoire memberships will stay removed.`,
      )
    )
      return;
    setStatus("");
    try {
      await recover(() =>
        store.recoverSong(
          song.id,
          operation,
          song.revision,
          undefined,
          confirmation,
        ),
      );
      setStatus(
        operation === "purge"
          ? "Song and saved history permanently removed."
          : "Song restored to your private library.",
      );
      await trash.refetch();
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Recovery could not be completed.",
      );
    }
  }
  return (
    <details
      className="notice"
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary>Deleted songs</summary>
      <p>
        Only you can recover your deleted songs. They remain here until you
        explicitly remove them permanently.
      </p>
      {trash.isPending && <p role="status">Loading deleted songs…</p>}
      {trash.error && <p role="alert">{trash.error.message}</p>}
      {trash.isSuccess && trash.data.length === 0 && <p>No deleted songs.</p>}
      {trash.data?.map((song) => (
        <section key={song.id} aria-label={`Deleted song ${song.title}`}>
          <h3>{song.title}</h3>
          <SongHistory
            store={store}
            song={song}
            editable={editable}
            recover={recover}
            deleted
          />
          {editable && (
            <>
              <button
                type="button"
                onClick={() => {
                  void act(song, "restore");
                }}
              >
                Restore song
              </button>
              <button
                type="button"
                className="danger-link"
                onClick={() => {
                  void act(song, "purge");
                }}
              >
                Remove permanently
              </button>
            </>
          )}
        </section>
      ))}
      <p role="status">{status}</p>
    </details>
  );
}
