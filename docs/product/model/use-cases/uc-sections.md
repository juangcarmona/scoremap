---
id: UC-SECTIONS
type: use-case
title: Organize shared form and independent performed arrangements
status: draft
primary-actor: ACT-MUSICIAN
bounded-context: BC-SKETCH
governed-by:
  - BR-IDENTITY
  - BR-STRUCTURE
  - BR-EDIT-GUARD
  - BR-CHORDS
  - BR-DURABILITY
  - BR-ACCESS
  - BR-SESSION
uses-terms:
  - TERM-SECTION
  - TERM-SONG
  - TERM-EVENT
  - TERM-ARRANGEMENT
  - TERM-VOICING
  - TERM-PRINCIPAL
---

## Goal

Insert, rename, remove, repeat and reorder identified song sections and prepare independent performed arrangements against one shared stable form, including multiple keyboard, split, layer and optional-hand configurations without a domain maximum of three.

## Trigger

The musician requests a form operation or an arrangement/part/configuration action for a selected song. Form edits and performed-interpretation edits are deliberate distinct actions, not hidden side effects of one another.

## Preconditions

The library is readable and all existing target identities resolve. Private reads require current resource authority. Every musical mutation requires applicable current write capability, edit admission, complete valid data/references and expected revision. Independently owned reusable configuration requires its own authority; a song grant covers only the song's copy. Empty form and empty event sequences are valid.

## Main Flow

1. The musician selects the song and intended section/form action or independent arrangement action. The product identifies that Song owns shared section/measure/harmonic-event form while Arrangement owns its performed parts and bindings.
2. For form preparation the musician supplies section label/repeat/order or identified measure/event positions and positive durations. Repeats use the same content identity through occurrence coordinates. The product validates exact order, timing and references under BR-STRUCTURE.
3. For arrangement preparation the musician creates or selects a named independent part with musical role and optional contextual hand metadata, chooses its performed events and binds it to existing instrument/range/layer configuration. The product previews exact pitches, physical ranges and sound metadata separately from hand and device identities.
4. Before a destructive shared-form operation, the product shows every referencing arrangement and affected assignment. If references would become invalid, it refuses unless the musician explicitly confirms a defined valid atomic reconciliation of those assignments. A changed shared harmonic event is visible through every arrangement's shared reference, without rewriting their independent performed notes.
5. The product admits the requested command using current capability, edit guard, complete validity and expected revision. It durably commits the complete declared song boundary, including any confirmed reconciliation, then acknowledges the actual revision. Separately owned reusable resources/preferences are not implicitly included in that acknowledgement.
6. The product displays the resulting shared form and independent interpretation. Unaffected identities, music and bindings remain unchanged, and repeat occurrence navigation does not create duplicate mutable sections/events.

## Alternative Flows

- Inserting the first section changes structure presence from EMPTY to ARRANGED; inserting another, modifying section metadata, valid reorder and removing a nonfinal section retain ARRANGED. Removing the final section returns EMPTY, subject to explicit reconciliation of affected assignments. Existing LC-STRUCTURE transition identities remain applicable to their actual commands only.
- A valid reorder is an exact permutation and changes position alone; section identity, content, repeats and associations remain stable. Repeat counts remain integers 1 through 99.
- For one piano, the musician binds independent left/right parts to the same device; optional hand metadata does not define ownership.
- For two keyboards, the musician binds independent parts with one hand per instrument if desired; each device keeps its own range and music.
- For three keyboards, the musician prepares independent parts and sounds under the shared context. Adding a fourth part/device remains valid and leaves prior content unchanged; three is not a domain limit.
- For one split keyboard, the musician assigns distinct valid ranges/sounds without duplicating or deleting performed events.
- For overlapping layers, separate parts retain separate event ownership even when their pitches coincide. A shared visible key does not merge their content.
- For parts without one-to-one hand mapping, hands may be unassigned/contextual and several parts may share a device. A part is not a hand, device or sound.
- Removing only a binding leaves performed content intact. Deleting a referenced object requires explicit valid reconciliation; deleting a source preset does not cascade into already copied arrangement content.
- To obtain an independently mutable form, the musician explicitly duplicates the song with new identities and remapped associations. Editing an arrangement does not silently fork or version-pin its song timeline.
- The musician cancels an uncommitted preview; the previously acknowledged form and assignments remain intact.

## Failure Conditions

Unknown or duplicate identities, incomplete order, invalid repeat counts, invalid meter, negative positions, zero duration, out-of-measure ends, invalid pitch ranges and dangling assignments refuse before activation. Physical assignments excluding played notes require explicit reconciliation, not silent clipping/transposition. Invalid or unconfirmed destructive shared impact cannot partially remove content.

Performance mode, insufficient current capability and stale expected revision independently refuse mutations. Failed commits preserve the prior complete acknowledgement; ambiguous responses reconcile command receipts rather than repeat effects. Expiry, revocation or unknown private authority locks views and protects pending work under BR-SESSION without exposing it to another account. Refused/failed operations perform no structure, library or retention transition.

## Postconditions

The admitted complete operation is acknowledged at its actual durable boundary, or prior acknowledged content remains unchanged with an actionable refusal/failure. Song-owned form remains shared, performed arrangements remain independent and existing repertoire, membership, reminder and reference identities retain their meaning. All six configurations and more than three parts/devices remain representable without mandatory hand mapping or hardware routing. Selected occurrence, edit mode and save status are not persistent form lifecycles.
