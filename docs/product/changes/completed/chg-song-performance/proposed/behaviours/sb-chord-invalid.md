---
id: SB-CHORD-INVALID
type: structured-behaviour
title: Refuse contradictory alterations without changing the event
status: draft
illustrates:
  - UC-CHORDS
  - BR-CHORDS
  - BR-EDIT-GUARD
  - BR-STRUCTURE
  - BR-ACCESS
  - BR-DURABILITY
given:
  - Musician A has current write capability for song S and edit mode is active
  - Identified harmonic event H has valid C dominant-seventh identity at a valid measure position and duration
  - Independent performed parts and device bindings reference H and the acknowledged song revision is 8
  - A submits a proposed identity that simultaneously selects flat-ninth and sharp-ninth alterations for H
  - Every other admission condition including expected revision 8 is satisfied
when: A requests that proposed harmonic identity be committed
then:
  - The command is refused with a validation reason identifying contradictory alterations of the ninth degree
  - Neither alteration is silently selected and the proposal is not coerced into another chord
  - H retains its identity, C dominant-seventh meaning, spelling, position and duration
  - Every performed pitch, part binding, other arrangement and song-owned field remains unchanged
  - Acknowledged revision 8 and its recoverable history remain unchanged and no success is reported
  - No product lifecycle transition occurs
uses-terms:
  - TERM-SONG
  - TERM-CHORD
  - TERM-EVENT
  - TERM-ARRANGEMENT
  - TERM-VOICING
---

## Intent

Make B02 and musical B10 refusal concrete without treating newly accepted qualities as invalid merely because they exceed the old triad catalogue. One degree cannot have two selected alterations.

## Boundaries

This single command proposes a contradictory alteration pair; it does not combine unknown-root, unknown-quality and authorization failures into one example. Unsupported qualities remain separately refused under FR-CHORDS and BR-CHORDS. Compatible alterations on different degrees remain valid. The refusal is not a content, structure-presence or save-state transition. Definition authoring does not prove executed domain or builder validation.

The focused song-sheet and full-range piano direction preserves this existing scenario and its edit, identity, permission and durability boundaries.
