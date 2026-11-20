import { useNotation } from "../../shared/music/NotationContext";
import { formatNote } from "../../shared/music/notation";
import { performedPitchAt } from "../../shared/music/theory";
import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useDeviceStore } from "./DeviceContext";
import {
  savedDeviceConfiguration,
  importDeviceConfiguration,
  exportDeviceConfiguration,
} from "./deviceConfigurations";
import { PitchRange, readRange } from "./PitchRange";
import { downloadText, MAX_IMPORT_BYTES } from "./backup";
import { sameData } from "./validation";
import type { Device } from "./score";
import { useEditAdmission } from "./useEditAdmission";
import { usePersonalEditBarrier } from "../../shared/personalEdit/PersonalEditBarrier";
export function DeviceConfigurations({ editable }: { editable: boolean }) {
  const { preference } = useNotation();
  const beginEdit = useEditAdmission(editable);
  const barrier = usePersonalEditBarrier();
  function rangeText(range: [number, number]) {
    return range
      .map((midi) => {
        const pitch = performedPitchAt(midi);
        return formatNote(`${pitch.spelling}${pitch.octave}`, preference);
      })
      .join("–");
  }
  const store = useDeviceStore(),
    client = useQueryClient();
  const queryKey = ["device-configurations", store.scope];
  const resources = useQuery({
    queryKey,
    queryFn: () => store.list(),
    retry: false,
  });
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [status, setStatus] = useState("");
  const draft = useRef(crypto.randomUUID());
  async function act(work: () => Promise<void | boolean>, message: string) {
    if (busy) return;
    setBusy(true);
    setError("");
    setStatus("");
    try {
      const completed = await work();
      await client.invalidateQueries({ queryKey });
      if (completed !== false) setStatus(message);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "The configuration save is not confirmed. Keep the protected request.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <details className="song-details">
      <summary>
        {store.scope === "anonymous"
          ? "Reusable keyboard configurations on this device"
          : "Your private reusable keyboard configurations"}
      </summary>
      <p>
        Save physical ranges separately from songs. Copying a configuration into
        an arrangement creates an independent keyboard; later resource edits or
        removal do not change that song.
      </p>
      {resources.isPending && (
        <p role="status">Loading reusable configurations…</p>
      )}
      {resources.error && (
        <p role="alert">
          {resources.error.message}
          <button
            type="button"
            onClick={() => {
              void resources.refetch();
            }}
          >
            Retry configurations
          </button>
        </p>
      )}
      {editable && (
        <form
          className="configuration-form"
          aria-label="Save reusable keyboard configuration"
          onSubmit={(event) => {
            event.preventDefault();
            const form = event.currentTarget,
              values = new FormData(form);
            void act(async () => {
              const configuration: Device = {
                id: draft.current,
                name: String(values.get("name")),
                instrument: String(values.get("instrument")),
                range: readRange(values),
              };
              await barrier.run(barrier.begin(), () =>
                store.mutate({
                  operation: "save",
                  id: configuration.id,
                  expectedRevision: 0,
                  mode: "edit",
                  content: configuration,
                }),
              );
              draft.current = crypto.randomUUID();
              form.reset();
            }, "Reusable keyboard configuration saved. Song copies are unchanged.");
          }}
        >
          <fieldset disabled={busy}>
            <legend>New reusable configuration</legend>
            <label>
              Configuration name
              <input name="name" required />
            </label>
            <label>
              Instrument
              <input name="instrument" defaultValue="keyboard" required />
            </label>
            <PitchRange value={[21, 108]} />
            <button type="submit">Save reusable configuration</button>
          </fieldset>
        </form>
      )}
      {resources.isSuccess && resources.data.length === 0 && (
        <p>No reusable keyboard configurations yet.</p>
      )}
      <ul className="note-occurrences">
        {resources.data?.map((saved) => {
          const configuration = saved.configuration!;
          return (
            <li key={saved.id}>
              <strong>
                {configuration.name} · version {saved.revision}
              </strong>
              <span>
                {configuration.instrument} · physical range{" "}
                {rangeText(configuration.range)}
              </span>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  void act(async () => {
                    const current = (await store.list()).find(
                      (resource) => resource.id === saved.id,
                    );
                    if (!current || !sameData(current, saved))
                      throw new Error(
                        "This configuration changed. Reload the saved list before exporting.",
                      );
                    downloadText(
                      exportDeviceConfiguration(current),
                      "scoremap-device-configuration.json",
                    );
                  }, "Configuration export prepared. Song content is unchanged.");
                }}
              >
                Export configuration {configuration.name}
              </button>
              {editable && (
                <details>
                  <summary>Edit configuration {configuration.name}</summary>
                  <form
                    className="configuration-form"
                    aria-label={`Edit reusable configuration ${configuration.name}`}
                    key={`${saved.id}-${saved.revision}`}
                    onSubmit={(event) => {
                      event.preventDefault();
                      const values = new FormData(event.currentTarget);
                      void act(async () => {
                        await barrier.run(barrier.begin(), () =>
                          store.mutate({
                            operation: "save",
                            id: saved.id,
                            expectedRevision: saved.revision,
                            mode: "edit",
                            content: {
                              ...configuration,
                              name: String(values.get("name")),
                              instrument: String(values.get("instrument")),
                              range: readRange(values),
                            },
                          }),
                        );
                      }, "Reusable configuration updated. Existing song copies are unchanged.");
                    }}
                  >
                    <fieldset disabled={busy}>
                      <legend>Configuration version {saved.revision}</legend>
                      <label>
                        Configuration name
                        <input
                          name="name"
                          defaultValue={configuration.name}
                          required
                        />
                      </label>
                      <label>
                        Instrument
                        <input
                          name="instrument"
                          defaultValue={configuration.instrument}
                          required
                        />
                      </label>
                      <PitchRange value={configuration.range} />
                      <button type="submit">Save configuration changes</button>
                    </fieldset>
                  </form>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      if (
                        window.confirm(
                          `Remove reusable configuration “${configuration.name}”? Every previously copied song keyboard stays unchanged.`,
                        )
                      )
                        void act(async () => {
                          savedDeviceConfiguration(
                            await barrier.run(barrier.begin(), () =>
                              store.mutate({
                                operation: "delete",
                                id: saved.id,
                                expectedRevision: saved.revision,
                                mode: "edit",
                                content: null,
                              }),
                            ),
                          );
                        }, "Reusable configuration removed. Song copies are unchanged.");
                    }}
                  >
                    Remove reusable configuration {configuration.name}
                  </button>
                </details>
              )}
            </li>
          );
        })}
      </ul>
      {editable && (
        <label>
          Import an independent configuration copy
          <input
            type="file"
            aria-label="Reusable configuration import file"
            accept="application/json,.json"
            disabled={busy}
            onChange={(event) => {
              const input = event.currentTarget,
                file = input.files?.[0];
              if (!file) return;
              const localCheck = beginEdit(),
                sharedCheck = barrier.begin();
              const check = () => {
                localCheck();
                sharedCheck();
              };
              void act(async () => {
                if (file.size > MAX_IMPORT_BYTES)
                  throw new Error(
                    "The configuration file exceeds the import limit. Keep the original file.",
                  );
                const original = importDeviceConfiguration(await file.text());
                check();
                const configuration = original.configuration!;
                if (
                  !window.confirm(
                    `Save a new independent copy of “${configuration.name}”, version ${original.revision}, ${configuration.instrument}, range ${rangeText(configuration.range)}? Existing resources and the source file stay unchanged.`,
                  )
                )
                  return false;
                const copy = {
                  ...structuredClone(configuration),
                  id: crypto.randomUUID(),
                };
                check();
                await barrier.run(check, () =>
                  store.mutate({
                    operation: "save",
                    id: copy.id,
                    expectedRevision: 0,
                    mode: "edit",
                    content: copy,
                  }),
                );
                input.value = "";
              }, "Configuration copy import finished. Existing resources and the source file are kept.");
            }}
          />
        </label>
      )}
      {!editable && <p>Switch to Edit to change reusable configurations.</p>}
      {error && <p role="alert">{error}</p>}
      {status && <p role="status">{status}</p>}
    </details>
  );
}
