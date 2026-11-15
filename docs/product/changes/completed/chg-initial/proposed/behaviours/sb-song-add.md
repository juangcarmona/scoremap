---
id: SB-SONG-ADD
type: structured-behaviour
title: Create another song
status: active
illustrates:
  - UC-SONGS
  - BR-IDENTITY
  - BR-EDIT-GUARD
given:
  - Edit mode is active
  - The library already contains a song
when: The musician creates another titled song
then:
  - A distinct song identity is added
  - Existing content remains unchanged
covers-transition:
  lifecycle: LC-LIBRARY
  transition: CREATE
---

## Intent

Create another song.

## Boundaries

Clauses describe observable product results. All preconditions and outcomes are conjunctive; alternatives are separate behaviours. Applicable rules supply guards and invariants. Executable evidence is external to the product model.
