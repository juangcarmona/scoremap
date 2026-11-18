<!-- pdac-scope: cited -->

# Tablet song sketch and protected performance mode

## Why

Realize the already supplied ScoreMap product intent for [issue #9](https://github.com/juangcarmona/scoremap/issues/9). The applied CHG-INITIAL is the only source of product semantics; this delivery change supplies implementation and verification.

## What Changes

Implement the accepted behaviours cited below in the bounded paths `src/app/App.tsx`, `tests/e2e/performance.spec.ts`. Dependencies: #7, #8.

## Capabilities

### New Capabilities

- delivery: Observable implementation of the cited slice.

### Modified Capabilities

None.

## Impact

<!-- pdac:cite id="SB-EDIT-RESUME" digest="sha256:04360461982853baddc7e4ddce8a0f0359b824ba917bb581edb2bb5dd00d585a" -->
<!-- pdac:cite id="SB-KEYBOARD" digest="sha256:cda070d024497257667b098a1cdd8841ea33ef5c1483ae5094a2370e6ea751a7" -->
<!-- pdac:cite id="SB-PERFORMANCE-REJECT" digest="sha256:392da1d92a3d7973d37b59e113edf537539262abe257dddd74b9a8eaf925b6d9" -->
<!-- pdac:cite id="SB-PERFORMANCE" digest="sha256:c004c86080428dd85d0c3b42ce24be640955fc52f3d9245f05db6e90e6344355" -->
<!-- pdac:cite id="BR-CHORDS" digest="sha256:543566a20181aa25eab6cc446d8ac467b1ca911632744dd957a0ab3388e9d55c" -->
<!-- pdac:cite id="BR-EDIT-GUARD" digest="sha256:20e678c4743404c64a51c01e4446026ac95811827d2f5e1c641839291ad32718" -->
<!-- pdac:cite id="FR-CONSULT" digest="sha256:8afd8d795cf7cd9ec628100291b0772c1588e74a2c4411da5b4dab59bd7c0078" -->
<!-- pdac:cite id="QR-READABILITY" digest="sha256:fd18e2b171a6c15b68dc256acc88c7cf32f0376d723faf7a662a374ce49a9f5f" -->
<!-- pdac:cite id="UC-CHORDS" digest="sha256:8824f28ac95b8a1f38fa68249fdf8e32441cfc3a4efa5b9e20ef10d81a392ae8" -->
<!-- pdac:cite id="UC-CONSULT" digest="sha256:d27ea53e1c307569b2fe941ea94eec4bb0e98e6478f2d947ec7123273f419562" -->

The complete model was examined for shared identity, mode and durability rules. MIDI, accounts and cloud features were excluded because they are outside CON-SCOPE. Read applicable lifecycle transitions and refusal behaviours before authoring tests.
