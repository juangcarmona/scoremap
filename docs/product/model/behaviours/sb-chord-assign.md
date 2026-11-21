---
id: SB-CHORD-ASSIGN
type: structured-behaviour
title: Assign ordered major and minor chords
status: active
illustrates:
  - UC-CHORDS
  - BR-CHORDS
  - BR-EDIT-GUARD
given:
  - Edit mode is active
  - A section exists
when: The musician assigns a synthetic sequence of C major, D-flat minor and
  F-sharp major
then:
  - The section retains the specified order and root spellings
  - Each triad has the correct major or minor pitch classes
---

## Intent

Assign ordered major and minor chords.

## Boundaries

Clauses describe observable product results. All preconditions and outcomes are conjunctive; alternatives are separate behaviours. Applicable rules supply guards and invariants. Executable evidence is external to the product model.
