---
id: SB-SECTION-REORDER
type: structured-behaviour
title: Preserve associated data when reordering
status: active
illustrates:
  - UC-SECTIONS
  - BR-IDENTITY
  - BR-STRUCTURE
  - BR-EDIT-GUARD
given:
  - Edit mode is active
  - Two identified sections have different chords, notes and repeat counts
when: The musician moves the second section before the first
then:
  - The order is reversed
  - Each section retains exactly its identity, chords, notes and repetition count
covers-transition:
  lifecycle: LC-STRUCTURE
  transition: REORDER
---

## Intent

Preserve associated data when reordering.

## Boundaries

Clauses describe observable product results. All preconditions and outcomes are conjunctive; alternatives are separate behaviours. Applicable rules supply guards and invariants. Executable evidence is external to the product model.
