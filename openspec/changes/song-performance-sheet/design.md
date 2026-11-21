<!-- pdac-scope: cited -->
<!-- pdac:cite id="FR-CHORDS" digest="sha256:8aaafe1e9c1362c203e895077404984869afb9f9221cddb3a56f8ded8dda62a4" -->
<!-- pdac:cite id="FR-CONSULT" digest="sha256:8e10d6c8a69132e9b0d73f90adbca6fffa8dbe5ba983d7adb805113a1b49ce5b" -->
<!-- pdac:cite id="QR-READABILITY" digest="sha256:a06eedc5a285ec4a2cb00991cada5423bb1bfac11bf2ad99f327b9007a1c2221" -->

## Context

The existing performed piano knows exact MIDI pitches. The separate theoretical pitch-class preview does not know performed octaves and cannot truthfully use the octave palette.

## Decisions

Assign semantic custom properties for each approved octave and key type at each rendered key using its MIDI-derived scientific octave. Apply them only to actual performed key surfaces, retaining existing state, labels, geometry, contrast and out-of-view behavior. Notes outside the documented 88-key octave mapping retain the existing performed-color fallback and are never clipped or transposed. This slice does not mutate musical content.

## Risks

Rendering depends on viewport and device. Synthetic browser checks and physical tablet review remain separate.
