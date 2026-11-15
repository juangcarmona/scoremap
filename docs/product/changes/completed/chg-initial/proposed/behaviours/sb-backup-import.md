---
id: SB-BACKUP-IMPORT
type: structured-behaviour
title: Replace from a validated backup
status: active
illustrates:
  - UC-BACKUP
  - BR-BACKUP
  - BR-DURABILITY
  - BR-EDIT-GUARD
given:
  - Edit mode is active
  - A supported backup containing songs satisfies every invariant
  - The musician explicitly confirms replacement
when: The musician imports the backup
then:
  - All imported associations, identities, order and content are recovered
    atomically
  - No extra songs are silently merged
covers-transition:
  lifecycle: LC-LIBRARY
  transition: IMPORT-POPULATED
---

## Intent

Replace from a validated backup.

## Boundaries

Clauses describe observable product results. All preconditions and outcomes are conjunctive; alternatives are separate behaviours. Applicable rules supply guards and invariants. Executable evidence is external to the product model.
