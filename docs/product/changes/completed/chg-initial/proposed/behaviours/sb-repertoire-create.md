---
id: SB-REPERTOIRE-CREATE
type: structured-behaviour
title: Create a named repertoire
status: active
illustrates:
  - UC-REPERTOIRES
  - BR-IDENTITY
  - BR-EDIT-GUARD
given:
  - Edit mode is active
  - The name is nonblank
when: The musician creates Pintatónica
then:
  - A repertoire with a fresh identity and that name is visible
  - No songs or memberships are fabricated
---

## Intent

Create a named repertoire.

## Boundaries

Clauses describe observable product results. All preconditions and outcomes are conjunctive; alternatives are separate behaviours. Applicable rules supply guards and invariants. Executable evidence is external to the product model.
