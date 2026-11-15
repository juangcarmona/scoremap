---
id: QR-INTEGRITY
type: quality-requirement
title: No silent data loss
status: active
quality-attribute: integrity
applies-to:
  - JRN-PREPARE-PERFORM
verification:
  - scenario-ref: SB-PERSIST-FAILURE
  - scenario-ref: SB-PERSIST-CONFLICT
  - scenario-ref: SB-BACKUP-REJECT
---

## Requirement

Invalid operations and storage failures preserve the last acknowledged valid library; stale concurrent writes and invalid backups are refused.

## Measurement

Retain deterministic behaviour verification, browser interaction evidence and independent assessment; rendering or test counts alone do not establish acceptance.
