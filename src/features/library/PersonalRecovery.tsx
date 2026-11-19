import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PersonalPending, type PersonalKey } from "./personalPending";
import { downloadText } from "./backup";
import { useEditAdmission } from "./useEditAdmission";
import { usePersonalEditBarrier } from "./PersonalEditBarrier";

export function PersonalRecovery({
  store,
  reopen,
  editing,
}: {
  editing: boolean;
  store: PersonalPending;
  reopen: () => Promise<void>;
}) {
  const beginEdit = useEditAdmission(editing);
  const barrier = usePersonalEditBarrier();
  const client = useQueryClient();
  const key = ["personal-pending", store.principal];
  const records = useQuery({
    networkMode: "always",
    refetchOnReconnect: false,
    queryKey: key,
    queryFn: () => store.list(),
    retry: false,
  });
  const [selected, setSelected] = useState<PersonalKey | null>(null);
  const [preview, setPreview] = useState<unknown>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(
    () =>
      store.subscribe(() => {
        void client.invalidateQueries({
          queryKey: ["personal-pending", store.principal],
        });
      }),
    [client, store],
  );
  async function act(work: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await work();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "The personal change is still unconfirmed and protected.",
      );
    } finally {
      setBusy(false);
    }
  }
  if (!records.data?.length && !records.error) return null;
  return (
    <section
      className="notice personal-recovery"
      aria-label="Protected personal changes"
    >
      <h2>Personal changes awaiting confirmation</h2>
      <p>
        These protected settings and reusable resources have a separate save.
        Nothing is replayed automatically. Review and retry the original
        command, export it for comparison, or explicitly remove it.
      </p>
      {records.error && (
        <p role="alert">
          Personal drafts could not be listed. Existing records have been kept.
        </p>
      )}
      {records.data?.map((record, index) => (
        <div key={JSON.stringify(record.key)}>
          <p>
            Personal draft {index + 1} ·{" "}
            {record.kind === "notation"
              ? "Note names"
              : record.kind === "preset"
                ? "Reusable voicing"
                : "Keyboard configuration"}
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              void act(async () => {
                setPreview(null);
                setSelected(null);
                const value = await store.review(record.key);
                setSelected(record.key);
                setPreview(value);
              });
            }}
          >
            Review personal draft {index + 1}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              if (
                window.confirm(
                  "Remove this protected personal change without applying it? This cannot be undone. Saved music and personal resources stay unchanged.",
                )
              )
                void act(async () => {
                  await store.remove(record.key);
                  setPreview(null);
                  setSelected(null);
                });
            }}
          >
            Remove personal draft {index + 1} without opening
          </button>
        </div>
      ))}
      {preview !== null && selected && (
        <div>
          <pre aria-label="Personal draft comparison">
            {JSON.stringify(preview, null, 2)}
          </pre>
          <button
            type="button"
            disabled={
              busy ||
              (!editing && (preview as { kind?: string }).kind !== "notation")
            }
            onClick={() => {
              const localCheck = beginEdit(),
                sharedCheck = barrier.begin();
              const check = () => {
                localCheck();
                sharedCheck();
              };
              void act(async () => {
                await store.retry(
                  selected,
                  editing ? "edit" : "performance",
                  check,
                  (work) => barrier.run(check, work),
                );
                await reopen();
              });
            }}
          >
            Retry original personal change and reopen
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              void act(async () => {
                const fresh = await store.review(selected);
                downloadText(
                  JSON.stringify(fresh, null, 2),
                  "scoremap-personal-draft.json",
                );
              });
            }}
          >
            Export personal draft for comparison
          </button>
        </div>
      )}
      {(error || records.error) && (
        <p role="alert">
          {error || "The protected personal changes are still awaiting review."}
        </p>
      )}
      {busy && <p role="status">Checking your personal changes…</p>}
    </section>
  );
}
