import { OfflinePreparation } from "../features/library/OfflinePreparation";
import { DeviceProvider } from "../features/library/DeviceContext";
import { DeviceConfigurations } from "../features/library/DeviceConfigurations";
import { PersonalRecovery } from "../features/library/PersonalRecovery";
import {
  PersonalEditProvider,
  usePersonalEditBarrier,
} from "../features/library/PersonalEditBarrier";
import { ImportPreview } from "../features/library/ImportPreview";
import type { ImportProvenance } from "../features/library/importSelection";
import { IndexedLibraryStore } from "../features/library/storage";
import { PendingWork } from "../features/library/PendingWork";
import { copySongIdentities } from "../features/library/identityCopy";
import { VoicingPresets } from "../features/library/VoicingPresets";
import {
  PresetProvider,
  useAuthorizeSongExport,
} from "../features/library/PresetContext";
import { isRichSong } from "../features/library/score";
import {
  occupiedIdentities,
  planSongMigration,
} from "../features/library/migrationPlanning";
import { SongAccess } from "../features/library/SongAccess";
import {
  NotationProvider,
  NotationControl,
} from "../features/notation/NotationPreference";
import { SongHistory, DeletedSongs } from "../features/library/SongRecovery";
import { PwaStatus } from "./PwaStatus";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useLibrary } from "../features/library/useLibrary";
import { NameDialog } from "../features/library/NameDialog";
import { Sketch } from "../features/library/Sketch";
import {
  downloadText,
  exportBackup,
  importBackup,
  MAX_IMPORT_BYTES,
} from "../features/library/backup";
import type { LibraryStore } from "../features/library/storage";
import { PrivateLibraryStore } from "../features/library/privateStorage";
import type { SessionInfo } from "../shared/auth/session";
import type { Library } from "../features/library/domain";
import type { Command } from "../features/library/domain";

