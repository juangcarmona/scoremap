---
name: commit-validated-library-snapshots-atomically
description: Commit validated library snapshots atomically.
status: Proposed
date: 2026-11-15
deciders: []
tags:
  - pwa
  - local-first
---

# ADR-0002: Commit validated library snapshots atomically

## Context

Songs, memberships and sections must preserve referential integrity through edits, imports and failures.

<!-- pdac:cite id="BR-DURABILITY" digest="sha256:d822f18f163b8685937ae5a3137dc04ef4a2d5947ab7a9954245bd965b72fa45" -->
<!-- pdac:cite id="BR-BACKUP" digest="sha256:6e01f0285df7783f48eb0c482fa31f490f09e97e0f67a3a5fb3261dc1d1ed29c" -->

## Decision

We will initially store a versioned complete validated library per atomic IndexedDB transaction with expected-revision comparison. Imports require validation and explicit replacement confirmation.

## Consequences

- Positive: One transaction establishes a clear all-or-nothing boundary and detects stale tabs.
- Negative: Snapshots grow with attachments and may require a measured future migration.
- Neutral: The implementation and evidence can test this proposal while architecture acceptance remains reviewable.

## Alternatives considered

- Independent uncoordinated writes: can leave dangling associations.
- Implicit merge import: introduces conflict semantics not required by the MVP.

## References

- [Architecture strategy](../04-solution-strategy/README.md)
- [Canonical model](../../product/model/)
