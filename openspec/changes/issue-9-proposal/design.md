<!-- pdac-scope: cited -->

# Tablet song sketch and protected performance mode: engineering plan

## Context

<!-- pdac:cite id="SB-EDIT-RESUME" digest="sha256:04360461982853baddc7e4ddce8a0f0359b824ba917bb581edb2bb5dd00d585a" -->
<!-- pdac:cite id="SB-KEYBOARD" digest="sha256:cda070d024497257667b098a1cdd8841ea33ef5c1483ae5094a2370e6ea751a7" -->
<!-- pdac:cite id="SB-PERFORMANCE-REJECT" digest="sha256:392da1d92a3d7973d37b59e113edf537539262abe257dddd74b9a8eaf925b6d9" -->
<!-- pdac:cite id="SB-PERFORMANCE" digest="sha256:c004c86080428dd85d0c3b42ce24be640955fc52f3d9245f05db6e90e6344355" -->
<!-- pdac:cite id="BR-CHORDS" digest="sha256:543566a20181aa25eab6cc446d8ac467b1ca911632744dd957a0ab3388e9d55c" -->
<!-- pdac:cite id="BR-EDIT-GUARD" digest="sha256:20e678c4743404c64a51c01e4446026ac95811827d2f5e1c641839291ad32718" -->
<!-- pdac:cite id="FR-CONSULT" digest="sha256:8afd8d795cf7cd9ec628100291b0772c1588e74a2c4411da5b4dab59bd7c0078" -->
<!-- pdac:cite id="QR-READABILITY" digest="sha256:7139af1523273cf318b98b0f01da8688627c1a747f656b10017dcd3f0424c4af" -->
<!-- pdac:cite id="UC-CHORDS" digest="sha256:8824f28ac95b8a1f38fa68249fdf8e32441cfc3a4efa5b9e20ef10d81a392ae8" -->
<!-- pdac:cite id="UC-CONSULT" digest="sha256:d27ea53e1c307569b2fe941ea94eec4bb0e98e6478f2d947ec7123273f419562" -->

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

## Guard and navigation paths

The bounded paths include src/features/library/useLibrary.ts, src/features/library/domain.ts and direct application guard tests. All content commands, import, external-reference edits and attachment changes share the mode guard. PDF view-page memory is an explicit permitted consultation operation. Mode itself is transient. Test direct command rejection and UI control absence, rapid song switching and no musical-content mutation on mode transitions.

## Guarded chord editor integration from issue #8

This slice owns src/features/library/Sketch.tsx, src/features/library/domain.ts, src/features/library/useLibrary.ts, tests/library/domain.test.ts, tests/library/application.test.ts and tests/e2e/performance.spec.ts for SB-CHORD-ASSIGN, SB-CHORD-MODIFY and SB-CHORD-INVALID. Integrate the pure #8 chord model through the #5 serialized edit-mode guard and expose ordered section chord selection/replacement. Direct tests reject unsupported roots/qualities and all content writes in performance mode; browser tests select a new chord/quality and compare the chord label, selected state and actual highlighted MIDI keys immediately, then switch mode and prove no content mutation. Existing invariants and associations survive the edit.
