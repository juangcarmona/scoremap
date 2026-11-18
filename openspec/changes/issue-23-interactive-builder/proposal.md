<!-- pdac-scope: cited -->
<!-- pdac:cite id="FR-CHORDS" digest="sha256:4da1a2f14b722446609a1fca78c027c682d149ecbef18a835eb561f6050f1ae4" -->
<!-- pdac:cite id="BR-CHORDS" digest="sha256:543566a20181aa25eab6cc446d8ac467b1ca911632744dd957a0ab3388e9d55c" -->

## Why
The accepted rich musical model now has durable imports and exact performed occurrences. Musicians need to prepare those occurrences directly inside a song rather than authoring JSON.

## What Changes
Add an integrated exact-pitch piano builder with immediate theory and performed previews, explicit apply/cancel/undo, ambiguity-aware identification, register/inversion operations and copied independently owned versioned voicing presets. Preserve the song event, arrangement and part context.

## Capabilities
### New Capabilities
- `interactive-voicing`: Exact performed-note editing and versioned preset reuse within real songs.

## Impact
Feature-owned React/domain/persistence boundaries, the existing musical geometry/notation adapter, principal-scoped preset API and synthetic domain/browser/real-service tests. No audio/MIDI/hardware or production deployment.
