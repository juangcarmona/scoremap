---
id: SB-REPERTOIRE-DELETE
type: structured-behaviour
title: Delete only the repertoire
status: active
illustrates:
  - UC-REPERTOIRES
  - BR-IDENTITY
  - BR-EDIT-GUARD
given:
  - Edit mode is active
  - A repertoire contains one existing song
when: The musician confirms repertoire deletion
then:
  - The repertoire and its memberships are removed
  - The song and all its sections, chords and notes remain available outside
    that repertoire
---

## Intent

Delete only the repertoire.

## Boundaries

Clauses describe observable product results. All preconditions and outcomes are conjunctive; alternatives are separate behaviours. Applicable rules supply guards and invariants. Executable evidence is external to the product model.
