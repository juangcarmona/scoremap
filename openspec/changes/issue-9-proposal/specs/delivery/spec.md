<!-- pdac-scope: cited -->

## Product dependencies

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

## ADDED Requirements

### Requirement: Realize the accepted delivery behaviour

The implementation SHALL satisfy the cited product behaviours and governing invariants for this slice. This is a consumer projection of CHG-INITIAL; the ProductShape artifacts remain canonical.

#### Scenario: SB-EDIT-RESUME

- **WHEN** The musician deliberately switches to edit mode
- **THEN** Editing controls become available; The musical content is unchanged

#### Scenario: SB-KEYBOARD

- **WHEN** The musician consults the visual keyboard
- **THEN** White keys follow C D E F G A B in each octave; Black keys occupy only C-sharp D-sharp F-sharp G-sharp A-sharp positions; Highlighted keys match the chord pitch classes in the displayed octaves; The chord label retains its root spelling

#### Scenario: SB-PERFORMANCE-REJECT

- **WHEN** The musician attempts a content mutation
- **THEN** The mutation is refused at the application boundary; Song, repertoire and attachment content remain unchanged

#### Scenario: SB-PERFORMANCE

- **WHEN** The musician enters performance mode
- **THEN** The title and complete sketch are immediately readable; Editing actions are unavailable; Mode switching changes no musical content
