---
id: SB-REFERENCE
type: structured-behaviour
title: Add and open an external reference
status: active
illustrates:
  - UC-REFERENCES
  - BR-REFERENCES
  - BR-EDIT-GUARD
given:
  - Edit mode is active
  - A song has pending personal notes
when: The musician adds and opens an absolute HTTPS reference
then:
  - The reference remains associated with that song
  - The external page opens separately
  - Pending application state remains available
---

## Intent

Add and open an external reference.

## Boundaries

Clauses describe observable product results. All preconditions and outcomes are conjunctive; alternatives are separate behaviours. Applicable rules supply guards and invariants. Executable evidence is external to the product model.
