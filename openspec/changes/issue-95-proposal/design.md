# Design

<!-- pdac-scope: none reason="This design selects build-tooling implementation details and changes no product semantics." -->

## Context

See proposal.md. The accepted architecture requires an isolated `src/android` Gradle build and preservation of the root web/backend paths. The repository's bootstrap evidence qualifies a stable version set for a temporary Compose/Room app, but does not qualify the complete ScoreMap graph or its managed-device tests.

## Goals / Non-Goals

**Goals:** establish a reproducible Android build boundary, strict host test task, and a managed-device verification entry point; keep all root verification gates active.

**Non-Goals:** implement native music features, claim full AND-02 architecture enforcement, certify physical tablet acceptance, or change existing product semantics.

## Decisions

- Use the repository-qualified JDK 21 / Gradle 9.7 / AGP 9.3.1 / Kotlin 2.4.21 set and official Gradle distribution SHA-256, rather than independently guessing versions.
- Keep Android configuration isolated under `src/android`; root Node verification invokes its host aggregate, not internal Gradle tasks piecemeal.
- Separate host JVM checks from managed-device checks. Device tests must fail when the device target or expected instrumentation suite is absent; a host-only pass cannot stand in for device evidence.
- Use the official generated wrapper and artifact verification metadata. Dependency locks/checksums must be generated from actual resolutions, never fabricated.
- Preserve native code in credential inventory while allowing TypeScript-specific discovery to continue classifying its own file types.

## Risks / Trade-offs

- [Risk] Qualified AGP/SDK artifacts or a managed device may be unavailable in this worker → report failed/unavailable qualification and do not represent it as a passing build.
- Strict Kotlin compilation, formatting, Detekt, debug/release Lint and finite synthetic host/device suites belong to this foundation. Full AND-02 graph, compiled-boundary and rejected-architecture matrices remain owned by the next slice; no placeholders count as their execution.
- [Risk] Root verification increases build time → invoke one bounded Android host aggregate and preserve the prior command chain unchanged.

## Migration Plan

No data migration. The wrapper and root verification entry point are additive. Rollback consists of removing the isolated build and its root invocation; no existing runtime data or application paths are changed.

## Open Questions

None for this tooling-only slice. Actual managed-device availability is an execution result, not a product decision.
