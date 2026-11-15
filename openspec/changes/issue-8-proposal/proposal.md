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
<!-- pdac:cite id="SB-CHORD-INVALID" digest="sha256:cece725b540bd03418e078c052573403e8d91a0dec719a841cb8812b0128c51f" -->
<!-- pdac:cite id="SB-CHORD-MODIFY" digest="sha256:22362c97fc63f3f2c09e70daf1b916611f624e2a27d7304ad1df7e35ee729d91" -->
<!-- pdac:cite id="SB-KEYBOARD" digest="sha256:da02de8f23d9eb7f43c0fb46ab22fd8ab4fab67d61dc38a453a6ba6894e0c8b8" -->
<!-- pdac:cite id="BR-CHORDS" digest="sha256:712786f72ab221442071a50abe47e66a472f1337c6820aec402c8df488b304a6" -->
<!-- pdac:cite id="BR-EDIT-GUARD" digest="sha256:20e678c4743404c64a51c01e4446026ac95811827d2f5e1c641839291ad32718" -->
<!-- pdac:cite id="FR-CHORDS" digest="sha256:2150e3670c5d3f955db8fd6b2300813b2d43b4c5cb7fc0f231a5385299da6c52" -->
<!-- pdac:cite id="UC-CHORDS" digest="sha256:56630e0d4211d454251c4699a5c2aca3f2465c0b08e2af13c6f628be650cbf19" -->

The complete model was examined for shared identity, mode and durability rules. MIDI, accounts and cloud features were excluded because they are outside CON-SCOPE. Read applicable lifecycle transitions and refusal behaviours before authoring tests.
