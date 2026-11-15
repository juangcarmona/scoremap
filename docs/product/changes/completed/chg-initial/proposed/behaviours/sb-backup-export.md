---
id: SB-BACKUP-EXPORT
type: structured-behaviour
title: Export the complete library
status: active
illustrates:
  - UC-BACKUP
  - BR-BACKUP
  - BR-DURABILITY
  - BR-EDIT-GUARD
given:
  - A valid local library exists
when: The musician exports a backup
then:
  - A versioned ScoreMap JSON document contains all songs, memberships and
    associated local content
  - Export does not change the library
---

## Intent

Export the complete library.

## Boundaries

Clauses describe observable product results. All preconditions and outcomes are conjunctive; alternatives are separate behaviours. Applicable rules supply guards and invariants. Executable evidence is external to the product model.
