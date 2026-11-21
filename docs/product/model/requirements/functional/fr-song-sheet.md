---
id: FR-SONG-SHEET
type: functional-requirement
title: Prepare and consult a focused song sheet
status: draft
derived-from:
  - UC-CONSULT
  - UC-SECTIONS
  - BR-STRUCTURE
  - BR-EDIT-GUARD
  - BR-ACCESS
  - BR-DURABILITY
verification:
  - scenario: With a known key, chord loop and changing lyrics, save and reopen the song; the focused sheet retains supplied chord-to-lyric associations and repeat information.
  - scenario: With performance mode active, request a lyric edit; refuse without changing acknowledged music.
uses-terms: []
---

## Requirement

The product MUST offer a focused vertically scrollable song sheet with title, known key, ordered sections, chords, declared repeats and optional lyrics and notes; persistent application chrome MUST NOT dominate the tablet performance view. Chord changes MUST align with their associated lyric positions where supplied. Repeated harmonic loops and varying lyrics MUST be representable without inventing musical structure. The musician MUST be able to reveal exact performed piano positions for a chord and identify both hands, actual pitches and octaves without conflating them with theoretical harmony. Wide keyboards MUST preserve note identity outside the viewport, and use the approved octave palette on complete selected white and black key surfaces.

The musician MUST be able to prepare and edit a known song key, lyrics, explicit chord-to-lyric associations, section cues, and repeated-loop structure in edit mode. Lyrics and associations remain optional; missing data MUST remain visibly unknown or absent. Save and transfer MUST retain these values and their stable song, section and event associations subject to existing guards, revision and durable acknowledgement.

## Rationale

This capability realizes the approved musician journey while retaining existing access, integrity, readability and durability boundaries.
