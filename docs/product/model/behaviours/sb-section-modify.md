---
id: SB-SECTION-MODIFY
type: structured-behaviour
title: Rename and repeat a section
status: active
illustrates:
  - UC-SECTIONS
  - BR-IDENTITY
  - BR-STRUCTURE
  - BR-EDIT-GUARD
given:
  - Edit mode is active
  - A section has chords and notes
when: The musician changes its label and sets its repeat count to three
then:
  - Its identity, chords and notes are preserved
  - The sketch displays the new label and three repetitions
covers-transition:
  lifecycle: LC-STRUCTURE
  transition: MODIFY
---

## Intent

Rename and repeat a section.

## Boundaries

Clauses describe observable product results. All preconditions and outcomes are conjunctive; alternatives are separate behaviours. Applicable rules supply guards and invariants. Executable evidence is external to the product model.