export function App(
  props: { store?: LibraryStore; identity?: SessionInfo } = {},
) {
  const { store } = props;
  return (
    <NotationProvider
      {...(store instanceof PrivateLibraryStore
        ? { store: store.notation, principal: store.identity.principal }
        : {})}
    >
      <PresetProvider
        store={store instanceof PrivateLibraryStore ? store : undefined}
      >
        <DeviceProvider
          store={store instanceof PrivateLibraryStore ? store : undefined}
        >
          <PersonalEditProvider>
            <LibraryApp {...props} />
          </PersonalEditProvider>
        </DeviceProvider>
      </PresetProvider>
    </NotationProvider>
  );
}
function LibraryApp({
  store,
  identity,
}: { store?: LibraryStore; identity?: SessionInfo } = {}) {
  const { session, loadError } = useLibrary(store);
  const personalEdit = usePersonalEditBarrier();
  const [switchingMode, setSwitchingMode] = useState(false);
  const authorizeExport = useAuthorizeSongExport();
  const [selected, updateSelected] = useState<string | null>(() =>
    new URL(location.href).searchParams.get("song"),
  );
  const [group, setGroup] = useState("all");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<
    "song" | "repertoire" | { id: string; title: string } | null
  >(null);
  const [error, setError] = useState("");
  const [transfer, setTransfer] = useState<{
    source: Library;
    kind: ImportProvenance["kind"];
    copy: boolean;
  } | null>(null);
  const [transferResult, setTransferResult] = useState("");
  const [importEpoch, setImportEpoch] = useState(0);
  const [previewDirty, setPreviewDirtyState] = useState(false);
  const previewDirtyRef = useRef(false);
  function setPreviewDirty(value: boolean) {
    previewDirtyRef.current = value;
    setPreviewDirtyState(value);
  }
  useEffect(() => {
    const protect = (event: BeforeUnloadEvent) => {
      if (previewDirty) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", protect);
    return () => window.removeEventListener("beforeunload", protect);
  }, [previewDirty]);
  function leavePreview() {
    if (
      previewDirty &&
      !window.confirm(
        "Discard the uncommitted played-note preview? Export or apply it first if you want to keep it.",
      )
    )
      return false;
    if (previewDirty) {
      setPreviewDirty(false);
      setImportEpoch((epoch) => epoch + 1);
    }
    return true;
  }
  function setSelected(id: string | null) {
    if (leavePreview()) updateSelected(id);
  }

  const [recovering, setRecovering] = useState(false);
  const [migrationSources, setMigrationSources] = useState<
    Awaited<
      ReturnType<
        import("../features/library/application").LibrarySession["migrationSources"]
      >
    >
  >([]);
  // Interaction drafts survive sketch remounts while persistence remains queued.
  const [noteDrafts, setNoteDrafts] = useState<ReadonlyMap<string, string>>(
    () => new Map(),
  );
  const [libraryOpen, setLibraryOpen] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const importCopy = useRef(false);
  const library = session?.data;
  const protectedPending =
    store instanceof PrivateLibraryStore && store.pendingRecovery;
  const edit = session?.mode === "edit" && !protectedPending;
  useLayoutEffect(() => {
    personalEdit.setEditing(session?.mode === "edit");
  }, [session?.mode, personalEdit]);
  const activeRep = library?.repertoires.find((r) => r.id === group);
  const memberIds = new Set(library?.repertoires.flatMap((r) => r.songIds));
  const songs =
    library?.songs.filter(
      (s) =>
        (group === "all" ||
          (group === "unassigned"
            ? !memberIds.has(s.id)
            : activeRep?.songIds.includes(s.id))) &&
        `${s.title} ${s.artist}`.toLowerCase().includes(search.toLowerCase()),
    ) ?? [];
  const song = library?.songs.find((s) => s.id === selected) ?? songs[0];
  const songEdit =
    edit &&
    (!(store instanceof PrivateLibraryStore) ||
      !song ||
      store.capabilities[song.id] !== "viewer");
  const canDeleteSong =
    !(store instanceof PrivateLibraryStore) ||
    (song && store.capabilities[song.id] === "owner");
  const report = useCallback(
    (e: unknown) =>
      setError(
        e instanceof Error
          ? e.message
          : "The operation could not be completed.",
      ),
    [],
  );
  const execute = async (command: Command) => {
    setError("");
    if (!session) throw new Error("The library is still loading.");
    await session.execute(command);
  };
  async function recover(work: () => Promise<unknown>) {
    if (!session) throw new Error("The library is still loading.");
    setRecovering(true);
    try {
      await session.reconcile(work);
      setError("");
      setNoteDrafts(new Map());
      setImportEpoch((value) => value + 1);
    } finally {
      setRecovering(false);
    }
  }
  function selectSong(id: string) {
    setSelected(id);
    const url = new URL(location.href);
    url.searchParams.set("song", id);
    history.replaceState(null, "", url);
    setLibraryOpen(false);
  }
  async function saveName(name: string) {
    if (modal === "song") {
      const id = crypto.randomUUID();
      await execute({ type: "createSong", id, title: name });
      if (activeRep)
        await execute({
          type: "addMembership",
          repertoireId: activeRep.id,
          songId: id,
        });
      selectSong(id);
    } else if (modal === "repertoire") {
      const id = crypto.randomUUID();
      await execute({ type: "createRepertoire", id, title: name });
      setGroup(id);
      setSelected(null);
    } else if (modal)
      await execute({
        type: "renameRepertoire",
        repertoireId: modal.id,
        title: name,
      });
  }
  if (loadError)
    return (
      <main className="startup">
        <h1>ScoreMap</h1>
        <div role="alert">
          <h2>
            {identity
              ? "Your private library could not be opened."
              : "Your local library could not be opened."}
          </h2>
          <p>{loadError}</p>
          <p>
            Your existing data has not been replaced. Keep this browser’s site
            data; use a compatible ScoreMap version or recover from your
            exported backup.
          </p>
          <button type="button" onClick={() => location.reload()}>
            Try opening again
          </button>
        </div>
      </main>
    );
  if (!session || !library)
    return (
      <main className="startup">
        <h1>ScoreMap</h1>
        <p role="status">
          {identity
            ? "Opening your private music…"
            : "Opening your local music…"}
        </p>
      </main>
    );
  return (
    <div
      className={`app ${edit ? "editing" : "performing"}${identity ? " private-library" : ""}`}
      data-build-revision={import.meta.env.VITE_SCOREMAP_BUILD ?? "development"}
    >
      <header className="app-header" inert={recovering || session.reconciling}>
        <div className={`brand${identity ? " private-brand" : ""}`}>
          <h1>
            ScoreMap
            <span className="brand-mark" aria-hidden="true">
              ▦
            </span>
          </h1>
          <p>
            {identity
              ? `${identity.name} · Private library`
              : "Your sheet music, mapped out."}
          </p>
        </div>
        <div className="top-actions">
          <NotationControl />
          {identity && (
            <button
              type="button"
              onClick={() => {
                if (!leavePreview()) return;
                void (async () => {
                  let protectedWork = true;
                  try {
                    await session.whenProtected();
                  } catch {
                    protectedWork = false;
                  }
                  if (
                    (session.pending ||
                      session.error ||
                      protectedPending ||
                      (store instanceof PrivateLibraryStore &&
                        (await store.personal.list()).length > 0) ||
                      !protectedWork) &&
                    !window.confirm(
                      protectedWork
                        ? "An operation is still awaiting confirmation. Sign out now? Saved music and protected pending work will be kept."
                        : "This device could not protect the latest changes. Signing out may lose those changes. Continue?",
                    )
                  )
                    return;
                  const form = document.createElement("form");
                  form.method = "post";
                  form.action = "/auth/logout";
                  const csrf = document.createElement("input");
                  csrf.type = "hidden";
                  csrf.name = "__RequestVerificationToken";
                  csrf.value = identity.csrf;
                  form.append(csrf);
                  document.body.append(form);
                  if (store instanceof PrivateLibraryStore) store.lockAccess();
                  form.submit();
                })().catch(report);
              }}
            >
              Sign out
            </button>
          )}
          <PwaStatus
            privateLibrary={!!identity}
            beforeUpdate={async () => {
              await session.whenIdle();
              // Let the acknowledged editor operation settle its preview before checking.
              await new Promise<void>((resolve) => setTimeout(resolve, 0));
              if (previewDirtyRef.current)
                throw new Error(
                  "Apply or export your played-note preview before updating.",
                );
              if (session.error)
                throw new Error(
                  "Export or save your unsaved work before updating.",
                );
            }}
            report={report}
          />
          <span className="save-state" role="status">
            {protectedPending
              ? "Pending save needs review"
              : session.error
                ? "Unsaved changes"
                : session.pending
                  ? identity
                    ? "Saving to your private library…"
                    : "Saving on this device…"
                  : identity
                    ? store instanceof PrivateLibraryStore &&
                      navigator.onLine === false &&
                      store.offlineReady
                      ? "Offline copy · last service save"
                      : "Saved to your private library"
                    : "Saved on this device"}
          </span>
          <button
            type="button"
            className="mode-button"
            disabled={switchingMode}
            aria-pressed={session.mode !== "edit"}
            onClick={() => {
              if (!leavePreview()) return;
              setSwitchingMode(true);
              if (edit) personalEdit.setEditing(false);
              void Promise.all([session.whenIdle(), personalEdit.whenIdle()])
                .then(() => {
                  const mode = edit ? "performance" : "edit";
                  session.setMode(mode);
                  try {
                    localStorage.setItem("scoremap-view-mode", mode);
                  } catch {
                    /* A missing preference store does not block consultation. */
                  }
                })
                .catch(() => {
                  personalEdit.setEditing(session.mode === "edit");
                  setError(
                    "Could not finish saving. Review the error and retry before entering performance.",
                  );
                })
                .finally(() => setSwitchingMode(false));
            }}
          >
            {protectedPending
              ? "Review pending work before editing"
              : edit
                ? "Enter performance"
                : "Switch to edit"}
          </button>
          {switchingMode && (
            <span role="status">Finishing save before changing mode…</span>
          )}
          <button
            type="button"
            className="library-toggle"
            aria-expanded={libraryOpen}
            onClick={() => setLibraryOpen(!libraryOpen)}
          >
            Library
          </button>
        </div>
      </header>
      {store instanceof PrivateLibraryStore && (
        <OfflinePreparation store={store} session={session} />
      )}
      {store instanceof PrivateLibraryStore && (
        <PersonalRecovery
          store={store.personal}
          editing={session.mode === "edit"}
          reopen={async () => {
            await session.whenProtected();
            window.location.reload();
          }}
        />
      )}
      {(error || session.error) && (
        <div role="alert" className="notice error">
          <span>{session.error || error}</span>
          {session.error && edit && (
            <button
              type="button"
              onClick={() => {
                void session.retrySave().catch(report);
              }}
            >
              Retry save
            </button>
          )}
          <button
            type="button"
            onClick={() =>
              void authorizeExport()
                .then(() =>
                  downloadText(exportBackup(library), "scoremap-backup.json"),
                )
                .catch(report)
            }
          >
            Export your work
          </button>
          {session.error && store instanceof PrivateLibraryStore && (
            <button
              type="button"
              onClick={() => {
                if (
                  window.confirm(
                    "Discard the unsaved changes on this device and reopen your saved private library?",
                  )
                )
                  void store
                    .discardPending()
                    .then(() => location.reload())
                    .catch(report);
              }}
            >
              Discard unsaved work
            </button>
          )}
          {!session.error && (
            <button type="button" onClick={() => setError("")}>
              Dismiss
            </button>
          )}
        </div>
      )}
      {transfer && store instanceof PrivateLibraryStore && (
        <ImportPreview
          source={transfer.source}
          kind={transfer.kind}
          copy={transfer.copy}
          destination={library}
          onClose={() => setTransfer(null)}
          onImport={async (imported, source) => {
            try {
              if (!leavePreview()) return;
              await session.whenIdle();
              await session.replace(
                {
                  ...session.data!,
                  songs: [...session.data!.songs, ...imported.songs],
                  repertoires: [
                    ...session.data!.repertoires,
                    ...imported.repertoires,
                  ],
                },
                true,
                source,
              );
              const acknowledged = structuredClone(session.data!);
              await store.verifyImported(acknowledged, imported);
              setImportEpoch((n) => n + 1);
              setNoteDrafts(new Map());
              setSelected(null);
              setGroup("all");
              setSearch("");
              setError("");
              setTransferResult(
                `${imported.songs.length} selected songs imported and verified from your private library. The original ${source.kind === "anonymous" ? "browser library" : "file"} is kept.`,
              );
            } catch (failure) {
              report(failure);
            } finally {
              setTransfer(null);
            }
          }}
        />
      )}
      {transferResult && (
        <p className="notice" role="status">
          {transferResult}
        </p>
      )}
      {store instanceof PrivateLibraryStore && protectedPending && (
        <PendingWork
          store={store}
          current={library}
          editing={session.mode === "edit"}
          retry={() => recover(() => store.retryPending())}
          copy={(songId) => recover(() => store.copyPendingSong(songId))}
          removed={() => setImportEpoch((epoch) => epoch + 1)}
          report={report}
        />
      )}
      {identity &&
        store instanceof PrivateLibraryStore &&
        store.protectedOnDevice &&
        session.pending > 0 && (
          <p className="notice" role="status">
            Your latest changes are protected on this device. Waiting for
            confirmation from your private library.
          </p>
        )}
      {recovering && (
        <p className="notice" role="status">
          Saving your recovery operation to the private library…
        </p>
      )}
      <div className="workspace" inert={recovering || session.reconciling}>
        <aside
          className={`library ${libraryOpen ? "open" : ""}`}
          aria-label="Music library"
        >
          <div className="library-heading">
            <h2>Your music</h2>
            {edit && (
              <button
                type="button"
                className="small-button"
                onClick={() => setModal("repertoire")}
              >
                New repertoire
              </button>
            )}
          </div>
          <nav aria-label="Repertoires">
            <button
              type="button"
              className={group === "all" ? "active" : ""}
              onClick={() => {
                setGroup("all");
                setSelected(null);
              }}
            >
              All songs<span>{library.songs.length}</span>
            </button>
            <button
              type="button"
              className={group === "unassigned" ? "active" : ""}
              onClick={() => {
                setGroup("unassigned");
                setSelected(null);
              }}
            >
              Outside repertoires
            </button>
            {library.repertoires.map((rep) => (
              <div className="repertoire-row" key={rep.id}>
                <button
                  type="button"
                  className={group === rep.id ? "active" : ""}
                  aria-label={`Open repertoire ${rep.title} ${rep.songIds.length}`}
                  onClick={() => {
                    setGroup(rep.id);
                    setSelected(null);
                  }}
                >
                  {rep.title} <span>{rep.songIds.length}</span>
                </button>
                {edit && (
                  <button
                    type="button"
                    className="rename-repertoire"
                    aria-label={`Rename repertoire ${rep.title}`}
                    onClick={() => setModal({ id: rep.id, title: rep.title })}
                  >
                    ✎
                  </button>
                )}
              </div>
            ))}
          </nav>
          <div className="song-list-heading">
            <h2>
              {activeRep?.title ??
                (group === "unassigned" ? "Outside repertoires" : "Songs")}
            </h2>
            {edit && (
              <button
                type="button"
                className="primary"
                onClick={() => setModal("song")}
              >
                New song
              </button>
            )}
          </div>
          <label className="search-label">
            Find a song
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Title or artist"
            />
          </label>
          <ul className="song-list">
            {songs.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  aria-current={song?.id === s.id ? "true" : undefined}
                  onClick={() => selectSong(s.id)}
                >
                  <strong>{s.title}</strong>
                  {s.artist && <span>{s.artist}</span>}
                </button>
              </li>
            ))}
          </ul>
          {songs.length === 0 && (
            <p className="muted library-empty">
              {search
                ? "No matching songs."
                : edit
                  ? "Your music starts here. Create a song when you are ready."
                  : "No songs in this selection."}
            </p>
          )}
          <footer className="library-footer">
            <VoicingPresets editable={edit} />
            <DeviceConfigurations editable={edit} />
            {store instanceof PrivateLibraryStore && (
              <DeletedSongs
                store={store}
                editable={edit}
                recover={recover}
                revision={library.revision}
              />
            )}
            <button
              type="button"
              onClick={() => {
                void session
                  .whenIdle()
                  .then(() => authorizeExport())
                  .then(() =>
                    downloadText(
                      exportBackup(session.data!),
                      "scoremap-backup.json",
                    ),
                  )
                  .catch(report);
              }}
            >
              Export backup
            </button>
            {!identity && (
              <details
                onToggle={(event) => {
                  if (event.currentTarget.open)
                    void session
                      .migrationSources()
                      .then(setMigrationSources)
                      .catch(report);
                }}
              >
                <summary>Originals before migration</summary>
                {migrationSources.length === 0 && (
                  <p>No migrated originals are retained in this browser.</p>
                )}
                {migrationSources.map((source) => (
                  <button
                    key={source.key}
                    type="button"
                    onClick={() =>
                      downloadText(
                        exportBackup(source.library),
                        `scoremap-${source.key}.json`,
                      )
                    }
                  >
                    {source.key.startsWith("migration-import-")
                      ? "Export imported original"
                      : "Export previous library"}{" "}
                    · before save {Number(source.key.split(":")[1]) + 1}
                  </button>
                ))}
              </details>
            )}
            {edit && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    importCopy.current = false;
                    fileInput.current?.click();
                  }}
                >
                  Import backup
                </button>
                {identity && (
                  <button
                    type="button"
                    onClick={() => {
                      importCopy.current = true;
                      fileInput.current?.click();
                    }}
                  >
                    Import as new copies
                  </button>
                )}
                {identity && (
                  <button
                    type="button"
                    onClick={() => {
                      void (async () => {
                        await session.whenIdle();
                        const anonymous = new IndexedLibraryStore();
                        try {
                          const source = await anonymous.load();
                          setTransferResult("");
                          setTransfer({
                            source,
                            kind: "anonymous",
                            copy: false,
                          });
                        } finally {
                          await anonymous.close();
                        }
                      })().catch(report);
                    }}
                  >
                    Import songs from this browser
                  </button>
                )}
                <input
                  ref={fileInput}
                  type="file"
                  accept="application/json,.json"
                  aria-label="Import backup file"
                  hidden
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    if (!file) return;
                    void (async () => {
                      if (file.size > MAX_IMPORT_BYTES)
                        throw new Error(
                          "This backup exceeds the 64 MiB import limit.",
                        );
                      const imported = importBackup(await file.text());
                      await session.whenIdle();
                      if (identity) {
                        setTransferResult("");
                        setTransfer({
                          source: imported,
                          kind: "backup",
                          copy: importCopy.current,
                        });
                        return;
                      }
                      if (
                        !window.confirm(
                          identity
                            ? `Import ${imported.songs.length} songs and ${imported.repertoires.length} repertoires into your private library${importCopy.current ? " as new copies with new identities" : " preserving their identities"}? Existing music and the original file will be kept.`
                            : "Replace your entire local library with this backup? Export your current work first if you want to keep it.",
                        )
                      )
                        return;
                      if (!leavePreview()) return;
                      await session.replace(
                        identity
                          ? {
                              ...session.data!,
                              songs: [
                                ...session.data!.songs,
                                ...imported.songs,
                              ],
                              repertoires: [
                                ...session.data!.repertoires,
                                ...imported.repertoires,
                              ],
                            }
                          : imported,
                        true,
                      );
                      setImportEpoch((n) => n + 1);
                      setNoteDrafts(new Map());
                      setSelected(null);
                      setGroup("all");
                      setSearch("");
                      setError("");
                    })().catch(report);
                  }}
                />
                {activeRep && (
                  <button
                    type="button"
                    className="danger-link"
                    onClick={() => {
                      if (
                        window.confirm(
                          `Delete repertoire “${activeRep.title}”? Its songs will be kept.`,
                        )
                      )
                        void execute({
                          type: "deleteRepertoire",
                          repertoireId: activeRep.id,
                        })
                          .then(() => {
                            setGroup("all");
                            setSelected(null);
                          })
                          .catch(report);
                    }}
                  >
                    Delete repertoire
                  </button>
                )}
              </>
            )}
            <p>
              {identity
                ? "Your private library is stored on your server."
                : "Your library stays on this device."}
              <br />
              Keep a backup of your work.
            </p>
          </footer>
        </aside>
        <main className="song-workspace">
          {song ? (
            <>
              <header className="song-header">
                <div>
                  <p className="eyebrow">
                    {edit ? "PREPARE YOUR SKETCH" : "PERFORMANCE · READ ONLY"}
                  </p>
                  <h2>{song.title}</h2>
                  {song.artist && <p className="artist">{song.artist}</p>}
                </div>
                {songEdit && (
                  <div className="song-menu">
                    {activeRep ? (
                      <button
                        type="button"
                        onClick={() => {
                          void execute({
                            type: "removeMembership",
                            songId: song.id,
                            repertoireId: activeRep.id,
                          })
                            .then(() => setSelected(null))
                            .catch(report);
                        }}
                      >
                        Remove from repertoire
                      </button>
                    ) : (
                      library.repertoires.length > 0 && (
                        <form
                          aria-label="Add song to repertoire"
                          onSubmit={(e) => {
                            e.preventDefault();
                            const id = String(
                              new FormData(e.currentTarget).get("repertoire"),
                            );
                            void execute({
                              type: "addMembership",
                              songId: song.id,
                              repertoireId: id,
                            }).catch(report);
                          }}
                        >
                          <label>
                            Add to repertoire
                            <select name="repertoire" required defaultValue="">
                              <option value="" disabled>
                                Choose repertoire
                              </option>
                              {library.repertoires
                                .filter((r) => !r.songIds.includes(song.id))
                                .map((r) => (
                                  <option value={r.id} key={r.id}>
                                    {r.title}
                                  </option>
                                ))}
                            </select>
                          </label>
                          <button type="submit">Add song</button>
                        </form>
                      )
                    )}
                    {!isRichSong(song) && (
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            !window.confirm(
                              "Enable arrangements for this song? Existing song/section identities, chords, order and notes will be preserved. Legacy chords gain identified quarter-note positions in 4/4 measures. One unassigned part is created; no played notes are invented. The original remains recoverable.",
                            )
                          )
                            return;
                          void session
                            .whenIdle()
                            .then(async () => {
                              if (session.error)
                                throw new Error(
                                  "Save or export your pending work before upgrading this song.",
                                );
                              const current = session.data!.songs.find(
                                (entry) => entry.id === song.id,
                              );
                              if (!current || isRichSong(current))
                                throw new Error(
                                  "The song changed. Reload before upgrading it.",
                                );
                              const mapping = await planSongMigration(
                                current,
                                occupiedIdentities(session.data),
                              );
                              await execute({
                                type: "enableArrangements",
                                songId: current.id,
                                mapping,
                              });
                              setImportEpoch((epoch) => epoch + 1);
                            })
                            .catch(report);
                        }}
                      >
                        Enable arrangements
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        if (!leavePreview()) return;
                        if (
                          !window.confirm(
                            `Make an independent copy of “${song.title}”? All music and arrangements receive new identities; this original and its memberships stay unchanged.`,
                          )
                        )
                          return;
                        const identities: Record<string, string> =
                          Object.create(null);
                        copySongIdentities(
                          song,
                          (id) => (identities[id] ??= crypto.randomUUID()),
                        );
                        void execute({
                          type: "duplicateSong",
                          songId: song.id,
                          expected: structuredClone(song),
                          identities,
                        })
                          .then(() => setSelected(identities[song.id]!))
                          .catch(report);
                      }}
                    >
                      Make independent song copy
                    </button>
                    {canDeleteSong && (
                      <button
                        type="button"
                        className="danger-link"
                        onClick={() => {
                          if (
                            window.confirm(
                              identity
                                ? `Move “${song.title}” to deleted songs? Its music and history will remain recoverable only by you. Sharing permissions and repertoire memberships will be removed.`
                                : `Delete song “${song.title}” and all its sections, notes and attachments?`,
                            )
                          )
                            void execute({
                              type: "deleteSong",
                              songId: song.id,
                            })
                              .then(() => setSelected(null))
                              .catch(report);
                        }}
                      >
                        Delete song
                      </button>
                    )}
                  </div>
                )}
              </header>
              {store instanceof PrivateLibraryStore && song && (
                <>
                  <SongAccess
                    key={song.id}
                    store={store}
                    songId={song.id}
                    editable={edit}
                  />
                  <SongHistory
                    key={`${song.id}-${library.revision}-${importEpoch}`}
                    store={store}
                    song={{
                      id: song.id,
                      title: song.title,
                      revision: store.version(song.id),
                    }}
                    editable={edit}
                    recover={recover}
                  />
                </>
              )}
              <Sketch
                previewDirty={previewDirty}
                onPreviewDirty={setPreviewDirty}
                key={`${song.id}-${importEpoch}`}
                song={song}
                noteDrafts={noteDrafts}
                setNoteDraft={(id, text) =>
                  setNoteDrafts((drafts) => new Map(drafts).set(id, text))
                }
                mode={songEdit ? session.mode : "performance"}
                execute={execute}
                report={report}
              />
              <details className="references">
                <summary>
                  External references
                  {song.references.length ? ` (${song.references.length})` : ""}
                </summary>
                <p className="muted">
                  External pages need an internet connection. They open
                  separately.
                </p>
                <ul>
                  {song.references.map((ref) => (
                    <li key={ref.id}>
                      <a
                        href={ref.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {ref.title} ↗
                      </a>
                      {songEdit && (
                        <button
                          type="button"
                          aria-label={`Remove reference ${ref.title}`}
                          onClick={() => {
                            void execute({
                              type: "removeReference",
                              songId: song.id,
                              referenceId: ref.id,
                            }).catch(report);
                          }}
                        >
                          Remove
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
                {songEdit && (
                  <form
                    aria-label="Add external reference"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const form = e.currentTarget,
                        data = new FormData(form);
                      void execute({
                        type: "addReference",
                        songId: song.id,
                        reference: {
                          id: crypto.randomUUID(),
                          title: String(data.get("title")),
                          url: String(data.get("url")),
                        },
                      })
                        .then(() => form.reset())
                        .catch(report);
                    }}
                  >
                    <label>
                      Reference name
                      <input name="title" required />
                    </label>
                    <label>
                      Web link
                      <input
                        name="url"
                        type="url"
                        placeholder="https://…"
                        required
                      />
                    </label>
                    <button type="submit">Add reference</button>
                  </form>
                )}
              </details>
            </>
          ) : (
            <div className="welcome">
              <h2>
                {library.songs.length === 0
                  ? "Your music starts here"
                  : "No songs in this selection"}
              </h2>
              <p>
                {library.songs.length === 0
                  ? songEdit
                    ? "Create a song or import an existing ScoreMap backup to get started."
                    : "Switch to edit mode to create or import a song."
                  : "Choose another repertoire or adjust your search to find a song."}
              </p>
              {songEdit && library.songs.length === 0 && (
                <div className="welcome-actions">
                  <button
                    type="button"
                    className="primary"
                    onClick={() => setModal("song")}
                  >
                    Create your first song
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      importCopy.current = false;
                      fileInput.current?.click();
                    }}
                  >
                    Import a backup
                  </button>
                </div>
              )}
              <p className="muted">
                {identity
                  ? "Changes are saved to your private library."
                  : "Your music is saved on this device and available offline after the first load."}
              </p>
            </div>
          )}
        </main>
      </div>
      {modal && (
        <NameDialog
          title={
            modal === "song"
              ? "New song"
              : modal === "repertoire"
                ? "New repertoire"
                : "Rename repertoire"
          }
          initial={typeof modal === "object" ? modal.title : ""}
          onSave={saveName}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
