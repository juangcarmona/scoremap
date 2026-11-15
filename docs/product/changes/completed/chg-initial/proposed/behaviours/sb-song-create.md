---
id: SB-SONG-CREATE
type: structured-behaviour
title: Create the first song
status: active
illustrates:
  - UC-SONGS
  - BR-IDENTITY
  - BR-EDIT-GUARD
given:
  - Edit mode is active
  - The library contains no songs
when: The musician creates a song with a nonblank title
then:
  - One independently identified song appears with an empty valid structure
  - The library becomes populated
covers-transition:
  lifecycle: LC-LIBRARY
  transition: CREATE-FIRST
---

## Intent

Create the first song.

## Boundaries

Clauses describe observable product results. All preconditions and outcomes are conjunctive; alternatives are separate behaviours. Applicable rules supply guards and invariants. Executable evidence is external to the product model.
