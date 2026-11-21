<!-- pdac-scope: cited -->
<!-- pdac:cite id="FR-PIANO-SCORE" digest="sha256:c7090b853deaf69a52df30a9a1ae62d24b51a0cb620dcb38a272ec1e0856cde5" -->
<!-- pdac:cite id="FR-CHORDS" digest="sha256:4da1a2f14b722446609a1fca78c027c682d149ecbef18a835eb561f6050f1ae4" -->
<!-- pdac:cite id="FR-CONSULT" digest="sha256:8afd8d795cf7cd9ec628100291b0772c1588e74a2c4411da5b4dab59bd7c0078" -->
<!-- pdac:cite id="QR-READABILITY" digest="sha256:7139af1523273cf318b98b0f01da8688627c1a747f656b10017dcd3f0424c4af" -->

## Why

The approved CHG-SONG-PERFORMANCE requires a focused song sheet, accurate two-hand piano preparation and score references. Deliver the exact-pitch octave palette as an independently testable first slice while the remaining sheet and editor capabilities are designed and implemented.

## What Changes

- Color complete selected performed keys according to their scientific-pitch octave and the owner-approved palette, distinguishing white and black key shades.
- Preserve accessible pitch labels, theoretical-versus-performed meaning and existing viewport and editing behavior.

## Capabilities

### New Capabilities

- `octave-colored-piano`: octave-colored actual performed pitches across the existing piano views.

### Modified Capabilities

None.

## Impact

Existing performed-piano rendering and style roles; focused rendering and browser tests. No song mutations, storage migration, lyrics, staff or full-range editor in this first slice. These remain outstanding requirements of CHG-SONG-PERFORMANCE.

The piano-first editor slice also supplies a full 88-key visual orientation tied to the existing accessible enlarged-range controls. Both-hand combined editing and compact staff remain outstanding.
