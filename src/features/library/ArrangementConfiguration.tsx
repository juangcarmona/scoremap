import { CopyDeviceConfiguration } from "./CopyDeviceConfiguration";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Command } from "./domain";
import type {
  Arrangement,
  Binding,
  HarmonicEvent,
  Part,
  RichSong,
  Voicing,
} from "./score";
import { PitchRange, readRange } from "./PitchRange";
import { usePresetStore } from "./PresetContext";
import { copyArrangementIdentities } from "./identityCopy";
import { harmonyIdentity } from "../../shared/music/harmony";
import { theoreticalHarmony } from "../../shared/music/theory";
import { formatNote, formatChordSymbol } from "../../shared/music/notation";
import { useNotation } from "../../shared/music/NotationContext";
import { requireValue } from "./validation";
type Run = (command: Command, after?: () => void) => void;
function AddPart({
  songId,
  arrangement,
  harmonic,
  run,
  busy,
  report,
}: {
  songId: string;
  arrangement: Arrangement;
  harmonic: HarmonicEvent | undefined;
  run: Run;
  busy: boolean;
  report: (error: unknown) => void;
}) {
  const store = usePresetStore();
  const { preference } = useNotation();
  const presets = useQuery({
    queryKey: ["voicing-presets", store.scope],
    queryFn: () => store.list(),
  });
  const [deviceId, setDeviceId] = useState("");
  const device = arrangement.devices.find((entry) => entry.id === deviceId);
  return (
    <form
      aria-label="Add performed part"
      className="configuration-form"
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const values = new FormData(form);
        try {
          const part: Part = {
            id: crypto.randomUUID(),
            name: String(values.get("name")),
            role: String(values.get("role")),
            events: [],
          };
          const hand = String(values.get("hand")).trim();
          if (hand) part.hand = hand;
          const presetId = String(values.get("preset") ?? "");
          let voicing: Voicing | undefined;
          if (presetId) {
            const source = presets.data?.find((entry) => entry.id === presetId);
            requireValue(
              source?.preset && harmonic,
              "Choose a current own preset and harmonic event before seeding performed notes.",
            );
            const preset = source.preset;
            const theory = theoreticalHarmony(harmonyIdentity(harmonic));
            const allowed = new Set(
              theory.tones.map((tone) => tone.pitchClass),
            );
            if (theory.bass) allowed.add(theory.bass.pitchClass);
            const incompatible = preset.pitches.some(
              (pitch) => !allowed.has(pitch.midi % 12),
            );
            let custom = preset.custom;
            if (incompatible && !custom) {
              if (
                !window.confirm(
                  "This preset contains tones outside the selected harmony. Keep the copied pitches as an explicitly custom voicing without changing harmony?",
                )
              )
                return;
              custom = true;
            }
            voicing = {
              id: crypto.randomUUID(),
              name: preset.name,
              harmonyId: harmonic.id,
              custom,
              sourcePreset: {
                id: source.id,
                revision: source.revision,
                name: preset.name,
              },
            };
            part.events = preset.pitches.map((pitch) => ({
              id: crypto.randomUUID(),
              measureId: harmonic.measureId,
              start: structuredClone(harmonic.start),
              duration: structuredClone(harmonic.duration),
              pitch: structuredClone(pitch),
              voicingId: voicing!.id,
            }));
          }
          const binding: Binding | undefined = device
            ? {
                id: crypto.randomUUID(),
                partId: part.id,
                deviceId: device.id,
                range: readRange(values, "initial-"),
                ...(values.get("sound")
                  ? { sound: String(values.get("sound")) }
                  : {}),
                ...(values.get("layer")
                  ? { layer: String(values.get("layer")) }
                  : {}),
              }
            : undefined;
          run(
            {
              type: "addPart",
              songId,
              arrangementId: arrangement.id,
              part,
              ...(binding ? { binding } : {}),
              ...(voicing ? { voicing } : {}),
            },
            () => {
              form.reset();
              setDeviceId("");
            },
          );
        } catch (error) {
          report(error);
        }
      }}
    >
      <h3>New independent part</h3>
      <label>
        Part name
        <input name="name" required disabled={busy} />
      </label>
      <label>
        Musical role
        <input name="role" placeholder="Bass, melody, pad…" disabled={busy} />
      </label>
      <label>
        Hand or context · optional
        <input
          name="hand"
          placeholder="Left, right, both, or leave unassigned"
          disabled={busy}
        />
      </label>
      <label>
        Initial reusable voicing
        <select
          name="preset"
          aria-label="Initial reusable voicing"
          defaultValue=""
          disabled={busy || !harmonic}
        >
          <option value="">No initial played notes</option>
          {presets.data?.map((source) => (
            <option key={source.id} value={source.id}>
              {source.preset!.name} · version {source.revision} ·{" "}
              {formatChordSymbol(source.preset!.harmony, preference)}
            </option>
          ))}
        </select>
      </label>
      <p>
        Initial notes copy this owned preset at the selected harmonic event. The
        shared harmony and every existing part stay unchanged.
      </p>
      <label>
        Initial keyboard assignment
        <select
          aria-label="Initial keyboard assignment"
          value={deviceId}
          onChange={(event) => setDeviceId(event.target.value)}
          disabled={busy}
        >
          <option value="">Unassigned</option>
          {arrangement.devices.map((device) => (
            <option key={device.id} value={device.id}>
              {device.name}
            </option>
          ))}
        </select>
      </label>
      {device && (
        <>
          <PitchRange
            key={`${device.id}-${device.range.join("-")}`}
            prefix="initial-"
            value={device.range}
            legend="Initial assignment range"
          />
          <label>
            Sound · optional
            <input name="sound" disabled={busy} />
          </label>
          <label>
            Layer · optional
            <input name="layer" disabled={busy} />
          </label>
        </>
      )}
      <button type="submit" disabled={busy}>
        Add part and assignment
      </button>
    </form>
  );
}
function BindingForm({
  songId,
  arrangement,
  binding,
  run,
  busy,
  report,
}: {
  songId: string;
  arrangement: Arrangement;
  binding: Binding | null;
  run: Run;
  busy: boolean;
  report: (error: unknown) => void;
}) {
  const { preference } = useNotation();
  const [partId, setPartId] = useState(
    binding?.partId ?? arrangement.parts[0]?.id ?? "",
  );
  const [deviceId, setDeviceId] = useState(
    binding?.deviceId ?? arrangement.devices[0]?.id ?? "",
  );
  const [allNotes, setAllNotes] = useState(!binding?.eventIds);
  const part = arrangement.parts.find((entry) => entry.id === partId);
  const device = arrangement.devices.find((entry) => entry.id === deviceId);
  return (
    <form
      className="configuration-form"
      aria-label={
        binding
          ? `Edit assignment ${arrangement.bindings.indexOf(binding) + 1}`
          : "Add keyboard assignment"
      }
      onSubmit={(event) => {
        event.preventDefault();
        const values = new FormData(event.currentTarget);
        try {
          requireValue(part && device, "Choose an existing part and keyboard.");
          const next: Binding = {
            id: binding?.id ?? crypto.randomUUID(),
            partId: part.id,
            deviceId: device.id,
            range: readRange(values),
            ...(values.get("sound")
              ? { sound: String(values.get("sound")) }
              : {}),
            ...(values.get("layer")
              ? { layer: String(values.get("layer")) }
              : {}),
            ...(!allNotes
              ? { eventIds: values.getAll("notes").map(String) }
              : {}),
          };
          run({
            type: "setBinding",
            songId,
            arrangementId: arrangement.id,
            binding: next,
          });
        } catch (error) {
          report(error);
        }
      }}
    >
      <label>
        Assigned part
        <select
          aria-label="Assigned part"
          value={partId}
          onChange={(event) => setPartId(event.target.value)}
          disabled={busy}
          required
        >
          {arrangement.parts.map((part) => (
            <option key={part.id} value={part.id}>
              {part.name} · {part.role || "role unassigned"}
            </option>
          ))}
        </select>
      </label>
      <label>
        Physical keyboard
        <select
          aria-label="Physical keyboard"
          value={deviceId}
          onChange={(event) => setDeviceId(event.target.value)}
          disabled={busy}
          required
        >
          {arrangement.devices.map((device) => (
            <option key={device.id} value={device.id}>
              {device.name}
            </option>
          ))}
        </select>
      </label>
      {device && (
        <PitchRange
          key={`${device.id}-${binding?.id ?? "new"}-${(binding?.range ?? device.range).join("-")}`}
          value={binding?.range ?? device.range}
          legend="Allowed performed range"
        />
      )}
      <label>
        Sound
        <input
          name="sound"
          defaultValue={binding?.sound ?? ""}
          disabled={busy}
        />
      </label>
      <label>
        Layer
        <input
          name="layer"
          defaultValue={binding?.layer ?? ""}
          disabled={busy}
        />
      </label>
      <label className="checkbox-field">
        <input
          type="checkbox"
          checked={allNotes}
          onChange={(event) => setAllNotes(event.target.checked)}
          disabled={busy}
        />
        Route all notes in this part
      </label>
      {!allNotes && (
        <label>
          Selected performed occurrences
          <select
            key={partId}
            aria-label="Selected performed occurrences"
            name="notes"
            multiple
            defaultValue={
              binding?.partId === partId ? (binding.eventIds ?? []) : []
            }
            disabled={busy}
          >
            {part?.events.map((event, index) => (
              <option key={event.id} value={event.id}>
                {index + 1} · {formatNotePitch(event.pitch, preference)} ·{" "}
                {event.start.n}/{event.start.d}
              </option>
            ))}
          </select>
        </label>
      )}
      <button type="submit" disabled={busy || !part || !device}>
        {binding ? "Save assignment" : "Add assignment"}
      </button>
      {binding && (
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            if (
              window.confirm(
                "Remove only this keyboard assignment? Every performed note and other assignment will stay unchanged.",
              )
            )
              run({
                type: "removeBinding",
                songId,
                arrangementId: arrangement.id,
                bindingId: binding.id,
              });
          }}
        >
          Remove assignment
        </button>
      )}
    </form>
  );
}
function formatNotePitch(
  pitch: Part["events"][number]["pitch"],
  preference: Parameters<typeof formatNote>[1],
) {
  return formatNote(`${pitch.spelling}${pitch.octave}`, preference);
}
export function ArrangementConfiguration({
  song,
  arrangement,
  harmonic,
  execute,
  report,
  beforeChange,
  onCreated,
}: {
  song: RichSong;
  arrangement: Arrangement | undefined;
  harmonic: HarmonicEvent | undefined;
  execute: (command: Command) => Promise<void>;
  report: (error: unknown) => void;
  beforeChange: () => boolean;
  onCreated: (id: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const run: Run = (command, after) => {
    if (busy || !beforeChange()) return;
    setBusy(true);
    void execute(command)
      .then(after)
      .catch(report)
      .finally(() => setBusy(false));
  };
  return (
    <details className="song-details">
      <summary>Configure arrangement, parts & keyboards</summary>
      <form
        className="configuration-form"
        aria-label="Add arrangement"
        onSubmit={(event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const values = new FormData(form);
          const id = crypto.randomUUID();
          run(
            {
              type: "addArrangement",
              songId: song.id,
              arrangement: {
                id,
                name: String(values.get("name")),
                parts: [],
                devices: [],
                bindings: [],
                voicings: [],
              },
            },
            () => {
              form.reset();
              onCreated(id);
            },
          );
        }}
      >
        <label>
          New arrangement name
          <input name="name" required disabled={busy} />
        </label>
        <button type="submit" disabled={busy}>
          Add arrangement
        </button>
      </form>
      {arrangement && (
        <>
          <form
            className="configuration-form"
            aria-label="Arrangement name"
            key={`${arrangement.id}-${arrangement.name}`}
            onSubmit={(event) => {
              event.preventDefault();
              run({
                type: "renameArrangement",
                songId: song.id,
                arrangementId: arrangement.id,
                name: String(new FormData(event.currentTarget).get("name")),
              });
            }}
          >
            <label>
              Arrangement name
              <input
                name="name"
                defaultValue={arrangement.name}
                required
                disabled={busy}
              />
            </label>
            <button type="submit" disabled={busy}>
              Rename arrangement
            </button>
          </form>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              const name = window.prompt(
                "Name the independent performed copy. Shared song form stays shared.",
                `${arrangement.name} copy`,
              );
              if (name === null) return;
              const identities: Record<string, string> = Object.create(null);
              copyArrangementIdentities(
                arrangement,
                (id) => (identities[id] ??= crypto.randomUUID()),
              );
              run(
                {
                  type: "copyArrangement",
                  songId: song.id,
                  arrangementId: arrangement.id,
                  expected: structuredClone(arrangement),
                  name,
                  identities,
                },
                () => onCreated(identities[arrangement.id]!),
              );
            }}
          >
            Copy arrangement
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              if (
                window.confirm(
                  `Remove arrangement “${arrangement.name}” with ${arrangement.parts.length} parts, ${arrangement.parts.reduce((count, part) => count + part.events.length, 0)} played notes, ${arrangement.devices.length} keyboards and ${arrangement.bindings.length} assignments? Other arrangements and shared form stay unchanged.`,
                )
              )
                run({
                  type: "removeArrangement",
                  songId: song.id,
                  arrangementId: arrangement.id,
                  confirmed: true,
                });
            }}
          >
            Remove arrangement
          </button>
          <AddPart
            key={arrangement.id}
            songId={song.id}
            arrangement={arrangement}
            harmonic={harmonic}
            run={run}
            busy={busy}
            report={report}
          />
          {arrangement.parts.map((part) => (
            <details key={part.id}>
              <summary>Part · {part.name}</summary>
              <form
                className="configuration-form"
                aria-label={`Configure part ${part.name}`}
                key={`${part.id}-${part.name}-${part.role}-${part.hand ?? ""}`}
                onSubmit={(event) => {
                  event.preventDefault();
                  const values = new FormData(event.currentTarget);
                  const hand = String(values.get("hand")).trim();
                  run({
                    type: "updatePart",
                    songId: song.id,
                    arrangementId: arrangement.id,
                    partId: part.id,
                    patch: {
                      name: String(values.get("name")),
                      role: String(values.get("role")),
                      ...(hand ? { hand } : {}),
                    },
                    ...(!hand ? { clearHand: true as const } : {}),
                  });
                }}
              >
                <label>
                  Part name
                  <input
                    name="name"
                    defaultValue={part.name}
                    required
                    disabled={busy}
                  />
                </label>
                <label>
                  Musical role
                  <input name="role" defaultValue={part.role} disabled={busy} />
                </label>
                <label>
                  Hand or context · optional
                  <input
                    name="hand"
                    defaultValue={part.hand ?? ""}
                    disabled={busy}
                  />
                </label>
                <button type="submit" disabled={busy}>
                  Save part
                </button>
              </form>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  const bindings = arrangement.bindings.filter(
                    (binding) => binding.partId === part.id,
                  );
                  if (
                    window.confirm(
                      `Remove part “${part.name}”, its ${part.events.length} played notes and ${bindings.length} assignments? Other parts and named voicings stay unchanged.`,
                    )
                  )
                    run({
                      type: "removePart",
                      songId: song.id,
                      arrangementId: arrangement.id,
                      partId: part.id,
                      expected: structuredClone(part),
                      bindings: structuredClone(bindings),
                      confirmed: true,
                    });
                }}
              >
                Remove part {part.name}
              </button>
            </details>
          ))}
          <CopyDeviceConfiguration
            busy={busy}
            copy={(device) =>
              run({
                type: "addDevice",
                songId: song.id,
                arrangementId: arrangement.id,
                device,
              })
            }
          />
          <form
            className="configuration-form"
            aria-label="Add physical keyboard"
            onSubmit={(event) => {
              event.preventDefault();
              const form = event.currentTarget;
              const values = new FormData(form);
              run(
                {
                  type: "addDevice",
                  songId: song.id,
                  arrangementId: arrangement.id,
                  device: {
                    id: crypto.randomUUID(),
                    name: String(values.get("name")),
                    instrument: "keyboard",
                    range: readRange(values),
                  },
                },
                () => form.reset(),
              );
            }}
          >
            <h3>New physical keyboard</h3>
            <label>
              Keyboard name
              <input name="name" required disabled={busy} />
            </label>
            <PitchRange value={[21, 108]} />
            <button type="submit" disabled={busy}>
              Add keyboard
            </button>
          </form>
          {arrangement.devices.map((device) => (
            <details key={device.id}>
              <summary>Keyboard · {device.name}</summary>
              <form
                className="configuration-form"
                aria-label={`Configure keyboard ${device.name}`}
                key={`${device.id}-${device.name}-${device.range.join("-")}`}
                onSubmit={(event) => {
                  event.preventDefault();
                  const values = new FormData(event.currentTarget);
                  run({
                    type: "updateDevice",
                    songId: song.id,
                    arrangementId: arrangement.id,
                    deviceId: device.id,
                    patch: {
                      name: String(values.get("name")),
                      range: readRange(values),
                    },
                  });
                }}
              >
                <label>
                  Keyboard name
                  <input
                    name="name"
                    defaultValue={device.name}
                    required
                    disabled={busy}
                  />
                </label>
                <PitchRange value={device.range} />
                <button type="submit" disabled={busy}>
                  Save keyboard
                </button>
              </form>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  const bindings = arrangement.bindings.filter(
                    (binding) => binding.deviceId === device.id,
                  );
                  if (
                    window.confirm(
                      `Remove keyboard “${device.name}” and these ${bindings.length} assignments: ${bindings.map((binding) => `${arrangement.parts.find((part) => part.id === binding.partId)!.name}${binding.sound ? ` / ${binding.sound}` : ""}${binding.layer ? ` / ${binding.layer}` : ""}`).join(", ")}? Every part and played note will remain.`,
                    )
                  )
                    run({
                      type: "removeDevice",
                      songId: song.id,
                      arrangementId: arrangement.id,
                      deviceId: device.id,
                      expected: structuredClone(device),
                      bindings: structuredClone(bindings),
                      confirmed: true,
                    });
                }}
              >
                Remove keyboard {device.name}
              </button>
            </details>
          ))}
          <details>
            <summary>Add split or layer assignment</summary>
            <BindingForm
              key={arrangement.id}
              songId={song.id}
              arrangement={arrangement}
              binding={null}
              run={run}
              busy={busy}
              report={report}
            />
          </details>
          {arrangement.bindings.map((binding, index) => (
            <details key={binding.id}>
              <summary>
                Assignment {index + 1} ·{" "}
                {
                  arrangement.parts.find((part) => part.id === binding.partId)!
                    .name
                }{" "}
                →{" "}
                {
                  arrangement.devices.find(
                    (device) => device.id === binding.deviceId,
                  )!.name
                }
              </summary>
              <BindingForm
                key={`${binding.id}-${JSON.stringify(binding)}`}
                songId={song.id}
                arrangement={arrangement}
                binding={binding}
                run={run}
                busy={busy}
                report={report}
              />
            </details>
          ))}
        </>
      )}
      {busy && <p role="status">Saving the complete arrangement change…</p>}
    </details>
  );
}
