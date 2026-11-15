---
id: SB-BACKUP-IMPORT-EMPTY
type: structured-behaviour
title: Restore an intentionally empty library
status: active
illustrates:
  - UC-BACKUP
  - BR-BACKUP
  - BR-DURABILITY
  - BR-EDIT-GUARD
given:
  - Edit mode is active
  - A valid supported empty backup is supplied
  - The musician explicitly confirms replacement
when: The musician imports the backup
then:
  - The library becomes empty atomically
  - The empty result is visible
covers-transition:
  lifecycle: LC-LIBRARY
  transition: IMPORT-EMPTY
---

## Intent

Restore an intentionally empty library.

## Boundaries

Clauses describe observable product results. All preconditions and outcomes are conjunctive; alternatives are separate behaviours. Applicable rules supply guards and invariants. Executable evidence is external to the product model.
