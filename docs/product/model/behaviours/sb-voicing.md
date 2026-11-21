---
id: SB-VOICING
type: structured-behaviour
title: Move one performed pitch without reharmonizing the event
status: draft
illustrates:
  - UC-CHORDS
  - BR-CHORDS
  - BR-STRUCTURE
  - BR-EDIT-GUARD
  - BR-ACCESS
  - BR-DURABILITY
given:
  - Owner A has current write capability for private song S and edit mode is active
  - An existing identified harmonic event H has C major-seventh identity and theoretical notes C E G B
  - Arrangement R has a left part performing C2 G2 and a right part performing E4 B4 at valid identified positions and durations referring to H
  - The selected performed B4 event N belongs to the right part and its physical assignment permits B5
  - Another arrangement Q refers to the same shared song form with its own independent performed notes
  - Expected revision is current and the complete authorized commit succeeds
when: A raises performed event N by one octave in the integrated builder
then:
  - N performs B5 with consistent spelling, octave and absolute pitch while retaining its identity, position, duration and part binding
  - R's left part remains C2 G2 and its other right-part note remains E4
  - H retains C major-seventh identity and theoretical C E G B pitch classes
  - The exact played-note preview updates to B5 without highlighting every B octave as performed
  - Outside-view B5 remains identifiable without changing the view into a content transposition
  - Q's performed notes, both arrangements' unrelated bindings and the shared song form remain unchanged
  - Exactly the complete new song revision is acknowledged after commit and the preceding revision remains recoverable
  - Separately owned presets and preferences remain unchanged
uses-terms:
  - TERM-SONG
  - TERM-EVENT
  - TERM-CHORD
  - TERM-VOICING
  - TERM-ARRANGEMENT
---

## Intent

Make B03's register separation concrete using the requested C2/G2/E4/B4 voicing. One performed octave edit must not silently change harmony, event timing, other parts or another arrangement.

## Boundaries

This is a successful single-note octave edit on existing content, not an inversion, preset application, detection selection, cancel or undo command. Those have separate FR-CHORDS examples and obligations. No section insertion/modification/removal or library-presence transition is claimed: section identity, label and repeat count are untouched, as are song retention and form. A failed commit, incompatible tone, stale revision or out-of-range edit must refuse under the governing rules and cannot reuse this success example as evidence. Authoring does not prove real piano interaction, durable reconstruction or server execution.
