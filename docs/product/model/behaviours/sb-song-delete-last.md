---
id: SB-SONG-DELETE-LAST
type: structured-behaviour
title: Delete the final song
status: active
illustrates:
  - UC-SONGS
  - BR-IDENTITY
  - BR-EDIT-GUARD
given:
  - Edit mode is active
  - The only song belongs to a repertoire
when: The musician confirms deletion of that song
then:
  - The song, its sections and owned attachments are removed
  - Its memberships disappear and the repertoire remains
  - The library contains no songs
covers-transition:
  lifecycle: LC-LIBRARY
  transition: DELETE-LAST
---

## Intent

Delete the final song.

## Boundaries

Clauses describe observable product results. All preconditions and outcomes are conjunctive; alternatives are separate behaviours. Applicable rules supply guards and invariants. Executable evidence is external to the product model.
