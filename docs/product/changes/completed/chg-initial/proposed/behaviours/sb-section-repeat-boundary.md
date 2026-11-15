---
id: SB-SECTION-REPEAT-BOUNDARY
type: structured-behaviour
title: Reject invalid repetition counts
status: active
illustrates:
  - UC-SECTIONS
  - BR-IDENTITY
  - BR-STRUCTURE
  - BR-EDIT-GUARD
given:
  - Edit mode is active
  - A section exists
when: The musician assigns a repetition count outside the integer range one
  through ninety-nine
then:
  - The operation is refused
  - The existing count remains unchanged
---

## Intent

Reject invalid repetition counts.

## Boundaries

Clauses describe observable product results. All preconditions and outcomes are conjunctive; alternatives are separate behaviours. Applicable rules supply guards and invariants. Executable evidence is external to the product model.
