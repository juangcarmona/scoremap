---
title: Risks and technical debt
arc42-section: "11"
description: Known limits and qualification needs
---

# 11. Risks and technical debt

Browser data can be evicted or removed by the device owner; export is the initial recovery mechanism. Origin changes isolate local data. Whole-library snapshots favor simplicity; large PDF libraries may require separate attachment object stores after measured limits justify a migration. Multiple sessions need revision conflict rejection.

<!-- pdac:cite id="BR-DURABILITY" digest="sha256:6b075527861da086b9571e8d117c7844348a437e363423bca46f60cc83b02e0b" -->

GitHub branch-rule availability, repository App installation, runner authorization, provider access and the selected HTTPS deployment target are operational prerequisites, tracked in delivery evidence. Enforced-check unavailability must not be treated as authorization to weaken completion gates. Physical Android installation and tablet-distance readability need owner/device evidence.

## Accepted evolution gaps

- ADR-0003/0004 describe the target, while the accepted product model and implementation remain browser-only. #20 must resolve this explicitly before backend work; documentation is not a Product Change apply receipt.
- No backend compiler, Roslyn analyzer activation, layer gate, PostgreSQL authorization test or production composition exists in ScoreMap yet. Imported source examples and passing frontend CI cannot establish those properties. The [section 10 matrix](../10-quality-requirements/README.md) remains a delivery obligation until actual runs and negative-build evidence exist.
- Raccord and DomusMind are references, not templates to copy indiscriminately. DomusMind documents shared-DbContext ownership limitations; Raccord's bespoke analyzers have a different handler/assembly contract from Lighthouse. Feature-module naming, exported payload checks and evaluated build activation need deliberate compatibility tests.
- Self-hosting transfers patching, backup, restore and availability responsibility to the operator. Development AppHost success is not production qualification; persistent volumes alone are not recoverable backups. Required production configuration must fail closed without publishing private values.
