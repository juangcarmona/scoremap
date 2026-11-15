---
id: SB-REPERTOIRE-RENAME
type: structured-behaviour
title: Rename a repertoire
status: active
illustrates:
  - UC-REPERTOIRES
  - BR-IDENTITY
  - BR-EDIT-GUARD
given:
  - Edit mode is active
  - A repertoire contains a song
when: The musician renames the repertoire
then:
  - The same repertoire identity has the new name
  - Its song memberships remain unchanged
---

## Intent

Rename a repertoire.

## Boundaries

Clauses describe observable product results. All preconditions and outcomes are conjunctive; alternatives are separate behaviours. Applicable rules supply guards and invariants. Executable evidence is external to the product model.
