---
id: BC-RECOVERY
type: bounded-context
title: Acknowledged continuity and recovery
status: draft
---

## Responsibility

Retain, reconstruct and transfer complete personal work at explicit anonymous-local and authenticated-server commit boundaries, including protected pending work and recoverable history.

## Language

Library, backup, schema version, content revision, pending work, acknowledgement, expected revision, retry receipt, claim, conflict and restore.

## Boundaries

No silent conflict merge, cross-account recovery, imported authority or promise of instant offline revocation. Persistence status is not a song lifecycle.

## External Relationships

Library supplies identity/capability/retention rules; Sketch supplies complete musical invariants. Acknowledged private recovery is service-authoritative while approved device work remains explicitly pending. Operator backups have a separate documented restore/retention contract.
