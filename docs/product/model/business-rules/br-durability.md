---
id: BR-DURABILITY
type: business-rule
title: Acknowledge durable writes
status: active
applies-to:
  - BC-RECOVERY
---

## Rule

A successful save acknowledges an atomic complete valid local library revision. A failed save never reports success or replaces the previous durable revision. An unreadable or unsupported stored version is reported without replacement. Concurrent stale revisions are rejected; no silent last-writer loss.

## Rationale

Protect the musician’s content and preserve trustworthy consultation.

## Examples

Concrete accepted and refused outcomes are authored in the related Structured Behaviours.

## Exceptions

None.
