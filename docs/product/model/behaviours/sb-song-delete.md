---
id: SB-SONG-DELETE
type: structured-behaviour
title: Delete one of several songs
status: active
illustrates:
  - UC-SONGS
  - BR-IDENTITY
  - BR-EDIT-GUARD
given:
  - Edit mode is active
  - The library contains two songs
when: The musician confirms deletion of one song
then:
  - The selected song and its memberships disappear
  - The other song remains unchanged
covers-transition:
  lifecycle: LC-LIBRARY
  transition: DELETE
---

## Intent

Delete one of several songs.

## Boundaries

Clauses describe observable product results. All preconditions and outcomes are conjunctive; alternatives are separate behaviours. Applicable rules supply guards and invariants. Executable evidence is external to the product model.
