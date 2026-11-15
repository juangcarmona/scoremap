---
id: FR-PERSIST
type: functional-requirement
title: Retain and recover local work
status: active
derived-from:
  - UC-PERSIST
verification:
  - scenario-ref: SB-PERSIST-RECOVER
  - scenario-ref: SB-PERSIST-FAILURE
  - scenario-ref: SB-PERSIST-CONFLICT
  - scenario-ref: SB-RECOVERY-INVALID
---

## Requirement

Persist complete local revisions and recover the latest acknowledged data after reopening.

## Rationale

Supports the approved prepare, rehearse and perform journey. Observable acceptance resides in the referenced Structured Behaviours.
