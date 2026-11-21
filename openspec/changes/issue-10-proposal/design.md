<!-- pdac-scope: cited -->

# Installable offline PWA: engineering plan

## Context

<!-- pdac:cite id="SB-OFFLINE" digest="sha256:c8e62d06222a082c057240a58f14633bda2e04f4655a6a0beb6c1f54af7e7955" -->
<!-- pdac:cite id="BR-DURABILITY" digest="sha256:d822f18f163b8685937ae5a3137dc04ef4a2d5947ab7a9954245bd965b72fa45" -->
<!-- pdac:cite id="CON-PLATFORM" digest="sha256:276120bdea8e88293e6843367e84966dacdad452cd568a124f64f73a24b529d5" -->
<!-- pdac:cite id="FR-OFFLINE" digest="sha256:f39bedc59d2b0506bd49854b84996662f18997159a708d204b54ddecc3c910c1" -->
<!-- pdac:cite id="UC-OFFLINE" digest="sha256:1106de43fb4ae8be6f0841e7e806c92c3ee15b2050cfc56b74b3d35292aa1922" -->

## Goals / Non-Goals

Realize the cited semantics within the slice. Preserve other features, product authority and existing provider/model selection.

## Decisions

Use pure invariant-checked domain transformations, a serialized application mutation boundary and atomic revision-checked storage. UI controls expose success, empty, error and performance-read-only states. Relevant architecture: docs/architecture and ADR-0001/0002.

## Verification

Derive executable tests from every relevant SB; valid lifecycle transitions use their authored covers-transition pair. Refused operations perform no transition. Exercise identity, membership, ordering, chord intervals and data-preserving failure conditions according to scope. Cross-browser-boundary outcomes need actual browser interaction. Run typecheck, unit/integration, provider citation checks, architecture/baseline checks and applicable browser tests. Retain exact tested source and command outcomes.

## Risks / Trade-offs

GitHub enforcement/App and owner-managed publication may block native completion or deployment independently of local correctness. Device emulation does not prove physical Android installation. Whole-library snapshots may need measured future migration for large PDFs.

## Review gates

Independent plan assessment precedes production code. Independent implementation review evaluates observable behaviour and test strength. Missing reviews remain pending. Integration requires the actual configured native gates, including current-head owner authorization; this plan grants no new permission.

## Corrected dependency and production update verification

Issue #11 is an additional prerequisite: this slice's offline journey edits an annotation that must already exist in the application. Native GitHub dependency records must match this plan.

The bounded paths include src/app/App.tsx, src/app/registerPwa.ts, src/service-worker.ts when required by the selected plugin route, public/icons/, tests/e2e/offline.spec.ts, tests/e2e/update.spec.ts, vite.config.ts and package scripts. Use production builds and a real browser, not Vite dev-service-worker assumptions. First cache build A and save content, then serve build B at the same origin and request a service-worker update. Assert B remains waiting during performance consultation and no automatic reload occurs. Activate only after explicit update action; assert acknowledged content survives activation and a later offline reload. Test first install separately with manifest/icon/installability evidence. Existing workers are never removed as an update shortcut.
