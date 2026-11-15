---
id: SB-PERSIST-FAILURE
type: structured-behaviour
title: Preserve data when persistence fails
status: active
illustrates:
  - UC-PERSIST
  - BR-DURABILITY
given:
  - A durable revision exists
  - The browser cannot persist a new revision
when: The musician requests a save
then:
  - A save failure is clearly shown without a success acknowledgement
  - The prior durable revision remains recoverable
  - The musician can retain or export unsaved work
---

## Intent

Preserve data when persistence fails.

## Boundaries

Clauses describe observable product results. All preconditions and outcomes are conjunctive; alternatives are separate behaviours. Applicable rules supply guards and invariants. Executable evidence is external to the product model.
