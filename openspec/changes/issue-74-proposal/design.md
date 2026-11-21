# Design

## Context

See `proposal.md` and the applied-but-not-yet-baseline `CHG-SONG-PERFORMANCE`. The repository already has structured songs/sections, arrangement parts and voicings, piano range controls and notation transfer. The separate `song-performance-sheet` change owns the octave palette and 88-key orientation; issue #76 is an in-flight integration and must not be duplicated.

## Goals / Non-Goals

**Goals:** Add the approved behavior by extending existing domain and guarded command paths, keeping consultation read-only and persistence/backup complete.

**Non-Goals:** Automatic transcription, guessed lyrics or timing, an unselected external score-import format, private-content publication, or treating deployment/device acceptance as implementation evidence.

## Decisions

- Keep exact played pitches and hand identity in the existing arrangement model; do not derive voicings from chords. Alternative: chord-based generation was rejected because it would invent register and performance.
- Represent lyric/chord alignment as structured song data linked to existing section/chord identities. Alternative: free-form display text was rejected because it cannot preserve alignment across edits and repeats.
- Render staff notation from explicitly supplied pitch, duration and rest data plus known key; represent unknown rhythm/key as unknown. Alternative: infer missing score data was rejected as misleading.
- Route edits through existing edit guard and acknowledged atomic storage/backup flows. Alternative: direct view-local mutation was rejected because it risks losing content and bypassing authorization.
- Reconcile palette/orientation against #76 rather than reimplementing that slice.

## Risks / Trade-offs

- [Product Change not integrated into accepted baseline] → Do not implement dependent behavior or mark the plan complete until the validated product route updates authority and citations.
- [Model migration could lose existing arrangements] → Require backwards-compatible round-trip tests and reject unsupported input without altering durable data.
- [Notation can imply unsupported certainty] → Render only explicit notes/timing and known key; test empty and incomplete phrases.
- [Visual acceptance is human-dependent] → Capture synthetic browser evidence and leave required owner/device acceptance pending.

## Migration Plan

After Product Change integration, implement additive schema migration with legacy read compatibility, run backup/reopen and refusal/failure tests, then obtain independent review and current-head checks. Roll back code without rewriting user libraries; never migrate or overwrite private content during validation.

## Open Questions

None that authorize guessing. The selected score-import format remains explicitly out of scope.
