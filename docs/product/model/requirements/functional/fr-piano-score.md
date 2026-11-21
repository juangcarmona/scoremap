---
id: FR-PIANO-SCORE
type: functional-requirement
title: Prepare exact two-hand pitches on an 88-key piano with compact score
status: draft
derived-from:
  - UC-CHORDS
  - UC-CONSULT
  - BR-CHORDS
  - BR-STRUCTURE
  - BR-EDIT-GUARD
  - BR-ACCESS
  - BR-DURABILITY
verification:
  - scenario: With notes in both hands on different octaves, edit and save the chord; reopening retains pitches and hand associations.
  - scenario: With selected notes outside the current keyboard view, change the range; retain and identify those notes.
  - scenario: With selected black and white keys, show complete key surfaces and matching staff notes using the approved octave palette and non-color labels.
uses-terms: []
---

## Requirement

The editor MUST provide an 88-key A0–C8 orientation and an enlarged, navigable keyboard with operable touch targets for selecting exact pitches across that range. Left and right hand selections MUST remain independently identifiable and reviewable together, including notes outside the current enlarged range. An explicit save MUST obey the declared atomic commit boundary and all existing admission, conflict, authorization and durability rules; cancel MUST preserve acknowledged music.

A compact staff MUST show the selected pitches with correct clefs, known key signature, accidentals and ledger lines or explicit octave indications. Staff note colors and complete selected white and black piano keys MUST use the documented octave mapping, with text or other non-color cues for pitch and hand. The staff MUST NOT fabricate a key signature, pitch, duration or performed note. The representation of a single chord MUST use compact horizontal space.

## Rationale

This capability realizes the approved musician journey while retaining existing access, integrity, readability and durability boundaries.
