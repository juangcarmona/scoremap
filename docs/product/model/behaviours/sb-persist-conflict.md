---
id: SB-PERSIST-CONFLICT
type: structured-behaviour
title: Reject a stale concurrent write
status: active
illustrates:
  - UC-PERSIST
  - BR-DURABILITY
given:
  - Two open sessions read the same local revision
  - One session saves a newer revision
when: The other session attempts to save its older revision
then:
  - The stale write is refused
  - The newer durable data is preserved
  - The conflict is visible and the older session can export its work
---

## Intent

Reject a stale concurrent write.

## Boundaries

Clauses describe observable product results. All preconditions and outcomes are conjunctive; alternatives are separate behaviours. Applicable rules supply guards and invariants. Executable evidence is external to the product model.
