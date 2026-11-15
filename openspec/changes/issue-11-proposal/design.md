<!-- pdac-scope: cited -->

# Personal annotations and external references: engineering plan

## Context

<!-- pdac:cite id="SB-ANNOTATIONS" digest="sha256:e9f7eeba4ec89ac374cbbe880b1a4d2899ca92f1c6fd71231d9a664a94b8660f" -->
<!-- pdac:cite id="SB-REFERENCE-INVALID" digest="sha256:e8869ae8629e53bb37c03929c6c359d644e301527c89f4840530c78264779a9a" -->
<!-- pdac:cite id="SB-REFERENCE" digest="sha256:e203d2c8d8a82bebe478f129a51a6c3fa3ff35dedd53060a161c58d144e329c1" -->
<!-- pdac:cite id="BR-EDIT-GUARD" digest="sha256:20e678c4743404c64a51c01e4446026ac95811827d2f5e1c641839291ad32718" -->
<!-- pdac:cite id="BR-IDENTITY" digest="sha256:170ef1aff15cc46041fca58b4bdda33db26b4ba91b44de4fe2aeded7a9dede67" -->
<!-- pdac:cite id="BR-REFERENCES" digest="sha256:f6c63aa91b8cd5dc754520d4015424c3c56811d90a886f62a895c9db99ce9ce3" -->
<!-- pdac:cite id="FR-ANNOTATIONS" digest="sha256:129f593fd3ff8c31fb40abf5805928901658bf3ddfdb1bb5b589c687b9515940" -->
<!-- pdac:cite id="FR-REFERENCES" digest="sha256:7e91c572a98f87aca1b524767e99c88a04958f199c4a1c5dcefd746dcae6bfce" -->
<!-- pdac:cite id="UC-ANNOTATIONS" digest="sha256:1b3e61e884b4aa938f3b9a81d07f90523bcd46514071f5d953d98cfbd7e0d715" -->
<!-- pdac:cite id="UC-REFERENCES" digest="sha256:f5c149268a2548e66b3defdfac2618dda842ffd8d2b2aeb12acf66a829eed4da" -->

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

## Shared mutation paths

The bounded paths additionally include src/features/library/domain.ts, src/features/library/useLibrary.ts and direct domain/application tests. Song and section notes use stable owner IDs and retain unsaved text on storage failure; valid web references use the same guarded save path. Reorder and reopen tests compare actual notes, references and associations.
