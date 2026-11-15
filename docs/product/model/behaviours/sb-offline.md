---
id: SB-OFFLINE
type: structured-behaviour
title: Edit and recover offline
status: active
illustrates:
  - UC-OFFLINE
  - BR-DURABILITY
given:
  - ScoreMap has loaded successfully and cached its application shell
  - A prepared local library exists
  - Connectivity is unavailable
when: The musician reloads, opens a song, edits a note and saves
then:
  - The application and complete sketch open without network access
  - The note is persisted and survives another reload
  - Chord references and repertoire navigation work
---

## Intent

Edit and recover offline.

## Boundaries

Clauses describe observable product results. All preconditions and outcomes are conjunctive; alternatives are separate behaviours. Applicable rules supply guards and invariants. Executable evidence is external to the product model.
