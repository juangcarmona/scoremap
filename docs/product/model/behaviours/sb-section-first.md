---
id: SB-SECTION-FIRST
type: structured-behaviour
title: Insert a first section
status: active
illustrates:
  - UC-SECTIONS
  - BR-IDENTITY
  - BR-STRUCTURE
  - BR-EDIT-GUARD
given:
  - Edit mode is active
  - A song has no sections
when: The musician inserts Intro
then:
  - One section with a fresh identity appears
  - The song has an arranged structure
covers-transition:
  lifecycle: LC-STRUCTURE
  transition: INSERT-FIRST
---

## Intent

Insert a first section.

## Boundaries

Clauses describe observable product results. All preconditions and outcomes are conjunctive; alternatives are separate behaviours. Applicable rules supply guards and invariants. Executable evidence is external to the product model.
