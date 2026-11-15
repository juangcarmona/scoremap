---
id: SB-SECTION-INVALID-ORDER
type: structured-behaviour
title: Reject missing or duplicate section identities
status: active
illustrates:
  - UC-SECTIONS
  - BR-IDENTITY
  - BR-STRUCTURE
  - BR-EDIT-GUARD
given:
  - Edit mode is active
  - A song contains two sections
when: The musician submits an order containing one identity twice
then:
  - The reorder is refused
  - The previous order and all associations remain unchanged
---

## Intent

Reject missing or duplicate section identities.

## Boundaries

Clauses describe observable product results. All preconditions and outcomes are conjunctive; alternatives are separate behaviours. Applicable rules supply guards and invariants. Executable evidence is external to the product model.
