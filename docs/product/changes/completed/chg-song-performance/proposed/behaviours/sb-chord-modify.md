---
id: SB-CHORD-MODIFY
type: structured-behaviour
title: Modify a selected chord
status: active
illustrates:
  - UC-CHORDS
  - BR-CHORDS
  - BR-EDIT-GUARD
given:
  - Edit mode is active
  - A section has a chord sequence
when: The musician changes a selected chord from major to minor
then:
  - Only the selected chord changes
  - Its third is three semitones above the root
  - The displayed keyboard updates immediately
---

## Intent

Modify a selected chord.

## Boundaries

Clauses describe observable product results. All preconditions and outcomes are conjunctive; alternatives are separate behaviours. Applicable rules supply guards and invariants. Executable evidence is external to the product model.

The focused song-sheet and full-range piano direction preserves this existing scenario and its edit, identity, permission and durability boundaries.
