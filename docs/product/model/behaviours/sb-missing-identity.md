---
id: SB-MISSING-IDENTITY
type: structured-behaviour
title: Refuse an unknown target
status: active
illustrates:
  - UC-SONGS
  - BR-IDENTITY
  - BR-EDIT-GUARD
given:
  - Edit mode is active
  - The requested song identity does not exist
when: The musician requests an edit of that identity
then:
  - A missing-song error is shown
  - No song is created or changed
---

## Intent

Refuse an unknown target.

## Boundaries

Clauses describe observable product results. All preconditions and outcomes are conjunctive; alternatives are separate behaviours. Applicable rules supply guards and invariants. Executable evidence is external to the product model.
