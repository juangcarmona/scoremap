<!-- pdac-scope: cited -->
<!-- pdac:cite id="QR-READABILITY" digest="sha256:fd18e2b171a6c15b68dc256acc88c7cf32f0376d723faf7a662a374ce49a9f5f" -->
<!-- pdac:cite id="FR-CONSULT" digest="sha256:8afd8d795cf7cd9ec628100291b0772c1588e74a2c4411da5b4dab59bd7c0078" -->
<!-- pdac:cite id="FR-CHORDS" digest="sha256:4da1a2f14b722446609a1fca78c027c682d149ecbef18a835eb561f6050f1ae4" -->
<!-- pdac:cite id="SB-PERFORMANCE" digest="sha256:c004c86080428dd85d0c3b42ce24be640955fc52f3d9245f05db6e90e6344355" -->
<!-- pdac:cite id="SB-KEYBOARD" digest="sha256:cda070d024497257667b098a1cdd8841ea33ef5c1483ae5094a2370e6ea751a7" -->
<!-- pdac:cite id="BR-EDIT-GUARD" digest="sha256:20e678c4743404c64a51c01e4446026ac95811827d2f5e1c641839291ad32718" -->

# Readable consultation without changing music

Use a stretching grid track around the existing sticky reference. The track ends at the song-sketch row, so the reference cannot overlap the following full-width arrangement row. Merely increasing z-index would preserve the overlap and obscure different content.

The shared PerformedPiano keeps its current 80px white-key geometry when editable, preserving touch and keyboard editing. Disabled consultation keyboards use their container width and the same proportional key positions, spelling, markers and complete note list. In consultation, octave anchors replace compressed labels inside every key; the complete performed-pitch list stays readable outside the key geometry. View changes remain local; out-of-range pitches stay explicitly listed. The display remains a reference, not a new musical command or automatic transposition.

Reproduce the observed overlap and hidden-key failures before changing code. Verify real hit-testing after scrolling, complete in-view performed-key bounds, two/three-octave views, tablet and narrow/enlarged text, edit target size, unchanged library content and axe checks. Existing editor/offline/private journeys remain required. Screenshots use only synthetic songs.

Current deployment instructions must distinguish anonymous IndexedDB and private PostgreSQL acknowledgements. Release preparation stays bound to committed source; origin, OIDC and operator secret files must be supplied privately before any actual Internet deployment.

The clean disposable Production run exposed a connected-test isolation defect: one anonymous/session-cookie check used fixed Development port 5280. Bind both the refused request and cookie query to the already safety-checked selected application origin, assert the response origin and actual HTTPS Secure cookie, and rerun all 44 cases without an unrelated Development service. Retain the failed run as evidence; it does not qualify the image. Application runtime inputs are unchanged by this verification correction.
