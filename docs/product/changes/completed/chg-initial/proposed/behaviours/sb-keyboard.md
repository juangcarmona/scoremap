---
id: SB-KEYBOARD
type: structured-behaviour
title: Accurate chromatic piano visualization
status: active
illustrates:
  - UC-CHORDS
  - BR-CHORDS
  - BR-EDIT-GUARD
given:
  - A major or minor chord is selected
when: The musician consults the visual keyboard
then:
  - White keys follow C D E F G A B in each octave
  - Black keys occupy only C-sharp D-sharp F-sharp G-sharp A-sharp positions
  - Highlighted keys match the chord pitch classes in the displayed octaves
  - The chord label retains its root spelling
---

## Intent

Accurate chromatic piano visualization.

## Boundaries

Clauses describe observable product results. All preconditions and outcomes are conjunctive; alternatives are separate behaviours. Applicable rules supply guards and invariants. Executable evidence is external to the product model.
