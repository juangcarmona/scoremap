---
id: BR-STRUCTURE
type: business-rule
title: Shared identified form and independent performed assignments
status: draft
applies-to: [BC-SKETCH]
uses-terms: [TERM-SONG, TERM-SECTION, TERM-EVENT, TERM-ARRANGEMENT]
---

## Rule

Each section belongs to exactly one song. Section and measure order are exact permutations of existing unique IDs; empty form and empty event sequences remain valid. Repeats are integers 1..99 using one content identity. Consultation occurrence coordinates identify section and repeat index 1..repeat count plus measure/event; repetition does not duplicate mutable events. Song owns shared section/measure/harmonic-event form. Arrangement owns independent performed parts, note events, voicings and bindings referencing that form. Shared-form edits affect all referencing arrangements and MUST disclose that impact before destructive changes. Refuse dangling or invalid assignments unless the musician explicitly confirms a defined atomic reconciliation listing affected references. Reordering changes position only; independent forms require explicit song duplication with new identities. Version-pinned form forks are outside this iteration.

Measures have stable identity and a positive rational length in quarter-note units. Meter has positive integer numerator and power-of-two denominator; default 4/4 length 4. Event start is a nonnegative rational offset strictly before measure end; duration is positive rational and end cannot exceed that measure. Longer notes use explicit consecutive tied occurrences with stable identities. Rational values must be finite and exact; refuse zero duration, negative positions, invalid meter, out-of-measure ends and dangling measure/event references. Harmonic events cannot overlap in one measure; distinct performed events/parts may overlap, including equal pitches on independent layers. No arbitrary maximum of three parts/devices exists.

Each note event belongs to one part in one arrangement; bindings connect existing part, device, inclusive physical pitch range and optional sound/layer metadata. Ranges must have lower<=upper within valid pitch bounds and lie within the configured device range. A visual viewport may exclude notes but must indicate them without deleting/transposing them. A physical assignment that excludes played notes is refused until explicitly reconciled. No required one-to-one part/hand/device mapping: optional left/right/both/contextual hand metadata, unassigned hands and multiple parts per device are valid. Split/layer bindings never implicitly copy or erase note events. Deleting referenced parts/devices/presets requires explicit reconciliation; deleting a binding alone leaves performed content intact. Copied preset provenance is not a live dependency and needs no cascade on preset deletion.

Migration preserves all v1 song/repertoire/section/membership/reminder/reference identities, order, repeat counts and triad spelling. Existing chord-array items receive stable event identities with one quarter-note duration at consecutive integer offsets in a deterministic 4/4 measure sequence, extending measures as needed; an empty sequence remains empty. Create one default arrangement with one unassigned part and no fabricated performed notes or device bindings. Record generated-ID mappings in the migration receipt and reuse them on retry. No theoretical diagram is inferred to be a played voicing. All migration activation follows BR-BACKUP and BR-DURABILITY.

## Rationale

Stable shared form and separate performed interpretation preserve existing work and make all six requested configurations independent of physical instruments.

## Examples

A fourth keyboard and part are valid. Adding it leaves the prior three parts unchanged. Removing a shared measure with referenced events refuses unless the explicitly previewed reconciliation can commit atomically.

## Exceptions

None. Interaction mode/navigation and save status are not persistent musical lifecycles.
