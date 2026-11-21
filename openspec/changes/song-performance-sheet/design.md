<!-- pdac-scope: cited -->
<!-- pdac:cite id="FR-PIANO-SCORE" digest="sha256:c7090b853deaf69a52df30a9a1ae62d24b51a0cb620dcb38a272ec1e0856cde5" -->
<!-- pdac:cite id="FR-CHORDS" digest="sha256:4da1a2f14b722446609a1fca78c027c682d149ecbef18a835eb561f6050f1ae4" -->
<!-- pdac:cite id="FR-CONSULT" digest="sha256:8afd8d795cf7cd9ec628100291b0772c1588e74a2c4411da5b4dab59bd7c0078" -->
<!-- pdac:cite id="QR-READABILITY" digest="sha256:fd18e2b171a6c15b68dc256acc88c7cf32f0376d723faf7a662a374ce49a9f5f" -->

## Context

The existing performed piano knows exact MIDI pitches. The separate theoretical pitch-class preview does not know performed octaves and cannot truthfully use the octave palette.

## Decisions

Assign semantic custom properties for each approved octave and key type at each rendered key using its MIDI-derived scientific octave. Apply them only to actual performed key surfaces, retaining existing state, labels, geometry, contrast and out-of-view behavior. Notes outside the documented 88-key octave mapping retain the existing performed-color fallback and are never clipped or transposed. This slice does not mutate musical content.

## Risks

Rendering depends on viewport and device. Synthetic browser checks and physical tablet review remain separate.
