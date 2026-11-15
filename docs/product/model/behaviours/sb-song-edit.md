---
id: SB-SONG-EDIT
type: structured-behaviour
title: Edit title and optional artist
status: active
illustrates:
  - UC-SONGS
  - BR-IDENTITY
  - BR-EDIT-GUARD
given:
  - Edit mode is active
  - A song has sections and memberships
when: The musician changes its title and optional artist
then:
  - The same song carries the supplied metadata
  - Sections and memberships retain their associations
---

## Intent

Edit title and optional artist.

## Boundaries

Clauses describe observable product results. All preconditions and outcomes are conjunctive; alternatives are separate behaviours. Applicable rules supply guards and invariants. Executable evidence is external to the product model.
