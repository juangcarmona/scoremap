---
id: FR-BACKUP
type: functional-requirement
title: Transfer a validated library
status: active
derived-from:
  - UC-BACKUP
verification:
  - scenario-ref: SB-BACKUP-EXPORT
  - scenario-ref: SB-BACKUP-IMPORT
  - scenario-ref: SB-BACKUP-IMPORT-EMPTY
  - scenario-ref: SB-BACKUP-REJECT
  - scenario-ref: SB-BACKUP-CANCEL
---

## Requirement

Export all local content and explicitly replace from a fully validated backup.

## Rationale

Supports the approved prepare, rehearse and perform journey. Observable acceptance resides in the referenced Structured Behaviours.
