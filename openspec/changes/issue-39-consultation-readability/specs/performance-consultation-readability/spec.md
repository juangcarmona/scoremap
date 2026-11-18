<!-- pdac-scope: cited -->
<!-- pdac:cite id="QR-READABILITY" digest="sha256:fd18e2b171a6c15b68dc256acc88c7cf32f0376d723faf7a662a374ce49a9f5f" -->
<!-- pdac:cite id="FR-CONSULT" digest="sha256:8afd8d795cf7cd9ec628100291b0772c1588e74a2c4411da5b4dab59bd7c0078" -->
<!-- pdac:cite id="FR-CHORDS" digest="sha256:4da1a2f14b722446609a1fca78c027c682d149ecbef18a835eb561f6050f1ae4" -->
<!-- pdac:cite id="SB-PERFORMANCE" digest="sha256:c004c86080428dd85d0c3b42ce24be640955fc52f3d9245f05db6e90e6344355" -->
<!-- pdac:cite id="SB-KEYBOARD" digest="sha256:cda070d024497257667b098a1cdd8841ea33ef5c1483ae5094a2370e6ea751a7" -->
<!-- pdac:cite id="BR-EDIT-GUARD" digest="sha256:20e678c4743404c64a51c01e4446026ac95811827d2f5e1c641839291ad32718" -->

## ADDED Requirements

### Requirement: Unobstructed synchronized consultation
The performance view MUST show compact theoretical diagrams for the chords in the song without selecting each one, and preserve exact musical data when selecting a chord. Arrangement controls MUST remain hit-testable. Performed keyboards MUST have realistic proportions, distinguish theoretical notes from exact played pitches, label every visible played pitch and use bounded scrolling where necessary. Editable pianos MUST retain touch-sized keys.

#### Scenario: Several chords are readable together
- **GIVEN** a song contains C major and D-flat minor in the same sketch
- **WHEN** the musician enters performance mode without selecting either chord
- **THEN** both independent diagrams and their correctly spelled chord tones are visible, with no content revision.

#### Scenario: Three keyboards on a landscape tablet
- **GIVEN** an existing song with three assigned keyboards and saved performed notes
- **WHEN** the musician enters performance mode and scrolls to its arrangement
- **THEN** no reference covers an active selector, each visible performed key is labeled, the keyboards retain their own parts and ranges, and the acknowledged song is unchanged.

#### Scenario: Narrow enlarged-text and editing boundary
- **GIVEN** the same saved song on a narrow viewport with 200 percent text
- **WHEN** the musician changes independent two/three-octave views and returns to edit mode
- **THEN** labels and controls remain accessible without horizontal page overflow, musical data is unchanged and editable key targets retain at least 48 CSS pixels.
