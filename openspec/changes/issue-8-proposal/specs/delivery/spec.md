<!-- pdac-scope: cited -->

## Product dependencies

<!-- pdac:cite id="SB-CHORD-ASSIGN" digest="sha256:adbbe7a3f7aef1a2a289f8ee00870b0ce7ad8893343d70b3ca0f1d16c524423b" -->
<!-- pdac:cite id="SB-CHORD-INVALID" digest="sha256:cece725b540bd03418e078c052573403e8d91a0dec719a841cb8812b0128c51f" -->
<!-- pdac:cite id="SB-CHORD-MODIFY" digest="sha256:22362c97fc63f3f2c09e70daf1b916611f624e2a27d7304ad1df7e35ee729d91" -->
<!-- pdac:cite id="SB-KEYBOARD" digest="sha256:da02de8f23d9eb7f43c0fb46ab22fd8ab4fab67d61dc38a453a6ba6894e0c8b8" -->
<!-- pdac:cite id="BR-CHORDS" digest="sha256:712786f72ab221442071a50abe47e66a472f1337c6820aec402c8df488b304a6" -->
<!-- pdac:cite id="BR-EDIT-GUARD" digest="sha256:20e678c4743404c64a51c01e4446026ac95811827d2f5e1c641839291ad32718" -->
<!-- pdac:cite id="FR-CHORDS" digest="sha256:2150e3670c5d3f955db8fd6b2300813b2d43b4c5cb7fc0f231a5385299da6c52" -->
<!-- pdac:cite id="UC-CHORDS" digest="sha256:56630e0d4211d454251c4699a5c2aca3f2465c0b08e2af13c6f628be650cbf19" -->

## ADDED Requirements

### Requirement: Realize the accepted delivery behaviour

The implementation SHALL satisfy the cited product behaviours and governing invariants for this slice. This is a consumer projection of CHG-INITIAL; the ProductShape artifacts remain canonical.

#### Scenario: SB-CHORD-ASSIGN

- **WHEN** The musician assigns a synthetic sequence of C major, D-flat minor and F-sharp major
- **THEN** The section retains the specified order and root spellings; Each triad has the correct major or minor pitch classes

#### Scenario: SB-CHORD-INVALID

- **WHEN** The musician submits an unsupported root or initial quality
- **THEN** A validation error is returned; No chord data changes

#### Scenario: SB-CHORD-MODIFY

- **WHEN** The musician changes a selected chord from major to minor
- **THEN** Only the selected chord changes; Its third is three semitones above the root; The displayed keyboard updates immediately

#### Scenario: SB-KEYBOARD

- **WHEN** The musician consults the visual keyboard
- **THEN** White keys follow C D E F G A B in each octave; Black keys occupy only C-sharp D-sharp F-sharp G-sharp A-sharp positions; Highlighted keys match the chord pitch classes in the displayed octaves; The chord label retains its root spelling
