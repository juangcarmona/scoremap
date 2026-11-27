<!-- pdac-scope: cited -->
<!-- pdac:cite id="FR-PIANO-SCORE" digest="sha256:c7090b853deaf69a52df30a9a1ae62d24b51a0cb620dcb38a272ec1e0856cde5" -->
<!-- pdac:cite id="FR-CHORDS" digest="sha256:4da1a2f14b722446609a1fca78c027c682d149ecbef18a835eb561f6050f1ae4" -->
<!-- pdac:cite id="FR-CONSULT" digest="sha256:8afd8d795cf7cd9ec628100291b0772c1588e74a2c4411da5b4dab59bd7c0078" -->
<!-- pdac:cite id="QR-READABILITY" digest="sha256:7139af1523273cf318b98b0f01da8688627c1a747f656b10017dcd3f0424c4af" -->


## Context

The current application calls MaterialTheme without a ScoreMap palette. The web-oriented Lighthouse contract and native planning examples exist, but are not projected into Compose.

## Decisions

Use one native theme adapter in the existing feature library consumed by the composition root. Use semantic Material roles with explicit Lighthouse values. System appearance chooses a static light/dark scheme, preserving product identity across wallpapers. General controls use 6dp corners; music keys retain their actual geometry. On expanded widths the library occupies a bounded rail next to the song workspace; compact widths focus on the selected song. The song sheet occupies the content width and shows only authored notes. Native Back dismisses the active surface, and system/IME insets preserve reachability.

## Verification

Build and test the real APK. Run existing native and repository checks, inspect native captures on phone and landscape tablet, light/dark and 200% text. Preserve source/artifact provenance and honest remaining accessibility/physical device qualification in evidence.
