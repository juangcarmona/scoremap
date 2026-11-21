# Proposal

## Why

Musicians need one focused song view and a reliable path from lyric-aligned chords to exact, playable notes and an honest score reference. The owner-approved direction is recorded in CHG-SONG-PERFORMANCE, but its applied product change must enter the accepted baseline through the validated route before implementation can claim that authority.

## What Changes

- Extend song content and consultation with section-aware lyrics, chord alignment, optional notes and cues, and a focused performance sheet.
- Complete exact two-hand editing, full-range navigation, compact staff notation and phrase comparison without inferring notes or rhythm.
- Preserve existing edit guards, identity, private data, atomic acknowledged persistence, recovery and portable transfer.
- Reuse the octave-color and 88-key orientation slice already present; reconcile it with #76 rather than duplicating it.

## Capabilities

### New Capabilities

- `song-sheet`: focused consultation of song sections, repeats, lyrics, chords and optional cues.
- `score-to-piano`: exact two-hand note editing and synchronized, truthful score/piano phrase views.

### Modified Capabilities

- None. Existing behavior deltas require the Product Change to be applied to the accepted baseline first.

## Impact

Affected application areas include song/section data, arrangement editing, notation, consultation, persistence and backup. The current `song-performance-sheet` change already owns octave colors and instrument orientation; preserve it. Private-service authorization, conflict/refusal, durability and transfer require the established storage boundaries and their relevant tests. No import format, transcription, lyrics or musical content may be invented.
