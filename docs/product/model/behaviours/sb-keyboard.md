---
id: SB-KEYBOARD
type: structured-behaviour
title: Distinguish theoretical reference from exact performed keys
status: draft
illustrates:
  - UC-CHORDS
  - BR-CHORDS
  - BR-EDIT-GUARD
  - BR-ACCESS
given:
  - Musician A has current read permission for the selected song and its arrangement
  - An identified harmonic event has D-flat major identity with theoretical notes D-flat F A-flat
  - The selected assigned part performs exactly D-flat3 F3 A-flat4 for that event
  - The visual keyboard shows the two-octave range C3 through B4 and Anglo-American notation is selected
when: A opens the selected event's visual keyboard reference
then:
  - White keys follow C D E F G A B in each octave with consistent octave placement
  - Black keys occupy only the chromatic positions between C and D, D and E, F and G, G and A, and A and B
  - There is no black key between E and F and none between B and C
  - The theoretical reference identifies the D-flat F A-flat pitch classes throughout the visible octaves without representing every reference key as played
  - Only D-flat3 F3 A-flat4 are marked as this part's performed pitches
  - D-flat4 F4 A-flat3 are not marked as performed by that part
  - The chord label and note labels retain D-flat and A-flat spelling rather than replacing them with C-sharp and G-sharp
  - Each selected performed key has its own readable pitch-and-octave label and accessible name and state
  - Theoretical and performed indications remain distinguishable without relying on color alone
  - Opening the reference changes no musical identity, pitch, octave, timing, binding or acknowledged revision
uses-terms:
  - TERM-CHORD
  - TERM-VOICING
  - TERM-EVENT
  - TERM-ARRANGEMENT
---

## Intent

Preserve the accepted chromatic geometry and spelled triad reference while making the distinction between theoretical pitch classes and exact played octaves observable. The original major/minor meaning remains a valid subset of the bounded catalogue.

## Boundaries

This is one read of an existing two-octave reference. It does not place notes, transpose content, qualify all notation modes or demonstrate three-octave range controls. Those remain FR-CHORDS obligations. Black-key position and harmonic spelling are separate: a physical chromatic key does not force a sharp spelling. No content or presence/retention transition is asserted. Actual rendering, accessible interaction and enlarged-text evidence remain later verification.

The full-range orientation and octave palette extend, rather than replace, the exact-pitch and theoretical-reference distinction in this scenario. White and black selected key surfaces follow the documented octave mapping, with accessible pitch and hand labels.
