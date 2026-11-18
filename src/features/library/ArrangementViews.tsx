import { useState } from "react";
import { PerformedPiano } from "../sketch/PerformedPiano";
import { formatNote, formatChordSymbol } from "../../shared/music/notation";
import { useNotation } from "../../shared/music/NotationContext";
import { harmonyIdentity } from "../../shared/music/harmony";
import type {
  Arrangement,
  Device,
  HarmonicEvent,
  RichSection,
  Part,
  NoteEvent,
} from "./score";
import {
  bindingEvents,
  deviceEvents,
  unassignedPartEvents,
} from "./arrangementSelection";
import { performedPitchAt } from "../../shared/music/theory";
function KeyboardView({
  arrangement,
  device,
  harmonic,
  context,
}: {
  arrangement: Arrangement;
  device: Device;
  harmonic: HarmonicEvent;
  context: string;
}) {
  const { preference } = useNotation();
  const events = deviceEvents(arrangement, device.id, harmonic);
  const [firstOctave, setFirstOctave] = useState(() =>
    Math.max(
      -1,
      Math.min(
        7,
        Math.floor(
          (events.length
            ? events.reduce(
                (minimum, event) => Math.min(minimum, event.pitch.midi),
                127,
              )
            : device.range[0]) / 12,
        ) - 1,
      ),
    ),
  );
  const [octaves, setOctaves] = useState<2 | 3>(2);
  const bindings = arrangement.bindings.filter(
    (entry) => entry.deviceId === device.id,
  );
  const note = (midi: number) => {
    const pitch = performedPitchAt(midi);
    return formatNote(`${pitch.spelling}${pitch.octave}`, preference);
  };
  return (
    <article
      className="keyboard-view"
      aria-label={`Keyboard ${device.name}`}
      data-device-id={device.id}
      data-context={context}
    >
      <h3>{device.name}</h3>
      <p>
        {context} · {formatChordSymbol(harmonic, preference)}
      </p>
      <p>
        Physical range: {note(device.range[0])}–{note(device.range[1])}
      </p>
      {bindings.length === 0 && <p>No part is assigned to this keyboard.</p>}
      <ul className="routing-list">
        {bindings.map((binding) => {
          const part = arrangement.parts.find(
            (entry) => entry.id === binding.partId,
          )!;
          const active = bindingEvents(arrangement, binding, harmonic);
          return (
            <li key={binding.id} data-binding-id={binding.id}>
              <strong>{part.name}</strong> · {part.role || "role unassigned"}
              {part.hand ? ` · hand: ${part.hand}` : " · hand unassigned"}
              {binding.sound ? ` · sound: ${binding.sound}` : ""}
              {binding.layer ? ` · layer: ${binding.layer}` : ""} ·{" "}
              {note(binding.range[0])}–{note(binding.range[1])}
              <span>
                {active.length
                  ? active
                      .map((event) =>
                        formatNote(
                          `${event.pitch.spelling}${event.pitch.octave}`,
                          preference,
                        ),
                      )
                      .join(" · ")
                  : "Silent at this event"}
              </span>
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        disabled={!events.length}
        onClick={() => fitNotes(events, setFirstOctave, setOctaves)}
      >
        Find played notes on {device.name}
      </button>
      <div className="builder-controls">
        <label>
          First visible octave
          <select
            aria-label={`First visible octave for keyboard ${device.name}`}
            value={firstOctave}
            onChange={(event) => setFirstOctave(Number(event.target.value))}
          >
            {Array.from({ length: 9 }, (_, index) => index - 1).map(
              (octave) => (
                <option key={octave} value={octave}>
                  {formatNote(`C${octave}`, preference)}
                </option>
              ),
            )}
          </select>
        </label>
        <label>
          Piano span
          <select
            aria-label={`Piano span for keyboard ${device.name}`}
            value={octaves}
            onChange={(event) =>
              setOctaves(Number(event.target.value) as 2 | 3)
            }
          >
            <option value={2}>Two octaves</option>
            <option value={3}>Three octaves</option>
          </select>
        </label>
      </div>
      <PerformedPiano
        harmony={harmonyIdentity(harmonic)}
        pitches={events.map((event) => event.pitch)}
        firstOctave={firstOctave}
        octaves={octaves}
        physicalRange={device.range}
        editable={false}
        onToggle={() => undefined}
        label={`${device.name} assigned performed piano`}
      />
    </article>
  );
}
export function ArrangementViews({
  arrangement,
  harmonic,
  section,
  occurrence,
}: {
  arrangement: Arrangement;
  harmonic: HarmonicEvent | undefined;
  section: RichSection | undefined;
  occurrence: number;
}) {
  if (!harmonic || !section)
    return (
      <p role="status">
        No harmonic event is available. Choose an existing event to consult this
        arrangement.
      </p>
    );
  const measure =
    section.measures.findIndex((entry) => entry.id === harmonic.measureId) + 1;
  const context = `${arrangement.name} · ${section.name} · occurrence ${occurrence} of ${section.repeat} · measure ${measure}`;
  const unassigned = arrangement.parts.filter(
    (part) =>
      !arrangement.bindings.some((binding) => binding.partId === part.id) ||
      part.events.some(
        (event) =>
          !arrangement.bindings.some(
            (binding) =>
              binding.partId === part.id &&
              (!binding.eventIds || binding.eventIds.includes(event.id)),
          ),
      ),
  );
  return (
    <section
      className="arrangement-views"
      aria-label="Synchronized keyboard views"
      data-arrangement-id={arrangement.id}
      data-section-id={section.id}
      data-occurrence={occurrence}
      data-measure-id={harmonic.measureId}
      data-harmonic-event-id={harmonic.id}
    >
      <p className="musical-context" role="status">
        {context}
      </p>
      <div className="keyboard-grid">
        {arrangement.devices.map((device) => (
          <KeyboardView
            key={device.id}
            arrangement={arrangement}
            device={device}
            harmonic={harmonic}
            context={context}
          />
        ))}
      </div>
      <div className="keyboard-grid">
        {unassigned.map((part) => (
          <UnassignedView
            key={part.id}
            arrangement={arrangement}
            part={part}
            harmonic={harmonic}
            context={context}
          />
        ))}
      </div>
      {arrangement.devices.length === 0 && (
        <p>
          No physical keyboards are configured yet. Parts and their performed
          notes remain independent of devices.
        </p>
      )}
    </section>
  );
}

function fitNotes(
  events: NoteEvent[],
  first: (value: number) => void,
  span: (value: 2 | 3) => void,
) {
  if (!events.length) return;
  const lowest = events.reduce(
    (value, event) => Math.min(value, event.pitch.midi),
    127,
  );
  const highest = events.reduce(
    (value, event) => Math.max(value, event.pitch.midi),
    0,
  );
  const octave = Math.max(-1, Math.min(7, Math.floor(lowest / 12) - 1));
  first(octave);
  span(highest > (octave + 1) * 12 + 23 ? 3 : 2);
}
function UnassignedView({
  arrangement,
  part,
  harmonic,
  context,
}: {
  arrangement: Arrangement;
  part: Part;
  harmonic: HarmonicEvent;
  context: string;
}) {
  const { preference } = useNotation();
  const events = unassignedPartEvents(arrangement, part, harmonic);
  const [first, setFirst] = useState(3);
  const [span, setSpan] = useState<2 | 3>(2);
  return (
    <article
      className="keyboard-view"
      aria-label={`Unassigned notes ${part.name}`}
      data-context={context}
      data-part-id={part.id}
    >
      <h3>{part.name} · unassigned notes</h3>
      <p>
        {part.role || "Role unassigned"}
        {part.hand ? ` · hand: ${part.hand}` : " · hand unassigned"}
      </p>
      <p>
        {context}. These notes have no physical keyboard assignment; their music
        is retained.
      </p>
      <button
        type="button"
        disabled={!events.length}
        onClick={() => fitNotes(events, setFirst, setSpan)}
      >
        Find unassigned notes for {part.name}
      </button>
      <div className="builder-controls">
        <label>
          First visible octave
          <select
            aria-label={`First visible octave for unassigned ${part.name}`}
            value={first}
            onChange={(event) => setFirst(Number(event.target.value))}
          >
            {Array.from({ length: 9 }, (_, index) => index - 1).map((value) => (
              <option key={value} value={value}>
                {formatNote(`C${value}`, preference)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Piano span
          <select
            aria-label={`Piano span for unassigned ${part.name}`}
            value={span}
            onChange={(event) => setSpan(Number(event.target.value) as 2 | 3)}
          >
            <option value={2}>Two octaves</option>
            <option value={3}>Three octaves</option>
          </select>
        </label>
      </div>
      <PerformedPiano
        harmony={harmonyIdentity(harmonic)}
        pitches={events.map((event) => event.pitch)}
        firstOctave={first}
        octaves={span}
        editable={false}
        onToggle={() => undefined}
        label={`${part.name} unassigned performed piano`}
      />
    </article>
  );
}
