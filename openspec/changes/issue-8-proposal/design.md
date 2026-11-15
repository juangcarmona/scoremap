<!-- pdac-scope: cited -->

# Musical chord model and accurate keyboard: engineering plan

## Context

<!-- pdac:cite id="SB-CHORD-ASSIGN" digest="sha256:adbbe7a3f7aef1a2a289f8ee00870b0ce7ad8893343d70b3ca0f1d16c524423b" -->
<!-- pdac:cite id="SB-CHORD-INVALID" digest="sha256:cece725b540bd03418e078c052573403e8d91a0dec719a841cb8812b0128c51f" -->
<!-- pdac:cite id="SB-CHORD-MODIFY" digest="sha256:22362c97fc63f3f2c09e70daf1b916611f624e2a27d7304ad1df7e35ee729d91" -->
<!-- pdac:cite id="SB-KEYBOARD" digest="sha256:da02de8f23d9eb7f43c0fb46ab22fd8ab4fab67d61dc38a453a6ba6894e0c8b8" -->
<!-- pdac:cite id="BR-CHORDS" digest="sha256:712786f72ab221442071a50abe47e66a472f1337c6820aec402c8df488b304a6" -->
<!-- pdac:cite id="BR-EDIT-GUARD" digest="sha256:20e678c4743404c64a51c01e4446026ac95811827d2f5e1c641839291ad32718" -->
<!-- pdac:cite id="FR-CHORDS" digest="sha256:2150e3670c5d3f955db8fd6b2300813b2d43b4c5cb7fc0f231a5385299da6c52" -->
<!-- pdac:cite id="UC-CHORDS" digest="sha256:56630e0d4211d454251c4699a5c2aca3f2465c0b08e2af13c6f628be650cbf19" -->

## Goals / Non-Goals

Realize the cited semantics within the slice. Preserve other features, product authority and existing provider/model selection.

## Decisions

Use pure invariant-checked domain transformations, a serialized application mutation boundary and atomic revision-checked storage. UI controls expose success, empty, error and performance-read-only states. Relevant architecture: docs/architecture and ADR-0001/0002.

## Verification

Derive executable tests from every relevant SB; valid lifecycle transitions use their authored covers-transition pair. Refused operations perform no transition. Exercise identity, membership, ordering, chord intervals and data-preserving failure conditions according to scope. Cross-browser-boundary outcomes need actual browser interaction. Run typecheck, unit/integration, provider citation checks, architecture/baseline checks and applicable browser tests. Retain exact tested source and command outcomes.

## Risks / Trade-offs

GitHub enforcement/App and the unselected deployment target may block native completion or deployment independently of local correctness. Device emulation does not prove physical Android installation. Whole-library snapshots may need measured future migration for large PDFs.

## Review gates

Independent plan assessment precedes production code. Independent implementation review evaluates observable behaviour and test strength. Missing reviews remain pending. Integration requires the actual configured native gates, including current-head owner authorization; this plan grants no new permission.

## Pure musical slice and guarded integration ownership

Issue #8 completes only the pure chord parser/pitch-class model and accurate piano geometry/presentation with deterministic musical verification. It does not claim the section chord-editing application flow is delivered. The application's SB-CHORD-ASSIGN/MODIFY/INVALID integration and browser-visible keyboard refresh belong to issue #9, after its #7 and #8 prerequisites; #7 already depends on #5's serialized application boundary. No issue #8 completion claim may include unimplemented editor integration.
