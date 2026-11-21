---
title: Architecture decisions
arc42-section: "09"
description: Decision index
---

# 9. Architecture decisions

This directory owns ScoreMap architecture decision records, following the installed ArcShape layout.

| Decision | ADR | Status | Date | Affected architecture |
| --- | --- | --- | --- | --- |
| Build a separate native Android application | [ADR-0010](ADR-0010-build-a-separate-native-android-application.md) | Proposed | 2026-11-21 | Native target under src/android; existing runtime and accepted product unchanged |
| Commit validated library snapshots atomically | [ADR-0002](ADR-0002-commit-validated-library-snapshots-atomically.md) | Proposed | 2026-11-15 | Persistence and recovery |
| Enforce feature and layer boundaries with executable checks | [ADR-0004](ADR-0004-enforce-feature-and-layer-boundaries-with-executable-checks.md) | Accepted | 2026-11-15 | Domain/module boundaries, Roslyn and CI gates, development/production separation integrated in PR #37 |
| Keep versioned music validation at domain boundaries | [ADR-0009](ADR-0009-keep-versioned-music-validation-at-domain-boundaries.md) | Proposed | 2026-11-20 | Partial HTTP contract, musical validation and version compatibility |
| Prepare bounded private offline copies | [ADR-0008](ADR-0008-prepare-bounded-private-offline-copies.md) | Proposed | 2026-11-18 | Explicit scope, protected cache admission, deadline and key lifecycle |
| Retain protected drafts by editing context before network serialization | [ADR-0006](ADR-0006-retain-protected-drafts-by-editing-context.md) | Proposed | 2026-11-17 | Protected retention, save ordering, backward compatibility and safe termination |
| Self-host the private application with Aspire | [ADR-0003](ADR-0003-self-host-the-private-application-with-aspire.md) | Accepted | 2026-11-15 | Composition, persistence and access integrated in PR #37; operator deployment remains separate |
| Separate personal-resource recovery keys | [ADR-0007](ADR-0007-separate-personal-resource-recovery-keys.md) | Proposed | 2026-11-17 | Principal-owned commands, independent acknowledgement and protected recovery |
| Use a local-first browser runtime | [ADR-0001](ADR-0001-use-a-local-first-browser-runtime.md) | Accepted by owner constraints | 2026-11-15 | Runtime and deployment |
| Use Tonal primitives with the accepted harmony catalogue | [ADR-0005](ADR-0005-use-tonal-primitives-with-the-accepted-harmony-catalogue.md) | Proposed | 2026-11-17 | Musical theory boundary, catalogue validation and identification |
