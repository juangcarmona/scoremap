---
id: SB-REFERENCE-INVALID
type: structured-behaviour
title: Reject an unsafe reference scheme
status: active
illustrates:
  - UC-REFERENCES
  - BR-REFERENCES
  - BR-EDIT-GUARD
given:
  - Edit mode is active
when: The musician supplies a script or non-web URL
then:
  - The reference is rejected
  - Song content remains unchanged
---

## Intent

Reject an unsafe reference scheme.

## Boundaries

Clauses describe observable product results. All preconditions and outcomes are conjunctive; alternatives are separate behaviours. Applicable rules supply guards and invariants. Executable evidence is external to the product model.
