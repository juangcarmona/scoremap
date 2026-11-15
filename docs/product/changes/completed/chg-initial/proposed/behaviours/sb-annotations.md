---
id: SB-ANNOTATIONS
type: structured-behaviour
title: Create and modify owned notes
status: active
illustrates:
  - UC-ANNOTATIONS
  - BR-IDENTITY
  - BR-EDIT-GUARD
given:
  - Edit mode is active
  - A song has two identified sections
when: The musician adds a song note and updates one section note
then:
  - The song and selected section retain the supplied free-form text
  - The other section is unchanged
---

## Intent

Create and modify owned notes.

## Boundaries

Clauses describe observable product results. All preconditions and outcomes are conjunctive; alternatives are separate behaviours. Applicable rules supply guards and invariants. Executable evidence is external to the product model.
