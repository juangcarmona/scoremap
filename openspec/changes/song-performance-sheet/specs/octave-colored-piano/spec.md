<!-- pdac-scope: cited -->
<!-- pdac:cite id="FR-CHORDS" digest="sha256:8aaafe1e9c1362c203e895077404984869afb9f9221cddb3a56f8ded8dda62a4" -->
<!-- pdac:cite id="FR-CONSULT" digest="sha256:8e10d6c8a69132e9b0d73f90adbca6fffa8dbe5ba983d7adb805113a1b49ce5b" -->
<!-- pdac:cite id="QR-READABILITY" digest="sha256:a06eedc5a285ec4a2cb00991cada5423bb1bfac11bf2ad99f327b9007a1c2221" -->

## ADDED Requirements

### Requirement: Octave colors identify actual piano pitches

The piano SHALL color the full surface of each selected performed key with the documented white- or black-key shade for its scientific-pitch octave and SHALL preserve accessible pitch labels and theoretical-versus-performed distinction.

#### Scenario: Selected white and black keys in different octaves

- **GIVEN** performed C3 and F-sharp4 and an unperformed theoretical reference
- **WHEN** the musician views the relevant piano range
- **THEN** C3 and F-sharp4 use their respective documented octave shades across the full key
- **AND** unperformed references are not presented as performed notes
- **AND** labels retain their exact pitch and octave independently of color

#### Scenario: Performed note outside documented 88-key palette

- **GIVEN** a permitted exact performed pitch outside the documented octave palette
- **WHEN** the musician views that pitch
- **THEN** the piano retains a distinct performed indication and does not clip, transpose or discard the note
