<!-- pdac-scope: cited -->

# Tablet song sketch and protected performance mode: engineering plan

## Context

<!-- pdac:cite id="SB-EDIT-RESUME" digest="sha256:04360461982853baddc7e4ddce8a0f0359b824ba917bb581edb2bb5dd00d585a" -->
<!-- pdac:cite id="SB-KEYBOARD" digest="sha256:da02de8f23d9eb7f43c0fb46ab22fd8ab4fab67d61dc38a453a6ba6894e0c8b8" -->
<!-- pdac:cite id="SB-PERFORMANCE-REJECT" digest="sha256:392da1d92a3d7973d37b59e113edf537539262abe257dddd74b9a8eaf925b6d9" -->
<!-- pdac:cite id="SB-PERFORMANCE" digest="sha256:c004c86080428dd85d0c3b42ce24be640955fc52f3d9245f05db6e90e6344355" -->
<!-- pdac:cite id="BR-CHORDS" digest="sha256:712786f72ab221442071a50abe47e66a472f1337c6820aec402c8df488b304a6" -->
<!-- pdac:cite id="BR-EDIT-GUARD" digest="sha256:20e678c4743404c64a51c01e4446026ac95811827d2f5e1c641839291ad32718" -->
<!-- pdac:cite id="FR-CONSULT" digest="sha256:374141996d22ae8dcdd5d619819bddb816d972b3111631c808a4eded57aae664" -->
<!-- pdac:cite id="QR-READABILITY" digest="sha256:5de81f473af42e7737008ac66afb3d9efee7e7390bf1efd7ad17fae07049a155" -->
<!-- pdac:cite id="UC-CHORDS" digest="sha256:56630e0d4211d454251c4699a5c2aca3f2465c0b08e2af13c6f628be650cbf19" -->
<!-- pdac:cite id="UC-CONSULT" digest="sha256:98b42bf562812d8b5382e42f9d45ebe37b7244b4785e88d23b90708c9b187696" -->

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

## Guard and navigation paths

The bounded paths include src/features/library/useLibrary.ts, src/features/library/domain.ts and direct application guard tests. All content commands, import, external-reference edits and attachment changes share the mode guard. PDF view-page memory is an explicit permitted consultation operation. Mode itself is transient. Test direct command rejection and UI control absence, rapid song switching and no musical-content mutation on mode transitions.

## Guarded chord editor integration from issue #8

This slice owns src/features/library/Sketch.tsx, src/features/library/domain.ts, src/features/library/useLibrary.ts, tests/library/domain.test.ts, tests/library/application.test.ts and tests/e2e/performance.spec.ts for SB-CHORD-ASSIGN, SB-CHORD-MODIFY and SB-CHORD-INVALID. Integrate the pure #8 chord model through the #5 serialized edit-mode guard and expose ordered section chord selection/replacement. Direct tests reject unsupported roots/qualities and all content writes in performance mode; browser tests select a new chord/quality and compare the chord label, selected state and actual highlighted MIDI keys immediately, then switch mode and prove no content mutation. Existing invariants and associations survive the edit.
