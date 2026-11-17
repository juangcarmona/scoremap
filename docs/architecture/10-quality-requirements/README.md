---
title: Quality requirements
arc42-section: "10"
description: Verification of architectural qualities
---

# 10. Quality requirements

Pure command tests exercise identity, valid/refused transitions and chord intervals. Storage integration tests exercise transaction failures and stale revisions. Browser journeys cover touch-oriented editing, read-only performance, durable reload, import/export, actual offline operation, manifest/worker readiness and PDF navigation when supported. Axe checks supplement contrast and responsive consultation inspection.

<!-- pdac:cite id="QR-INTEGRITY" digest="sha256:ab546fccd5704db577b5005460adc8c643dc6adb9173cf2ee750e7f1e6e0ae3e" -->

Acceptance requires behaviour evidence and independent review. Test counts, schema validity, generated diagrams and workflow success are separate observations.

<!-- pdac:cite id="QR-OFFLINE" digest="sha256:a3c8b14e8eb2c0b1a419ec1a266cf50ff4d0b739936b2f6cf0c0cdfc7db38827" -->

## Required executable architecture gates for the evolution

These gates implement [ADR-0004](../09-architecture-decisions/ADR-0004-enforce-feature-and-layer-boundaries-with-executable-checks.md); they are **specified, not activated in ScoreMap**. The repository has no .NET solution yet. Accepting documentation or creating tests is not proof that an analyzer ran, a merge check is required or a production deployment passed.

| Boundary | Required enforcement and independent rejection evidence |
| --- | --- |
| Handler visibility / sealing | Reuse Lighthouse LH1001 with its actual typed command/query interfaces. Positive and negative semantic fixtures include aliased and inherited interfaces; an unrelated class merely named Handler is not proof. A different abstraction requires a tested adapter/rule. |
| Cross-module implementation references | Reuse LH1002 for the adopted assembly family. A real build must reject even an unused sibling implementation reference and accept the explicit contract reference. Do not claim it detects runtime DI, reflection or unsafe DTO contents. |
| Analyzer activation | Inspect evaluated MSBuild properties and analyzer-only references for every solution implementation module, including newly added modules. Missing `LighthouseModule`, missing CompilerVisibleProperty, absent analyzer references or downgraded diagnostics fail verification. |
| Domain and application layer purity | Add product-specific semantic namespace/type rules and source/project/compiled dependency tests for the graph in section 05. Reject domain framework/storage/transport dependencies, application direct EF/HTTP coupling, controller introduction and endpoint-to-DbContext shortcuts. Inspect references even when unused; check actual type binding rather than grep alone. These checks are not supplied by LH1001/LH1002. |
| Public boundary shape | Test allowed exported symbols and API contracts; reject entities, persistence/DbContext/IQueryable and recursively nested generic/array DTO leaks. Fixtures include aliases, fully qualified types, global usings and inheritance; valid public DTOs and BCL-only domain types pass. Raccord's examples are a starting point, not proof these edge cases are covered. |
| Toolchain and code quality | Pin supported SDK, central package/analyzer versions and NuGet lock files. Locked restore; nullable, SDK .NET analyzers, Roslynator and Meziantou with warnings as errors; one pinned C# formatter in verify mode, retaining existing frontend lint/Prettier. Audit transitive packages; no blanket vulnerability suppression. |
| Frontend/API boundaries | Fixture-tested import-direction checks for app/features/shared and reviewed public exceptions; generated OpenAPI client drift fails CI. Preserve existing strict TypeScript, accessibility and design-token conventions. |
| Authorization and data integrity | Real PostgreSQL and HTTP tests for ownership/role matrix, nested resources, direct calls, stale revisions, concurrent revocation, atomic failure, idempotent retries, migration and complete revision restore. Fixtures/mocks and EF InMemory do not close these gates. |
| Development/production separation | Disposable production-artifact smoke test rejects development identity/seeds, Vite and ephemeral persistence fallbacks; verifies configured private database, migrations, persistent keys, restart, session/CSRF/proxy behavior and restored synthetic data. Test the generic contract without revealing deployment values. |
| Security and release hygiene | Blocking secret, code/dependency and built-artifact scans with pinned configuration and scoped expiring exceptions. Record image/dependency SBOM and accepted license policy. Supply-chain scan success is separate from authorization/restore acceptance; heavyweight nightly checks require a demonstrated benefit. |

New semantic rules need stable diagnostic identifiers, useful remediation, positive/negative compiler fixtures and a real deliberately broken-build rehearsal. Start with existing Lighthouse tooling; do not fork a new generic architecture framework. The verifier must itself fail if a broken fixture unexpectedly builds, if a module opts out or if a documented boundary lacks its declared gate.

Suppressions/exceptions name the diagnostic/rule, narrow path/symbol scope, reason, owner, expiry/review date and compensating test. No global disable, broad namespace allowlist, generated-code label or check filter may conceal architectural violations. Any exception to an approved layer boundary needs an owner-reviewed decision and updated negative fixtures.

Later implementation must declare backend restore/build/test/format, architecture/analyzer rejection, frontend contract and security commands in `package.json`, CI and `.lighthouse/implement.json`; `npm run verify` must invoke the appropriate gates without removing existing product/citation/OpenSpec/app checks. Use the installed Lighthouse verifier where compatible. Required branch statuses and current-head independent review need observed configuration/receipts; merely adding a workflow is not enforcement. #27 owns integrated qualification, not all tests deferred until the end.


## Candidate executable checks

The candidate invokes the [installed backend verifier and bounded additional probes](../../../scripts/verify-backend-boundaries.mjs) through package commands. LH1001/LH1002 retain their supplied semantic implementation. Separate SM1001–SM1004 rules check pure dependencies, recursive public payloads, inherited controllers and actual ASP.NET endpoint-to-infrastructure references; compiler tests include aliases, fully qualified types, nested collections/arrays and allowed DTO/BCL cases. Real invalid builds are required independently of the unit-test assertions.

[Frontend direction checks](../../../scripts/verify-frontend-boundaries.mjs) preserve the explicit Library-to-Sketch musical surface and reject upward/shared dependency violations. [Security checks](../../../scripts/verify-security.mjs) retain credential-pattern refusal, a zero-advisory runtime dependency gate, a high/critical tooling gate and a generated browser SBOM; lower-severity development advisories remain visible. These checks do not attest all issue28 controls or actual deployment.

[Connected browser tests](../../../tests/connected/private-library.spec.ts) exercise real OIDC, PostgreSQL, import/edit/reopen, independent owners, roles, revocation, stale writes and retry receipts. Authored cases, terminal execution, current-head required statuses and independent source review are separate evidence. Full new musical/retention/offline behaviour coverage remains a delivery obligation; the first connected checkpoint cannot be relabelled as complete epic acceptance.

<!-- pdac:cite id="FR-PERSIST" digest="sha256:5f901e669e39923921cd1d28302b3f308460a72bda3bce53d83ffa7255934cd4" -->
