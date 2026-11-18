<!-- pdac-scope: cited -->

# Musical chord model and accurate keyboard

## Why

Realize the already supplied ScoreMap product intent for [issue #8](https://github.com/juangcarmona/scoremap/issues/8). The applied CHG-INITIAL is the only source of product semantics; this delivery change supplies implementation and verification.

## What Changes

Implement the accepted behaviours cited below in the bounded paths `src/features/sketch/chords.ts`, `src/features/sketch/Piano.tsx`, `tests/sketch/chords.test.ts`. Dependencies: #4.

## Capabilities

### New Capabilities

- delivery: Observable implementation of the cited slice.

### Modified Capabilities

None.

## Impact

<!-- pdac:cite id="SB-CHORD-ASSIGN" digest="sha256:adbbe7a3f7aef1a2a289f8ee00870b0ce7ad8893343d70b3ca0f1d16c524423b" -->
<!-- pdac:cite id="SB-CHORD-INVALID" digest="sha256:fa5826a9a93f7a9bc10e9ad1e72754e764bb2df8f23ed7ac3cbf164fa793c6cf" -->
<!-- pdac:cite id="SB-CHORD-MODIFY" digest="sha256:22362c97fc63f3f2c09e70daf1b916611f624e2a27d7304ad1df7e35ee729d91" -->
<!-- pdac:cite id="SB-KEYBOARD" digest="sha256:cda070d024497257667b098a1cdd8841ea33ef5c1483ae5094a2370e6ea751a7" -->
<!-- pdac:cite id="BR-CHORDS" digest="sha256:543566a20181aa25eab6cc446d8ac467b1ca911632744dd957a0ab3388e9d55c" -->
<!-- pdac:cite id="BR-EDIT-GUARD" digest="sha256:20e678c4743404c64a51c01e4446026ac95811827d2f5e1c641839291ad32718" -->
<!-- pdac:cite id="FR-CHORDS" digest="sha256:4da1a2f14b722446609a1fca78c027c682d149ecbef18a835eb561f6050f1ae4" -->
<!-- pdac:cite id="UC-CHORDS" digest="sha256:8824f28ac95b8a1f38fa68249fdf8e32441cfc3a4efa5b9e20ef10d81a392ae8" -->

The complete model was examined for shared identity, mode and durability rules. MIDI, accounts and cloud features were excluded because they are outside CON-SCOPE. Read applicable lifecycle transitions and refusal behaviours before authoring tests.
