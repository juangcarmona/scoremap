---
id: SB-SECTION-REMOVE-LAST
type: structured-behaviour
title: Return to an empty structure
status: active
illustrates:
  - UC-SECTIONS
  - BR-IDENTITY
  - BR-STRUCTURE
  - BR-EDIT-GUARD
given:
  - Edit mode is active
  - A song has exactly one section
when: The musician removes that section
then:
  - The song remains and has an empty valid structure
covers-transition:
  lifecycle: LC-STRUCTURE
  transition: REMOVE-LAST
---

## Intent

Return to an empty structure.

## Boundaries

Clauses describe observable product results. All preconditions and outcomes are conjunctive; alternatives are separate behaviours. Applicable rules supply guards and invariants. Executable evidence is external to the product model.
