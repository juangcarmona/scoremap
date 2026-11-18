---
id: FR-SECTIONS
type: functional-requirement
title: Organize shared song form and independent arrangements
status: draft
derived-from:
  - UC-SECTIONS
  - BR-STRUCTURE
  - BR-IDENTITY
  - BR-EDIT-GUARD
  - BR-ACCESS
  - BR-DURABILITY
verification:
  - scenario-ref: SB-SECTION-FIRST
  - scenario-ref: SB-SECTION-INSERT
  - scenario-ref: SB-SECTION-MODIFY
  - scenario-ref: SB-SECTION-REORDER
  - scenario-ref: SB-SECTION-REMOVE
  - scenario-ref: SB-SECTION-REMOVE-LAST
  - scenario-ref: SB-SECTION-INVALID-ORDER
  - scenario-ref: SB-SECTION-REPEAT-BOUNDARY
  - scenario-ref: SB-PART-ISOLATION
  - scenario: With two arrangements referencing the same song measure and no invalidated assignments, acknowledge an authorized shared harmonic-event edit; both arrangements reference the changed harmony while each retains its own performed notes and device bindings.
  - scenario: With performed events referencing a measure shared by two arrangements, request removal without confirmed reconciliation; refuse without dangling assignments, lost content or a new acknowledged revision.
  - scenario: With a preview identifying every affected assignment and a valid explicitly confirmed atomic reconciliation, remove a referenced measure; commit the declared reconciled form and assignments together while preserving all unaffected identities and music.
  - scenario: With a valid measure and existing event, submit a zero event duration; refuse and preserve the prior form and performed assignments without a lifecycle transition.
  - scenario: With a valid measure and existing event, submit a duration ending beyond the measure; refuse without truncating the event or moving other events.
  - scenario: With identified repeated sections, reorder them using an exact permutation; preserve section/event identities, content and repeats without cloning events for repeat occurrences.
  - scenario: With one piano and independently voiced left and right parts, acknowledge their shared-device assignments; both retain exact pitches and contextual hand labels without making the hand a device identity.
  - scenario: With two physical keyboards and two independently voiced parts, acknowledge one-hand-per-instrument assignments; each keyboard retains its own range and part pitches under the same song context.
  - scenario: With three keyboards and independent parts with different sound metadata, acknowledge the arrangement; each retains its own notes, register, range and sounds without changing the other parts.
  - scenario: With one keyboard and two independent parts within disjoint valid ranges, acknowledge split bindings with different sounds; bind the existing parts without copying or erasing their note events.
  - scenario: With two distinct performed events at the same pitch on separate parts, acknowledge overlapping layer bindings on one keyboard; retain both event identities and ownership without merging them into one event.
  - scenario: With multiple independent parts and no hand assignments, acknowledge shared-keyboard bindings; preserve all parts without forcing a left/right mapping.
  - scenario: With a performed pitch outside a proposed physical assignment range, request that binding without reconciliation; refuse without clipping, transposing or deleting the note.
  - scenario: With a valid binding and its performed events, remove only the binding; retain the performed content and other bindings unchanged.
  - scenario: With a song referenced by two arrangements, explicitly duplicate the song as independent form; create new song/content identities and consistently remapped associations while leaving the original song and arrangements unchanged.
uses-terms:
  - TERM-SONG
  - TERM-SECTION
  - TERM-EVENT
  - TERM-ARRANGEMENT
  - TERM-VOICING
---

## Requirement

The product MUST support insertion, renaming, removal, repetition and reordering of identified sections while retaining existing song, section, repertoire, membership, annotation and reference identities and independent meanings. Empty songs and event sequences MUST remain valid. Reordering MUST change position alone; order MUST contain each existing unique identity exactly once. Section repetition MUST remain an integer from 1 through 99 and MUST reuse the same complete content through distinct occurrence coordinates rather than cloned mutable sections.

A Song MUST own its shared section/measure/harmonic-event timeline. Arrangements MUST reference that shared form and own independent performed parts, voicings/note events and device/range/layer bindings. A shared-form edit MUST affect all referencing arrangements, and destructive shared impact MUST be shown before confirmation. The product MUST refuse dangling or invalid assignments unless the musician explicitly confirms a defined reconciliation that can commit atomically with the edit. Independent forms MUST use explicit song duplication with new identities and remapped references, not hidden mutable arrangement forks. Editing one arrangement's performed notes, register, optional hand metadata or bindings MUST NOT change another arrangement or silently change harmonic identity.

Measures and events MUST have stable identities and explicit exact musical positions/durations under BR-STRUCTURE. Measures MUST have positive rational length; event start MUST be nonnegative and inside its measure, duration MUST be positive and its end MUST not exceed the measure. Defaults, meter validity, ties and overlap rules MUST follow BR-STRUCTURE. Invalid meter, timing, references and orders MUST be refused before activation without clipping music or damaging the previous acknowledged state. Repeat-instance navigation MUST NOT create a second mutable event identity.

Parts and physical instrument configurations MUST be independent collections without a domain maximum of three. Each part MUST have its own identity, name, musical role and performed events; hand assignment MUST be optional/contextual. A part MUST NOT be equated with a device, sound or hand. Multiple parts MUST be able to share a keyboard, and a part MUST not require a one-to-one hand mapping. Device configurations MUST have explicit physical ranges; part/range/layer bindings MUST resolve and satisfy pitch bounds. A view range MUST remain distinct from a physical assignment. Splits and overlapping layers MUST NOT implicitly clone, erase, merge or transpose note events, including equal pitches owned by different layers. Deleting a binding MUST NOT delete its performed content. Removal of referenced content MUST require explicit valid reconciliation; copied preset provenance MUST NOT become a live cascading dependency.

The product MUST support all six arrangements: one piano with left/right parts; two keyboards including one hand per instrument; three keyboards with independent parts/sounds; one keyboard split into ranges with different sounds; overlapping layers on one keyboard; and parts without one-to-one hand mapping. A fourth part/device MUST be valid and preserve every prior part's identity, music and configuration. The core MUST remain instrument-agnostic; sound metadata and future visualization boundaries MUST NOT imply hardware control or delivery of other instrument visualizers.

All musical mutations MUST retain edit-mode admission, applicable current private capabilities, complete validation and expected-revision durability rules. Failed reconciliation, unauthorized commands and failed commits MUST preserve the previous acknowledged form and assignments. Library presence, section presence and song retention MUST remain distinct from selected context, save status and interaction mode.

## Rationale

Musicians need shared song form without sacrificing independent performed interpretations. Stable references and explicit reconciliation preserve existing work while allowing realistic multi-keyboard arrangements beyond an initial two- or three-device layout.
