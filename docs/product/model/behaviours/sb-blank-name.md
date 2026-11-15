---
id: SB-BLANK-NAME
type: structured-behaviour
title: Refuse a blank title
status: active
illustrates:
  - UC-SONGS
  - BR-IDENTITY
  - BR-EDIT-GUARD
given:
  - Edit mode is active
when: The musician creates a song with only whitespace in its title
then:
  - The operation is refused
  - The library remains unchanged
---

## Intent

Refuse a blank title.

## Boundaries

Clauses describe observable product results. All preconditions and outcomes are conjunctive; alternatives are separate behaviours. Applicable rules supply guards and invariants. Executable evidence is external to the product model.
