<!-- pdac-scope: cited -->
<!-- pdac:cite id="FR-PIANO-SCORE" digest="sha256:c7090b853deaf69a52df30a9a1ae62d24b51a0cb620dcb38a272ec1e0856cde5" -->
<!-- pdac:cite id="FR-CHORDS" digest="sha256:4da1a2f14b722446609a1fca78c027c682d149ecbef18a835eb561f6050f1ae4" -->
<!-- pdac:cite id="FR-CONSULT" digest="sha256:8afd8d795cf7cd9ec628100291b0772c1588e74a2c4411da5b4dab59bd7c0078" -->
<!-- pdac:cite id="QR-READABILITY" digest="sha256:fd18e2b171a6c15b68dc256acc88c7cf32f0376d723faf7a662a374ce49a9f5f" -->

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
