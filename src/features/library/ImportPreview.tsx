import { useEffect, useRef, useState } from "react";
import type { Library } from "./domain";
import { selectImport, type ImportProvenance } from "./importSelection";
export function ImportPreview({
  source,
  destination,
  kind,
  copy,
  onImport,
  onClose,
}: {
  source: Library;
  destination: Library;
  kind: ImportProvenance["kind"];
  copy: boolean;
  onImport: (library: Library, provenance: ImportProvenance) => Promise<void>;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [selected, setSelected] = useState(source.songs.map((song) => song.id));
  const [repertoires, setRepertoires] = useState(true);
  const [copied, setCopied] = useState(copy);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const collisions =
    !copied &&
    (source.songs.some(
      (song) =>
        selected.includes(song.id) &&
        destination.songs.some((existing) => existing.id === song.id),
    ) ||
      (repertoires &&
        source.repertoires.some(
          (repertoire) =>
            repertoire.songIds.some((id) => selected.includes(id)) &&
            destination.repertoires.some(
              (existing) => existing.id === repertoire.id,
            ),
        )));
  useEffect(() => {
    const dialog = ref.current!;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby="import-preview-title"
      onCancel={(event) => {
        if (busy) event.preventDefault();
        else onClose();
      }}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setError("");
          try {
            const library = selectImport(source, selected, repertoires, copied);
            if (collisions)
              throw new Error(
                "Some identities already exist. Choose independent copies or cancel; existing music is kept.",
              );
            if (
              !window.confirm(
                `Import ${library.songs.length} selected songs and ${library.repertoires.length} repertoires${copied ? " as independent copies" : " preserving their identities"}? Existing music and the original source will be kept.`,
              )
            )
              return;
            setBusy(true);
            void onImport(library, {
              kind,
              schemaVersion: source.schemaVersion,
              revision: source.revision,
              songCount: library.songs.length,
              repertoireCount: library.repertoires.length,
              copied,
            })
              .then(onClose)
              .catch((failure: unknown) => {
                setError(
                  failure instanceof Error
                    ? failure.message
                    : "Import could not be confirmed. Keep the source and review pending work.",
                );
                setBusy(false);
              });
          } catch (failure) {
            setError(
              failure instanceof Error
                ? failure.message
                : "The selection is invalid.",
            );
          }
        }}
      >
        <h2 id="import-preview-title">Import selected songs</h2>
        <p>
          {kind === "anonymous"
            ? "Songs saved anonymously in this browser"
            : "ScoreMap backup"}{" "}
          · source revision {source.revision}. Each selected song includes every
          arrangement, part, note and binding. Your existing private library and
          original source are kept.
        </p>
        <fieldset disabled={busy}>
          <legend>Songs to import</legend>
          {source.songs.length === 0 && (
            <p>This source contains no songs to claim.</p>
          )}
          {source.songs.map((song) => (
            <label key={song.id}>
              <input
                type="checkbox"
                checked={selected.includes(song.id)}
                onChange={(event) =>
                  setSelected((current) =>
                    event.target.checked
                      ? [...current, song.id]
                      : current.filter((id) => id !== song.id),
                  )
                }
              />
              {song.title}
            </label>
          ))}
          <label>
            <input
              type="checkbox"
              checked={repertoires}
              onChange={(event) => setRepertoires(event.target.checked)}
            />
            Include source repertoires with memberships limited to selected
            songs
          </label>
          <label>
            <input
              type="checkbox"
              checked={copied}
              onChange={(event) => setCopied(event.target.checked)}
            />
            Create independent copies with new identities
          </label>
        </fieldset>
        {collisions && (
          <p role="alert">
            Some selected identities already exist. Choose independent copies or
            cancel. Nothing has been imported.
          </p>
        )}
        <p>
          Selected: {selected.length} of {source.songs.length}. Personal
          preferences and reusable resources have their own separate import
          controls.
        </p>
        {error && <p role="alert">{error}</p>}
        <div className="actions">
          <button type="button" disabled={busy} onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            className="primary"
            disabled={busy || collisions || selected.length === 0}
          >
            {busy ? "Checking saved import…" : "Import selection"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
