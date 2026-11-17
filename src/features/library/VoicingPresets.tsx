import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePresetStore } from "./PresetContext";
import {
  validatePreset,
  type SavedPreset,
  type VoicingPreset,
} from "./voicingPresets";
import { savedPreset } from "./presetStorage";
import { presetImportPlan, finishPresetImport } from "./presetImport";
import { downloadText, MAX_IMPORT_BYTES } from "./backup";
import { requireValue, object, array, sameData } from "./validation";
import { useNotation } from "../../shared/music/NotationContext";
import { formatChordSymbol, formatNote } from "../../shared/music/notation";
export function VoicingPresets({
  editable,
  capture,
  onApply,
}: {
  editable: boolean;
  capture?: () => Omit<VoicingPreset, "id" | "name">;
  onApply?: (preset: SavedPreset) => void;
}) {
  const store = usePresetStore();
  const { preference } = useNotation();
  const presets = useQuery({
    queryKey: ["voicing-presets", store.scope],
    queryFn: () => store.list(),
  });
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [failure, setFailure] = useState("");
  const draftId = useRef(crypto.randomUUID());
  const file = useRef<HTMLInputElement>(null);
  async function act(work: () => Promise<unknown>, success: string) {
    setBusy(true);
    setFailure("");
    setStatus("");
    try {
      if ((await work()) !== false) setStatus(success);
    } catch (error) {
      setFailure(
        error instanceof Error
          ? error.message
          : "The preset operation failed. Keep or export your preview.",
      );
    } finally {
      await presets.refetch();
      setBusy(false);
    }
  }
  return (
    <details className="song-details">
      <summary>
        {store.scope === "anonymous"
          ? "Reusable voicings on this device"
          : "Your private reusable voicings"}
      </summary>
      <p>
        These resources belong to you separately from songs. Using one creates
        an independent copy; later preset edits do not change that song.
      </p>
      {presets.isPending && (
        <p role="status">Loading your reusable voicings…</p>
      )}
      {presets.error && <p role="alert">{presets.error.message}</p>}
      {failure && <p role="alert">{failure}</p>}
      {status && <p role="status">{status}</p>}
      {capture && editable && (
        <form
          className="builder-controls"
          onSubmit={(event) => {
            event.preventDefault();
            void act(async () => {
              const preset = validatePreset({
                ...capture(),
                id: draftId.current,
                name,
              });
              await store.mutate({
                operation: "save",
                id: preset.id,
                expectedRevision: 0,
                mode: "edit",
                content: preset,
              });
              draftId.current = crypto.randomUUID();
              setName("");
            }, "Reusable voicing saved. Song copies are unchanged.");
          }}
        >
          <label>
            Reusable voicing name
            <input
              aria-label="Reusable voicing name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              disabled={busy}
            />
          </label>
          <button type="submit" disabled={busy}>
            Save preview as reusable voicing
          </button>
        </form>
      )}
      {presets.isSuccess && presets.data.length === 0 && (
        <p>No reusable voicings yet.</p>
      )}
      <ul className="note-occurrences">
        {presets.data?.map((saved) => {
          const preset = saved.preset!;
          return (
            <li key={saved.id}>
              <strong>
                {preset.name} · version {saved.revision}
              </strong>
              <span>
                {formatChordSymbol(preset.harmony, preference)} ·{" "}
                {preset.pitches
                  .map((pitch) =>
                    formatNote(`${pitch.spelling}${pitch.octave}`, preference),
                  )
                  .join(" · ") || "Silent"}
              </span>
              {onApply && (
                <button
                  type="button"
                  disabled={!editable || busy}
                  onClick={() => onApply(saved)}
                >
                  Use copy of {preset.name}
                </button>
              )}
              {editable && (
                <>
                  {capture && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        if (
                          !window.confirm(
                            `Update reusable voicing “${preset.name}” from this played-note preview? This creates a new preset version; existing song copies stay unchanged.`,
                          )
                        )
                          return;
                        void act(
                          () =>
                            store.mutate({
                              operation: "save",
                              id: saved.id,
                              expectedRevision: saved.revision,
                              mode: "edit",
                              content: validatePreset({
                                ...capture(),
                                id: saved.id,
                                name: preset.name,
                              }),
                            }),
                          "Preset updated as a new independent version; existing song copies are unchanged.",
                        );
                      }}
                    >
                      Update {preset.name} from preview
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      const next = window.prompt(
                        "Rename this independently owned voicing? Existing song copies will stay unchanged.",
                        preset.name,
                      );
                      if (next !== null)
                        void act(
                          () =>
                            store.mutate({
                              operation: "save",
                              id: saved.id,
                              expectedRevision: saved.revision,
                              mode: "edit",
                              content: { ...preset, name: next },
                            }),
                          "Preset renamed as a new version; song copies are unchanged.",
                        );
                    }}
                  >
                    Rename {preset.name}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      if (
                        window.confirm(
                          `Delete reusable voicing “${preset.name}”? Existing song copies and their pitches will remain unchanged.`,
                        )
                      )
                        void act(
                          () =>
                            store.mutate({
                              operation: "delete",
                              id: saved.id,
                              expectedRevision: saved.revision,
                              mode: "edit",
                              content: null,
                            }),
                          "Reusable voicing deleted; song copies are unchanged.",
                        );
                    }}
                  >
                    Delete preset {preset.name}
                  </button>
                </>
              )}
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        disabled={!presets.isSuccess || busy}
        onClick={() =>
          void store
            .list()
            .then((current) =>
              downloadText(
                JSON.stringify(
                  {
                    format: "scoremap-voicing-presets",
                    version: 1,
                    presets: current,
                  },
                  null,
                  2,
                ),
                "scoremap-owned-voicings.json",
              ),
            )
            .catch((error: unknown) =>
              setFailure(
                error instanceof Error
                  ? error.message
                  : "Your voicings could not be exported.",
              ),
            )
        }
      >
        Export reusable voicings
      </button>
      {editable && (
        <>
          <button
            type="button"
            disabled={busy}
            onClick={() => file.current?.click()}
          >
            Import reusable voicing copies
          </button>
          <input
            type="file"
            accept="application/json,.json"
            aria-label="Reusable voicing import file"
            ref={file}
            hidden
            onChange={(event) => {
              const selected = event.target.files?.[0];
              event.target.value = "";
              if (!selected) return;
              void act(async () => {
                requireValue(
                  selected.size <= MAX_IMPORT_BYTES,
                  "This preset backup exceeds the supported import limit. Keep the source file.",
                );
                const raw = await selected.text();
                const envelope: unknown = JSON.parse(raw);
                object(envelope, ["format", "version", "presets"]);
                requireValue(
                  envelope.format === "scoremap-voicing-presets" &&
                    envelope.version === 1,
                  "Unsupported reusable-voicing backup. Keep the source file.",
                );
                array(envelope.presets);
                const originals = envelope.presets.map(savedPreset);
                requireValue(
                  originals.every((value) => value.preset !== null),
                  "A preset backup must contain complete active content.",
                );
                if (
                  !window.confirm(
                    `Import ${originals.length} reusable voicings as new copies? Each voicing is saved separately; the original file and existing presets are kept.`,
                  )
                )
                  return false;
                const { key, plan } = await presetImportPlan(
                  store.scope,
                  raw,
                  originals.length,
                );
                const acknowledged = await store.list();
                let committed = 0;
                try {
                  for (const [index, original] of originals.entries()) {
                    const content = {
                      ...original.preset!,
                      id: plan.ids[index]!,
                    };
                    const existing = acknowledged.find(
                      (value) => value.id === content.id,
                    );
                    if (existing)
                      requireValue(
                        sameData(existing.preset, content),
                        "A resource from this import changed. Compare it before continuing.",
                      );
                    else
                      await store.mutate(
                        {
                          operation: "save",
                          id: content.id,
                          expectedRevision: 0,
                          mode: "edit",
                          content,
                        },
                        plan.commands[index],
                      );
                    committed++;
                  }
                  await finishPresetImport(key);
                } catch {
                  throw new Error(
                    `${committed} of ${originals.length} voicings saved. Keep the original file and compare the saved list before importing the remainder.`,
                  );
                }
              }, "Reusable voicing import completed. Review the saved list; source files are kept.");
            }}
          />
        </>
      )}
    </details>
  );
}
