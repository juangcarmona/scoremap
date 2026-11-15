---
id: SB-BACKUP-CANCEL
type: structured-behaviour
title: Cancel backup replacement
status: active
illustrates:
  - UC-BACKUP
  - BR-BACKUP
  - BR-DURABILITY
  - BR-EDIT-GUARD
given:
  - A valid current library exists
  - A valid backup has been selected
when: The musician declines replacement confirmation
then:
  - The current library remains unchanged
---

## Intent

Cancel backup replacement.

## Boundaries

Clauses describe observable product results. All preconditions and outcomes are conjunctive; alternatives are separate behaviours. Applicable rules supply guards and invariants. Executable evidence is external to the product model.
