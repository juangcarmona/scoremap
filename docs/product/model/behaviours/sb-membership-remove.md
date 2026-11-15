---
id: SB-MEMBERSHIP-REMOVE
type: structured-behaviour
title: Remove only membership
status: active
illustrates:
  - UC-MEMBERSHIP
  - BR-IDENTITY
  - BR-EDIT-GUARD
given:
  - Edit mode is active
  - A song belongs to a repertoire
when: The musician removes the song from the repertoire
then:
  - The membership disappears
  - The song remains available in all songs
---

## Intent

Remove only membership.

## Boundaries

Clauses describe observable product results. All preconditions and outcomes are conjunctive; alternatives are separate behaviours. Applicable rules supply guards and invariants. Executable evidence is external to the product model.
