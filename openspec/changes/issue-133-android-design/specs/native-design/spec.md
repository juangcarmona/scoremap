<!-- pdac-scope: cited -->
<!-- pdac:cite id="FR-PIANO-SCORE" digest="sha256:c7090b853deaf69a52df30a9a1ae62d24b51a0cb620dcb38a272ec1e0856cde5" -->
<!-- pdac:cite id="FR-CHORDS" digest="sha256:4da1a2f14b722446609a1fca78c027c682d149ecbef18a835eb561f6050f1ae4" -->
<!-- pdac:cite id="FR-CONSULT" digest="sha256:8afd8d795cf7cd9ec628100291b0772c1588e74a2c4411da5b4dab59bd7c0078" -->
<!-- pdac:cite id="QR-READABILITY" digest="sha256:7139af1523273cf318b98b0f01da8688627c1a747f656b10017dcd3f0424c4af" -->


## ADDED Requirements

### Requirement: Native semantic design system
The Android application SHALL use the Lighthouse semantic palette and ScoreMap geometry and music-first hierarchy through a shared native theme.

#### Scenario: Appearance follows the operating system
- **WHEN** the operating system changes between light and dark appearance
- **THEN** the application retains ScoreMap semantic roles, readable states and musical octave colors

### Requirement: Adaptive music workspace
The application SHALL prioritize the selected musician task at compact and expanded widths while preserving edit protection and acknowledged storage outcomes.

#### Scenario: Open a song on tablet and phone
- **WHEN** a musician opens a stored song
- **THEN** tablet shows bounded library navigation and a song workspace, while compact width focuses on the workspace with native Back navigation

#### Scenario: Consult authored performed pitches
- **WHEN** the song sheet reveals performed notes
- **THEN** it shows exact authored pitches and ownership with octave colors, identifies notes outside the view, and introduces no edit commands
