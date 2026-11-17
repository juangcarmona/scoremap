---
id: SB-NOTATION
type: structured-behaviour
title: Change dual notation primary without changing music
status: draft
illustrates:
  - UC-CHORDS
  - UC-CONSULT
  - BR-CHORDS
given:
  - Musician A has current read access to an existing song with a D-flat major harmonic event spelled D-flat F A-flat
  - An arrangement performs D-flat3 F3 A-flat3 at identified positions and durations with unchanged part bindings
  - A's current notation preference is Anglo-American and a separately acknowledged principal B preference exists
  - The editor, theoretical preview, saved voicing choice and consultation renderings refer to that same musical content
  - A may update A's own preference and that separate preference commit succeeds
when: A selects dual notation with fixed-name Latin primary
then:
  - Every musical rendering uses fixed-name Latin primary and Anglo-American secondary consistently
  - The event shows Re-flat Fa La-flat as primary note names with D-flat F A-flat as their secondary names
  - Exact performed labels retain octave 3 and the stored accidentals in both representations
  - Chord symbols, note lists, selectors, keyboard labels, saved voicing choices and accessible names use the selected representation consistently
  - Song, event, arrangement and part identities, spelling, pitch values, time, order and bindings remain unchanged
  - No musical content revision is created by the preference change
  - A's preference is acknowledged independently and applies when A reopens the song
  - B's preference and the anonymous library remain unchanged
uses-terms:
  - TERM-CHORD
  - TERM-VOICING
  - TERM-ARRANGEMENT
  - TERM-PRINCIPAL
---

## Intent

Make B01 concrete: changing the primary representation changes labels and the musician's preference, not the musical arrangement. Enharmonic spelling and performed octaves remain visible.

## Boundaries

This is one successful switch to Latin-primary dual notation with a separate successful preference acknowledgement. Latin-only, Anglo-American-only, reversed dual primary and invalid preference commands are distinct acceptance examples in FR-CHORDS. This command neither edits the song nor changes library presence, section presence or song retention, so no covers-transition link is asserted. A preference acknowledgement does not attest a musical save, and access to this song does not authorize changes to another principal's preference. Runtime execution and accessibility inspection remain separate evidence.
