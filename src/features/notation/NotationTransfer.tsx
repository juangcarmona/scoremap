import { useRef, useState } from "react";
import { useNotation } from "../../shared/music/NotationContext";
import { usePersonalEditBarrier } from "../../shared/personalEdit/PersonalEditBarrier";
import {
  exportNotationPreference,
  importNotationPreference,
  MAX_NOTATION_TRANSFER_BYTES,
} from "./notationTransfer";

export function NotationTransfer() {
  const state = useNotation();
  const barrier = usePersonalEditBarrier();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  function exportFile() {
    setBusy(true);
    setMessage("");
    const check = barrier.beginNotation();
    try {
      void barrier
        .runNotation(async () => {
          const { preference, sourceRevision } = await state.exportSnapshot();
          check();
          const url = URL.createObjectURL(
            new Blob([exportNotationPreference(preference, sourceRevision)], {
              type: "application/json",
            }),
          );
          const link = document.createElement("a");
          link.href = url;
          link.download = "scoremap-note-names.json";
          link.click();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        })
        .catch((error: unknown) =>
          setMessage(
            error instanceof Error
              ? error.message
              : "Note names could not be exported.",
          ),
        )
        .finally(() => setBusy(false));
    } catch (error) {
      setBusy(false);
      setMessage(
        error instanceof Error
          ? error.message
          : "Note names could not be exported.",
      );
    }
  }
  function importFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setMessage("");
    const check = barrier.beginNotation();
    try {
      void barrier
        .runNotation(async () => {
          if (file.size > MAX_NOTATION_TRANSFER_BYTES)
            throw new Error(
              "This note-name file is too large. Your settings are unchanged.",
            );
          const transfer = importNotationPreference(await file.text());
          check();
          if (
            !window.confirm(
              "Replace your note-name preference with the setting from this file? Your songs are unchanged.",
            )
          )
            return;
          check();
          state.choose(transfer.preference);
          setMessage(
            "Note-name change requested. Check the save status above.",
          );
        })
        .catch((error: unknown) =>
          setMessage(
            error instanceof Error
              ? error.message
              : "Note names could not be imported.",
          ),
        )
        .finally(() => setBusy(false));
    } catch (error) {
      setBusy(false);
      setMessage(
        error instanceof Error
          ? error.message
          : "Note names could not be imported.",
      );
    }
  }
  return (
    <details>
      <summary>Back up note names</summary>
      <p>Note names are transferred separately from song backups.</p>
      <button
        type="button"
        disabled={busy || state.loading || state.pending || !!state.error}
        onClick={exportFile}
      >
        Export note names
      </button>
      <label>
        Import note names{" "}
        <input
          ref={input}
          type="file"
          accept="application/json,.json"
          disabled={busy || state.loading || state.pending || !!state.error}
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            event.currentTarget.value = "";
            importFile(file);
          }}
        />
      </label>
      {message && <p role="status">{message}</p>}
    </details>
  );
}
