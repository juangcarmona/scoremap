---
id: SB-NATIVE-SONG-CREATE
type: structured-behaviour
title: "Create the first complete locally acknowledged native song"
status: draft
illustrates:
  - UC-SONGS
  - BR-IDENTITY
  - BR-EDIT-GUARD
  - BR-DURABILITY
given:
  - "A standalone native Android installation is offline with no signed-in account and an EMPTY active library"
  - "The readable local store is supported and has no active song; an empty non-owning set and independent reusable resource P already exist"
  - "Edit mode is active and a valid nonblank-title initial-song command expects the current local revision with a stable command identity"
  - "The complete candidate and references are valid and the full local durable transaction succeeds"
when: "The musician submits that native first-song creation command"
then:
  - "The active library becomes POPULATED through CREATE-FIRST with exactly one new stable opaque song identity S"
  - "The complete valid initial song, optional artist value, initial acknowledged local history and command receipt commit together"
  - "The empty initial musical form does not fabricate performed notes, chords, timing or a key"
  - "The existing empty set and independent resource P remain unchanged"
  - "The result identifies local durability without requiring login, network or a backend and without claiming service save or remote backup"
covers-transition:
  lifecycle: LC-LIBRARY
  transition: CREATE-FIRST
uses-terms:
  - TERM-LIBRARY
  - TERM-SONG
  - TERM-REPERTOIRE
---

## Intent

Bind native no-account creation to the existing genuine first-active-song presence transition and a complete local acknowledgement.

## Boundaries

This is one creation command and one LC-LIBRARY CREATE-FIRST edge, not a save/session lifecycle. Restart, retry, storage failure, musical editing and independent-device transfer require their own evidence; this authored behaviour does not assert execution.
