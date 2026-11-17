---
title: Solution strategy
arc42-section: "04"
description: Small feature slices with a pure domain boundary
---

# 4. Solution strategy

The planned source boundary is `src/features/library/`: pure domain types and commands, a local persistence adapter and feature UI. `src/app/` composes the application shell; `src/features/sketch/` owns the chord geometry and piano presentation. Domain functions import no React or browser persistence. Application mutation entrypoints enforce interaction mode before any content change.

<!-- pdac:cite id="BR-EDIT-GUARD" digest="sha256:20e678c4743404c64a51c01e4446026ac95811827d2f5e1c641839291ad32718" -->

The anonymous application retains local persistence under [ADR-0001](../09-architecture-decisions/ADR-0001-use-a-local-first-browser-runtime.md). The connected candidate uses TanStack Query for session-scoped server reads and explicit application mutation operations. Transient musical selection and interaction drafts remain local React state.

## Accepted evolution strategy

Keep the React PWA and deliver useful musical editing slices before requiring server integration. Add one self-hosted ASP.NET Core BFF/API, PostgreSQL and Aspire composition under [ADR-0003](../09-architecture-decisions/ADR-0003-self-host-the-private-application-with-aspire.md). Use a domain-centric modular monolith with feature-oriented use cases and explicit logical layers under [ADR-0004](../09-architecture-decisions/ADR-0004-enforce-feature-and-layer-boundaries-with-executable-checks.md), not a service or project for every musical noun.

Reuse the installed Lighthouse .NET profile and analyzer/verifier contract. Adapt Raccord's executable dependency checks and DomusMind's pure-domain and development/deployment separation, without importing their financial/household models or optional infrastructure. [Section 05](../05-building-block-view/README.md) owns the target dependency graph; [section 10](../10-quality-requirements/README.md) owns required enforcement evidence. These are target obligations, not checks already running in this frontend-only repository. Product Change #20 remains the semantic implementation gate.

## Identified musical content candidate

Version-2 songs retain the shared section sequence and add identified measures and timed harmonic events, independent arrangements and their owned parts, performed occurrences, voicings and physical bindings. Exact rational quarter-note positions use integer arithmetic; performed spelling, octave and absolute pitch must agree. The finite ProductShape catalogue generates matching TypeScript and C# definitions; the browser theory adapter uses evaluated pinned Tonal primitives under [ADR-0005](../09-architecture-decisions/ADR-0005-use-tonal-primitives-with-the-accepted-harmony-catalogue.md). That proposed library decision does not itself establish builder or arrangement acceptance.

The library envelope supports versions 1 and 2, with an explicit per-song version for richer content. Reading a collaborator's legacy song never migrates it. An explicit upgrade first commits the exact preserved legacy-to-rich transformation; later musical edits use subsequent revisions. Legacy imports migrate only newly imported songs on the server. Both adapters retain the complete original and generated-identity mapping atomically with activation. Anonymous recovery copies share the existing IndexedDB transaction; private source snapshots and mapping journals share the PostgreSQL song commit. Existing private songs retain their immutable prior revision; new legacy imports retain source revision zero. Exporting that history produces an ordinary supported backup.

The private compatibility marker advances to 2 only after a rich song commits. Previous binaries refuse that database on startup. Operator rollback requires a matching database/key/configuration backup rather than running an old binary against new content. Musical source fixtures and failure tests are synthetic; user trial data is isolated from qualification.
