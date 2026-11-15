---
id: SB-BACKUP-REJECT
type: structured-behaviour
title: Reject invalid or duplicate backup data
status: active
illustrates:
  - UC-BACKUP
  - BR-BACKUP
  - BR-DURABILITY
  - BR-EDIT-GUARD
given:
  - A valid current library exists
when: The musician imports malformed, unsupported or inconsistent backup content
then:
  - Import is refused before any replacement
  - The current library remains unchanged
  - The validation reason is visible
---

## Intent

Reject invalid or duplicate backup data.

## Boundaries

Clauses describe observable product results. All preconditions and outcomes are conjunctive; alternatives are separate behaviours. Applicable rules supply guards and invariants. Executable evidence is external to the product model.
