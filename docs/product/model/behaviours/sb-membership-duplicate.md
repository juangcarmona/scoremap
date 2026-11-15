---
id: SB-MEMBERSHIP-DUPLICATE
type: structured-behaviour
title: Refuse duplicate membership
status: active
illustrates:
  - UC-MEMBERSHIP
  - BR-IDENTITY
  - BR-EDIT-GUARD
given:
  - Edit mode is active
  - The song already belongs to the repertoire
when: The musician adds that song again
then:
  - The operation is refused with a readable reason
  - Exactly one membership remains
---

## Intent

Refuse duplicate membership.

## Boundaries

Clauses describe observable product results. All preconditions and outcomes are conjunctive; alternatives are separate behaviours. Applicable rules supply guards and invariants. Executable evidence is external to the product model.
