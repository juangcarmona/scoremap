---
title: Architecture decisions
arc42-section: "09"
description: Decision index
---

# 9. Architecture decisions

This directory owns ScoreMap architecture decision records, following the installed ArcShape layout.

| Decision | ADR | Status | Date | Affected architecture |
| --- | --- | --- | --- | --- |
| Use a local-first browser runtime | [ADR-0001](ADR-0001-use-a-local-first-browser-runtime.md) | Accepted by owner constraints | 2026-11-15 | Runtime and deployment |
| Commit validated library snapshots atomically | [ADR-0002](ADR-0002-commit-validated-library-snapshots-atomically.md) | Proposed | 2026-11-15 | Persistence and recovery |
| Self-host the private application with Aspire | [ADR-0003](ADR-0003-self-host-the-private-application-with-aspire.md) | Accepted | 2026-11-15 | Evolution target: composition, deployment, persistence and access; current alpha remains unchanged |
| Enforce feature and layer boundaries with executable checks | [ADR-0004](ADR-0004-enforce-feature-and-layer-boundaries-with-executable-checks.md) | Accepted | 2026-11-15 | Evolution target: domain/module boundaries, Roslyn and CI gates, development/production separation; enforcement not activated yet |
| Use Tonal primitives with the accepted harmony catalogue | [ADR-0005](ADR-0005-use-tonal-primitives-with-the-accepted-harmony-catalogue.md) | Proposed | 2026-11-17 | Musical theory boundary, catalogue validation and identification |
