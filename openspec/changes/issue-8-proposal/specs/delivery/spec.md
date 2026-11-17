<!-- pdac-scope: cited -->

## Product dependencies

<!-- pdac:cite id="SB-CHORD-ASSIGN" digest="sha256:adbbe7a3f7aef1a2a289f8ee00870b0ce7ad8893343d70b3ca0f1d16c524423b" -->
<!-- pdac:cite id="SB-CHORD-INVALID" digest="sha256:fa5826a9a93f7a9bc10e9ad1e72754e764bb2df8f23ed7ac3cbf164fa793c6cf" -->
<!-- pdac:cite id="SB-CHORD-MODIFY" digest="sha256:22362c97fc63f3f2c09e70daf1b916611f624e2a27d7304ad1df7e35ee729d91" -->
<!-- pdac:cite id="SB-KEYBOARD" digest="sha256:cda070d024497257667b098a1cdd8841ea33ef5c1483ae5094a2370e6ea751a7" -->
<!-- pdac:cite id="BR-CHORDS" digest="sha256:543566a20181aa25eab6cc446d8ac467b1ca911632744dd957a0ab3388e9d55c" -->
<!-- pdac:cite id="BR-EDIT-GUARD" digest="sha256:20e678c4743404c64a51c01e4446026ac95811827d2f5e1c641839291ad32718" -->
<!-- pdac:cite id="FR-CHORDS" digest="sha256:4da1a2f14b722446609a1fca78c027c682d149ecbef18a835eb561f6050f1ae4" -->
<!-- pdac:cite id="UC-CHORDS" digest="sha256:8824f28ac95b8a1f38fa68249fdf8e32441cfc3a4efa5b9e20ef10d81a392ae8" -->

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
