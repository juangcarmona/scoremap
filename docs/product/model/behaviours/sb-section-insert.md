---
id: SB-SECTION-INSERT
type: structured-behaviour
title: Insert another section
status: active
illustrates:
  - UC-SECTIONS
  - BR-IDENTITY
  - BR-STRUCTURE
  - BR-EDIT-GUARD
given:
  - Edit mode is active
  - A song has one section
when: The musician inserts a custom section
then:
  - A second independently identified section is appended
  - The first section retains its content
covers-transition:
  lifecycle: LC-STRUCTURE
  transition: INSERT
---

## Intent

Insert another section.

## Boundaries

Clauses describe observable product results. All preconditions and outcomes are conjunctive; alternatives are separate behaviours. Applicable rules supply guards and invariants. Executable evidence is external to the product model.
