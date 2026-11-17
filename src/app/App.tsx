import { SongAccess } from "../features/library/SongAccess";
import { PwaStatus } from "./PwaStatus";
import { useCallback, useRef, useState } from "react";
import { useLibrary } from "../features/library/useLibrary";
import { NameDialog } from "../features/library/NameDialog";
import { Sketch } from "../features/library/Sketch";
import {
  downloadText,
  exportBackup,
  importBackup,
  copyBackupLibrary,
  MAX_IMPORT_BYTES,
} from "../features/library/backup";
import type { LibraryStore } from "../features/library/storage";
import { PrivateLibraryStore } from "../features/library/privateStorage";
import type { SessionInfo } from "../shared/auth/session";
import type { Command } from "../features/library/domain";

export function App({
  store,
  identity,
}: { store?: LibraryStore; identity?: SessionInfo } = {}) {
  const { session, loadError } = useLibrary(store);
  const [selected, setSelected] = useState<string | null>(() =>
    new URL(location.href).searchParams.get("song"),
  );
  const [group, setGroup] = useState("all");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<
    "song" | "repertoire" | { id: string; title: string } | null
  >(null);
  const [error, setError] = useState("");
  const [importEpoch, setImportEpoch] = useState(0);
  // Interaction drafts survive sketch remounts while persistence remains queued.
  const [noteDrafts, setNoteDrafts] = useState<ReadonlyMap<string, string>>(
    () => new Map(),
  );
  const [libraryOpen, setLibraryOpen] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const importCopy = useRef(false);
  const library = session?.data;
  const edit = session?.mode === "edit";
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
      className={`app ${edit ? "editing" : "performing"}`}
      data-build-revision={import.meta.env.VITE_SCOREMAP_BUILD ?? "development"}
    >
      <header className="app-header">
        <div className="brand">
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
          {identity && (
            <button
              type="button"
              onClick={() => {
                void session.whenIdle().then(async () => {
                  if (
                    session.error &&
                    !window.confirm(
                      "Your unsaved work will remain protected for this account. Sign out now?",
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
                  form.submit();
                });
              }}
            >
              Sign out
            </button>
          )}
          <PwaStatus
            beforeUpdate={async () => {
              await session.whenIdle();
              if (session.error)
                throw new Error(
                  "Export or save your unsaved work before updating.",
                );
            }}
            report={report}
          />
          <span className="save-state" role="status">
            {session.error
              ? "Unsaved changes"
              : session.pending
                ? identity
                  ? "Saving to your private library…"
                  : "Saving on this device…"
                : identity
                  ? "Saved to your private library"
                  : "Saved on this device"}
          </span>
          <button
            type="button"
            className="mode-button"
            aria-pressed={!edit}
            onClick={() => {
              void session.whenIdle().then(() => {
                const mode = edit ? "performance" : "edit";
                session.setMode(mode);
                try {
                  localStorage.setItem("scoremap-view-mode", mode);
                } catch {
                  /* A missing preference store does not block consultation. */
                }
              });
            }}
          >
            {edit ? "Enter performance" : "Switch to edit"}
          </button>
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
              downloadText(exportBackup(library), "scoremap-backup.json")
            }
          >
            Export your work
          </button>
          {!session.error && (
            <button type="button" onClick={() => setError("")}>
              Dismiss
            </button>
          )}
        </div>
      )}
      {store instanceof PrivateLibraryStore && store.pendingRecovery && (
        <div className="notice" role="status">
          <span>
            Protected pending work from your previous session is available.
          </span>
          <button
            type="button"
            onClick={() => {
              void store
                .recoverPending()
                .then((value) =>
                  downloadText(
                    exportBackup(value),
                    "scoremap-pending-recovery.json",
                  ),
                )
                .catch(report);
            }}
          >
            Export pending work to compare
          </button>
        </div>
      )}
      <div className="workspace">
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
                  aria-label={`Open repertoire ${rep.title}`}
                  onClick={() => {
                    setGroup(rep.id);
                    setSelected(null);
                  }}
                >
                  {rep.title}
                  <span>{rep.songIds.length}</span>
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
            <button
              type="button"
              onClick={() => {
                void session
                  .whenIdle()
                  .then(() =>
                    downloadText(
                      exportBackup(session.data!),
                      "scoremap-backup.json",
                    ),
                  );
              }}
            >
              Export backup
            </button>
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
                      let imported = importBackup(await file.text());
                      if (identity && importCopy.current)
                        imported = copyBackupLibrary(imported);
                      await session.whenIdle();
                      if (
                        !window.confirm(
                          identity
                            ? `Import ${imported.songs.length} songs and ${imported.repertoires.length} repertoires into your private library${importCopy.current ? " as new copies with new identities" : " preserving their identities"}? Existing music and the original file will be kept.`
                            : "Replace your entire local library with this backup? Export your current work first if you want to keep it.",
                        )
                      )
                        return;
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
                    {canDeleteSong && (
                      <button
                        type="button"
                        className="danger-link"
                        onClick={() => {
                          if (
                            window.confirm(
                              `Delete song “${song.title}” and all its sections, notes and attachments?`,
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
                <SongAccess
                  key={song.id}
                  store={store}
                  songId={song.id}
                  editable={edit}
                />
              )}
              <Sketch
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
              <span className="welcome-symbol" aria-hidden="true">
                ♮
              </span>
              <p className="eyebrow">A CLEARER VIEW OF YOUR MUSIC</p>
              <h2>
                Your next song,
                <br />
                mapped out.
              </h2>
              <p>
                Shape the sections. Keep your chords and cues together.
                <br />
                Take a clear sketch to rehearsal and performance.
              </p>
              {songEdit && (
                <button
                  type="button"
                  className="primary"
                  onClick={() => setModal("song")}
                >
                  Create your first song
                </button>
              )}
              <p className="muted">
                No account. Your own music. Ready offline after the first load.
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
