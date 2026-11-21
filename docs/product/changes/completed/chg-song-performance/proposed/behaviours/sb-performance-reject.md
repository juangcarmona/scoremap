---
id: SB-PERFORMANCE-REJECT
type: structured-behaviour
title: Reject accidental performance mutations
status: active
illustrates:
  - UC-CONSULT
  - BR-EDIT-GUARD
given:
  - Performance mode is active
  - A prepared song is open
when: The musician attempts a content mutation
then:
  - The mutation is refused at the application boundary
  - Song, repertoire and attachment content remain unchanged
---

## Intent

Reject accidental performance mutations.

## Boundaries

Clauses describe observable product results. All preconditions and outcomes are conjunctive; alternatives are separate behaviours. Applicable rules supply guards and invariants. Executable evidence is external to the product model.

The focused song-sheet and full-range piano direction preserves this existing scenario and its edit, identity, permission and durability boundaries.
