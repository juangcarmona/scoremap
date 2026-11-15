---
id: BR-BACKUP
type: business-rule
title: Validate complete backups before import
status: active
applies-to:
  - BC-RECOVERY
---

## Rule

Export uses a versioned ScoreMap JSON envelope with all personal data. Import validates the complete envelope, references and invariants before a single atomic replacement, after explicit replacement confirmation. Duplicate IDs, duplicate memberships, dangling associations, unsupported versions, invalid values and incomplete attachment data are rejected; current data remains unchanged on any failure.

## Rationale

Protect the musician’s content and preserve trustworthy consultation.

## Examples

Concrete accepted and refused outcomes are authored in the related Structured Behaviours.

## Exceptions

None.
