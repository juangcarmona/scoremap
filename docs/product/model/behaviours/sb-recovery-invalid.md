---
id: SB-RECOVERY-INVALID
type: structured-behaviour
title: Preserve unreadable stored data
status: active
illustrates:
  - UC-PERSIST
  - BR-DURABILITY
given:
  - The stored library is unreadable or has an unsupported version
when: The musician opens ScoreMap
then:
  - An actionable recovery error is shown
  - The stored data is not replaced by an empty library
---

## Intent

Preserve unreadable stored data.

## Boundaries

Clauses describe observable product results. All preconditions and outcomes are conjunctive; alternatives are separate behaviours. Applicable rules supply guards and invariants. Executable evidence is external to the product model.
