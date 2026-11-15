---
id: SB-SECTION-REMOVE
type: structured-behaviour
title: Remove one section
status: active
illustrates:
  - UC-SECTIONS
  - BR-IDENTITY
  - BR-STRUCTURE
  - BR-EDIT-GUARD
given:
  - Edit mode is active
  - A song has two sections
when: The musician removes one section
then:
  - Only the selected section and its owned information disappear
  - The other section is unchanged
covers-transition:
  lifecycle: LC-STRUCTURE
  transition: REMOVE
---

## Intent

Remove one section.

## Boundaries

Clauses describe observable product results. All preconditions and outcomes are conjunctive; alternatives are separate behaviours. Applicable rules supply guards and invariants. Executable evidence is external to the product model.
