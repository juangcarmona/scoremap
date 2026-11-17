import { sameData } from "./validation";
import { useState } from "react";
import type { Library, Song } from "./domain";
import { exportBackup, downloadText } from "./backup";
import { isRichSong } from "./score";
import type { PrivateLibraryStore } from "./privateStorage";

function description(song: Song) {
  const form = `${song.sections.length} sections`;
  if (!isRichSong(song)) return form;
  const parts = song.arrangements.flatMap((arrangement) => arrangement.parts);
  return `${form}, ${song.arrangements.length} arrangements, ${parts.length} parts, ${parts.reduce((count, part) => count + part.events.length, 0)} performed notes`;
}

export function PendingWork({
  store,
  current,
  editing,
  retry,
  removed,
  report,
}: {
  store: PrivateLibraryStore;
  current: Library;
  editing: boolean;
  retry: () => Promise<unknown>;
  removed: () => void;
  report: (error: unknown) => void;
}) {
  const [pending, setPending] = useState<Library | null>(null);
  const [busy, setBusy] = useState(false);
  async function run(work: () => Promise<unknown>) {
    setBusy(true);
    try {
      await work();
    } catch (error) {
      report(error);
    } finally {
      setBusy(false);
    }
  }
  const differences =
    pending?.songs.filter(
      (song) =>
        !sameData(
          song,
          current.songs.find((saved) => saved.id === song.id),
        ),
    ) ?? [];
  const removals = pending
    ? current.songs.filter(
        (song) => !pending.songs.some((draft) => draft.id === song.id),
      )
    : [];
  return (
    <section
      className="notice"
      aria-label="Protected pending work"
      aria-busy={busy}
    >
      <h2>Review your pending work</h2>
      <p>
        A previous save has not been confirmed. Your current saved library is
        available below; review this protected draft before editing again.
      </p>
      <div className="button-row">
        <button
          type="button"
          disabled={busy}
          onClick={() =>
            void run(async () => setPending(await store.recoverPending()))
          }
        >
          Review pending work
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() =>
            void run(async () =>
              downloadText(
                exportBackup(await store.recoverPending()),
                "scoremap-pending-recovery.json",
              ),
            )
          }
        >
          Export pending work to compare
        </button>
      </div>
      {pending && (
        <div>
          <p>
            Draft based on library revision {pending.revision}. Current saved
            library revision {current.revision}. No changes have been replayed.
          </p>
          {differences.length === 0 && removals.length === 0 && (
            <p>
              The song content matches your saved library. Repertoire changes
              and the original save receipt are checked when you retry.
            </p>
          )}
          <ul>
            {differences.map((song) => (
              <li key={song.id}>
                <strong>{song.title}</strong>: {description(song)}.{" "}
                {current.songs.some((saved) => saved.id === song.id)
                  ? "Changed from the saved song."
                  : "Not present in the current library."}
                <details>
                  <summary>Draft reminders</summary>
                  <p>{song.notes || "No song reminder."}</p>
                  {song.sections.map((section) => (
                    <p key={section.id}>
                      {section.name}: {section.notes || "No reminder."}
                    </p>
                  ))}
                </details>
              </li>
            ))}
          </ul>
          {removals.length > 0 && (
            <p>
              Absent from this draft:{" "}
              {removals.map((song) => song.title).join(", ")}. A stale retry
              cannot delete newer music.
            </p>
          )}
          <p>
            Retry checks the original revision and your current permissions. If
            newer changes exist, keep the export and use “Import as new copies”
            after explicitly removing this pending record. Your saved songs will
            be kept.
          </p>
          <button
            type="button"
            disabled={busy || !editing}
            onClick={() =>
              void run(async () => {
                await retry();
                setPending(null);
              })
            }
          >
            Retry original save
          </button>
        </div>
      )}
      <button
        type="button"
        disabled={busy}
        className="danger-link"
        onClick={() => {
          if (
            window.confirm(
              "Remove this account's protected pending work from this browser? Export it first if you want to keep it. Saved songs and your anonymous library will be kept.",
            )
          )
            void run(async () => {
              await store.discardPending();
              setPending(null);
              removed();
            });
        }}
      >
        Remove protected pending work
      </button>
    </section>
  );
}
