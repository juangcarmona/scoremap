---
id: SB-EDIT-RESUME
type: structured-behaviour
title: Return deliberately to editing
status: active
illustrates:
  - UC-CONSULT
  - BR-EDIT-GUARD
given:
  - Performance mode is active
when: The musician deliberately switches to edit mode
then:
  - Editing controls become available
  - The musical content is unchanged
---

## Intent

Return deliberately to editing.

## Boundaries

Clauses describe observable product results. All preconditions and outcomes are conjunctive; alternatives are separate behaviours. Applicable rules supply guards and invariants. Executable evidence is external to the product model.
