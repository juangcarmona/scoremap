---
id: SB-NATIVE-SONG-DELETE
type: structured-behaviour
title: "Recoverably delete the last active native song without losing owned music"
status: draft
illustrates:
  - UC-SONGS
  - BR-IDENTITY
  - BR-EDIT-GUARD
  - BR-DURABILITY
  - BR-STRUCTURE
given:
  - "A standalone native Android installation is offline with no signed-in account and its POPULATED active library contains only song S"
  - "S has complete acknowledged shared form, two independent arrangements, exact spelled pitches and registers, timing, parts, bindings, lyrics associations, phrase data, required owned PDF bytes with integrity reference and revision history"
  - "S has an active membership in set R; independently owned resource P and the previous histories of S and R exist"
  - "Edit mode is active and an explicitly confirmed delete command for S expects its current revision with a stable command identity"
  - "Complete validity and revision admission succeed and the whole local deletion boundary commits durably"
when: "The musician submits that confirmed native delete command for S"
then:
  - "S leaves active use and ordinary consultation and the active library becomes EMPTY through DELETE-LAST"
  - "All active memberships of S are removed atomically while R remains a valid set and every unrelated membership and independent resource stays intact"
  - "The complete song-owned musical graph, identities, required PDF bytes and all acknowledged prior song history remain locally recoverable without automatic expiry"
  - "The acknowledged deletion revision and stable command receipt record the complete result; affected surviving set history is preserved"
  - "No purge occurs and no account, fresh online authorization or private-service retention transition is required"
  - "The result claims recoverable local deletion rather than erasure of previously exported files"
covers-transition:
  lifecycle: LC-LIBRARY
  transition: DELETE-LAST
uses-terms:
  - TERM-LIBRARY
  - TERM-SONG
  - TERM-ARRANGEMENT
  - TERM-EVENT
  - TERM-VOICING
  - TERM-ATTACHMENT
  - TERM-REPERTOIRE
---

## Intent

Show that an EMPTY active native library may retain the complete deleted song and durable recovery history while set membership remains non-owning.

## Boundaries

This command covers only LC-LIBRARY DELETE-LAST. Local retained availability and revision history are outcomes, not invented LC-SONG-RETENTION edges; that lifecycle remains private-service scoped. Separate restore and distinctly confirmed purge commands have separate results. Failed, stale, cancelled and retried commands require separate verification; no execution is claimed.
