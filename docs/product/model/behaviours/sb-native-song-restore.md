---
id: SB-NATIVE-SONG-RESTORE
type: structured-behaviour
title: "Restore a deleted native song with its identity and no former memberships"
status: draft
illustrates:
  - UC-SONGS
  - BR-IDENTITY
  - BR-EDIT-GUARD
  - BR-DURABILITY
  - BR-STRUCTURE
given:
  - "A standalone native Android installation is offline with no signed-in account and an EMPTY active library"
  - "Deleted song S retains complete valid song-owned music, exact pitches, parts and bindings, required PDF bytes with integrity reference and complete history through acknowledged deletion revision 18"
  - "The former set R still exists but has no active membership for S; independent resources remain valid"
  - "The musician has explicitly chosen restoration of S; edit mode is active and the command expects revision 18 with a stable command identity"
  - "All current identities and required references are valid, no purge receipt bars S and the complete local restore transaction succeeds"
when: "The musician confirms that native restoration command for S"
then:
  - "S returns to active use and the declared library becomes POPULATED through RESTORE"
  - "S and all retained owned content keep their existing identities, complete musical values and required PDF bytes rather than becoming a new independent copy"
  - "A new acknowledged revision 19 and original command receipt commit together while every intervening acknowledged history revision remains recoverable"
  - "No former set membership is silently recreated and R and unrelated independent resources remain unchanged"
  - "No login, backend or fresh online permission check is required and no private-service retention transition or remote save is claimed"
covers-transition:
  lifecycle: LC-LIBRARY
  transition: RESTORE
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

Bind identity-preserving local deleted-song restoration to active-library RESTORE without inheriting private-service authentication requirements.

## Boundaries

Exactly one LC-LIBRARY RESTORE edge is covered. This is not active-history restoration, independent-copy import or resurrection of a purged identity. Missing dependencies, identity conflict, stale revision, transaction failure and concurrent purge must refuse without partial activation under FR-SONGS; this example supplies no executed evidence.
