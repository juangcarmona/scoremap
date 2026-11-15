---
id: SB-PDF-REJECT
type: structured-behaviour
title: Recover from an invalid PDF
status: active
illustrates:
  - UC-PDF
  - BR-PDF
  - BR-DURABILITY
  - BR-EDIT-GUARD
given:
  - A valid song exists
  - An unreadable PDF is supplied
when: The musician attempts to attach that PDF
then:
  - A recoverable PDF error is shown
  - The song and existing attachment remain unchanged
---

## Intent

Recover from an invalid PDF.

## Boundaries

Clauses describe observable product results. All preconditions and outcomes are conjunctive; alternatives are separate behaviours. Applicable rules supply guards and invariants. Executable evidence is external to the product model.
