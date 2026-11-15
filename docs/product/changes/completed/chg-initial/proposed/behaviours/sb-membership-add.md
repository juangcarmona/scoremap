---
id: SB-MEMBERSHIP-ADD
type: structured-behaviour
title: Add an existing song
status: active
illustrates:
  - UC-MEMBERSHIP
  - BR-IDENTITY
  - BR-EDIT-GUARD
given:
  - Edit mode is active
  - A song and a repertoire exist
when: The musician adds the song to the repertoire
then:
  - One membership is visible
  - The same song remains independently available
---

## Intent

Add an existing song.

## Boundaries

Clauses describe observable product results. All preconditions and outcomes are conjunctive; alternatives are separate behaviours. Applicable rules supply guards and invariants. Executable evidence is external to the product model.
