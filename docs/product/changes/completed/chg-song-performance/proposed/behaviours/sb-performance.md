---
id: SB-PERFORMANCE
type: structured-behaviour
title: Enter protected performance consultation
status: active
illustrates:
  - UC-CONSULT
  - BR-EDIT-GUARD
given:
  - A song contains ordered sections, chords, repetition counts and personal
    notes
when: The musician enters performance mode
then:
  - The title and complete sketch are immediately readable
  - Editing actions are unavailable
  - Mode switching changes no musical content
---

## Intent

Enter protected performance consultation.

## Boundaries

Clauses describe observable product results. All preconditions and outcomes are conjunctive; alternatives are separate behaviours. Applicable rules supply guards and invariants. Executable evidence is external to the product model.

The focused song sheet also retains the known key, section structure and available lyrics, with chord-to-lyric alignment where explicitly supplied. Optional piano positions show actual performed notes only.
