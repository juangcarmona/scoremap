---
id: SB-NAVIGATION
type: structured-behaviour
title: Select one musical context across independently ranged keyboards
status: draft
illustrates:
  - UC-CONSULT
  - BR-STRUCTURE
  - BR-CHORDS
  - BR-EDIT-GUARD
  - BR-ACCESS
  - BR-SESSION
given:
  - Musician A has current read permission for active private song S and performance mode is active
  - Arrangement R references S's shared section V with two repeat occurrences and identified measures M1 and M2
  - All three keyboard views currently show M1 in the second occurrence of V and the third view has played highlights from its assigned part
  - Harmonic event H2 in M2 has C major-seventh identity
  - At H2 the first part performs C2 G2 and the second part performs E4 B4 while the third part is silent
  - The first keyboard has physical range C1 through B3 and visible range C2 through B3
  - The second keyboard has physical range C3 through B6 and visible range C4 through B5
  - The third keyboard has physical range C2 through B5 and visible range C3 through B4
  - Each part has its own name and musical role and its binding resolves to the corresponding keyboard
when: A selects H2 in M2 of the second occurrence of V
then:
  - Every relevant view shows S and R with the same V second-occurrence M2 H2 context
  - The first view marks only C2 G2 as its assigned performed pitches and the second marks only E4 B4
  - The third view clears all previous played highlights and identifies its assigned part as silent at H2
  - Each keyboard retains its own physical and visible range with exact pitch-and-octave labels and its assigned part name and musical role
  - Theoretical C E G B references remain distinguishable from exact performed pitches
  - The selection does not clone repeated content or change any section, measure, event, part, binding, pitch, timing or musical order
  - No content revision is created and the acknowledged song remains unchanged
uses-terms:
  - TERM-SONG
  - TERM-SECTION
  - TERM-EVENT
  - TERM-ARRANGEMENT
  - TERM-VOICING
  - TERM-MODE
---

## Intent

Make B05 concrete: one event selection moves all relevant keyboards to the same measure and repeat occurrence, while their independent assignments determine their played pitches and silence clears stale highlights.

## Boundaries

This is one read-only selection of an existing event, not a chain of section edits or a save. It changes no library-presence, section-presence or retention state and therefore asserts no lifecycle transition. Out-of-view pitches, removed selections and narrow-view accessibility have distinct FR-CONSULT acceptance examples. The example requires current private read authority; performance mode does not supply it. It neither starts an offline lease nor promises disconnected detection of revocation. Browser assertions on actual context and key pitches remain later execution evidence.

The focused song-sheet and full-range piano direction preserves this existing scenario and its edit, identity, permission and durability boundaries.
