---
id: SB-CHORD-INVALID
type: structured-behaviour
title: Reject an unsupported chord
status: active
illustrates:
  - UC-CHORDS
  - BR-CHORDS
  - BR-EDIT-GUARD
given:
  - Edit mode is active
when: The musician submits an unsupported root or initial quality
then:
  - A validation error is returned
  - No chord data changes
---

## Intent

Reject an unsupported chord.

## Boundaries

Clauses describe observable product results. All preconditions and outcomes are conjunctive; alternatives are separate behaviours. Applicable rules supply guards and invariants. Executable evidence is external to the product model.
