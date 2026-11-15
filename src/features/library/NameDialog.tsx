import { useEffect, useRef, useState } from "react";
export function NameDialog({
  title,
  initial = "",
  onSave,
  onClose,
}: {
  title: string;
  initial?: string;
  onSave: (name: string) => Promise<void>;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const dialog = ref.current!;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  return (
    <dialog ref={ref} aria-labelledby="dialog-title" onCancel={onClose}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const name = String(
            new FormData(event.currentTarget).get("name") ?? "",
          );
          setBusy(true);
          void onSave(name)
            .then(onClose)
            .catch((e: unknown) => {
              setError(e instanceof Error ? e.message : "Could not save.");
              setBusy(false);
            });
        }}
      >
        <h2 id="dialog-title">{title}</h2>
        <label>
          Name
          <input name="name" defaultValue={initial} required autoFocus />
        </label>
        {error && <p role="alert">{error}</p>}
        <div className="actions">
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="primary" disabled={busy}>
            Save
          </button>
        </div>
      </form>
    </dialog>
  );
}
