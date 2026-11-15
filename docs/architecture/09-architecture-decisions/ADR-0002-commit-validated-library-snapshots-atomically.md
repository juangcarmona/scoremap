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

<!-- pdac:cite id="BR-DURABILITY" digest="sha256:f6e8a52fdb28d495f07304870d8d2bfa6c6e5adce7722d919ce64efca735c57e" -->
<!-- pdac:cite id="BR-BACKUP" digest="sha256:4344f228dbb32818f9dfdce278ec73ac6acd8dc4689069ac6c79d12c1571b917" -->

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
