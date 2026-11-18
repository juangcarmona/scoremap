---
id: SB-SONG-DELETE-LAST
type: structured-behaviour
title: Delete the final active private song without erasing recovery
status: draft
illustrates:
  - UC-SONGS
  - BR-IDENTITY
  - BR-EDIT-GUARD
  - BR-DURABILITY
  - BR-ACCESS
  - BR-SESSION
given:
  - Authenticated current owner A's declared private library contains only one active song S
  - S belongs to repertoire R and has identified sections, arrangements, performed events, owned attachments and acknowledged revision history
  - A also owns reusable presets and instrument configurations independently of S
  - A has current delete capability and edit mode is active
  - The complete valid command supplies S's current expected revision and a stable retry identity
  - Current authorization and revision admission remain valid and the durable transaction succeeds
when: A confirms deletion of S
then:
  - No active song remains and LC-LIBRARY presence becomes EMPTY
  - S disappears from active lists and normal consultation and its repertoire memberships are removed
  - R remains as a valid empty repertoire
  - S's sections, arrangements, performed events, owned attachments and complete history are removed from active use together but retained in DELETED recovery
  - Former collaborative grants are invalidated and retained content is owner-only after fresh online authorization
  - A's independently owned presets and instrument configurations remain unchanged
  - The deletion is acknowledged as a complete new revision with its retry receipt after commit
  - The product does not describe the empty active library as permanent erasure of retained content
covers-transition:
  lifecycle: LC-LIBRARY
  transition: DELETE-LAST
uses-terms:
  - TERM-SONG
  - TERM-LIBRARY
  - TERM-ARRANGEMENT
  - TERM-PRINCIPAL
  - TERM-REPERTOIRE
  - TERM-ATTACHMENT
---

## Intent

Retain the accepted final-song presence transition while distinguishing no active songs from no recoverable data. Repertoires and independent reusable resources survive the final active song's deletion.

## Boundaries

This single successful private delete covers LC-LIBRARY DELETE-LAST, not a second typed retention edge. Retention DELETE is separately covered by SB-SONG-RETAIN; reading the retained song is not performed by this command and still requires fresh owner authorization. Anonymous final-song deletion retains the existing complete local current-data removal and surviving-repertoire semantics without promising private retained history. Failed deletion, insufficient capability, expected-revision conflict and cancelled confirmation preserve the prior state under separate requirement cases. No section-removal transition is invented for moving retained owned content out of active use. Separate owner confirmation is required for purge; no age-based purge or instant erasure of prior exports/backups is implied. Actual persistence and role evidence remains external.
