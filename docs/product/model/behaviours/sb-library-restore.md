---
id: SB-LIBRARY-RESTORE
type: structured-behaviour
title: Restore retained identity into an already populated active library
status: draft
illustrates:
  - UC-SONGS
  - BR-IDENTITY
  - BR-EDIT-GUARD
  - BR-DURABILITY
  - BR-ACCESS
  - BR-SESSION
  - BR-STRUCTURE
given:
  - Current owner A's declared private library is POPULATED with active song T
  - Song S is retained in DELETED state at acknowledged deletion revision 18 with complete valid owned content and history
  - S has no active repertoire memberships and its former collaborative grants were invalidated
  - A completes real sign-in and fresh online authorization to restore S
  - Edit mode is active and the valid restore command expects revision 18 with a stable retry identity
  - No identity conflict or purge receipt blocks restoration and all retained references are valid
  - Current permission and revision admission serialize with a successful complete durable transaction
when: A confirms restoration of S to the active library
then:
  - The declared active library contains both S and T and remains POPULATED through its RESTORE transition
  - S retains its existing song and owned-content identities rather than becoming a duplicate
  - S becomes ACTIVE in retention with a complete new acknowledged revision 19 and the original command receipt
  - Its shared form, independent arrangements, exact pitches, timing and bindings reconstruct without unrequested changes
  - Prior history remains recoverable and former grants and repertoire memberships are not reactivated
  - T and its complete content, grants, history and memberships remain unchanged
  - Independently owned reusable resources remain unchanged and no device draft is automatically replayed
covers-transition:
  lifecycle: LC-LIBRARY
  transition: RESTORE
uses-terms:
  - TERM-LIBRARY
  - TERM-SONG
  - TERM-ARRANGEMENT
  - TERM-EVENT
  - TERM-VOICING
  - TERM-PRINCIPAL
---

## Intent

Supply the missing typed active-library RESTORE edge using one concrete successful command. Restoration into a populated library is a meaningful same-presence change to its active collection; it neither creates a fresh song identity nor replaces another song.

## Boundaries

This example has exactly one covers-transition object for LC-LIBRARY RESTORE. SB-SONG-RESTORE separately covers LC-SONG-RETENTION RESTORE from an initially empty active library. Their combined definitions cover both starting presence states without inventing a multi-transition field. Retention ACTIVE is an outcome here, not a second typed edge. Stale revisions, identity conflicts, failed transactions and concurrent purge have separate FR-SONGS cases and perform no successful transition. This action is not active-history restoration, anonymous import or restoration from PURGED. Real service reconstruction, races and review remain separate evidence.
