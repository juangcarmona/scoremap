---
id: SB-SONG-RESTORE
type: structured-behaviour
title: Restore a deleted private song without reviving former grants
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
  - Private song S is in DELETED retention at acknowledged deletion revision 18 with complete valid owned content and history
  - Current owner A has completed real sign-in and fresh online authorization for this deleted song
  - A's declared active library is EMPTY and the previous repertoire R remains without S's membership
  - Former editor and viewer grants were invalidated by deletion
  - Edit mode is active and the restore command expects revision 18 with a stable retry identity
  - No identity conflict or purge receipt prevents restoration and all retained references remain valid
  - Current authorization and revision admission remain valid through a successful complete durable transaction
when: A confirms restoration of S
then:
  - S changes from DELETED to ACTIVE retention with the same song and owned-content identities
  - A new complete acknowledged revision 19 and its retry receipt record the restoration while retaining prior history
  - Shared form, arrangement independence, exact performed pitches, timing and owned bindings reconstruct without unrequested musical changes
  - S returns to active owner consultation and active-library presence becomes POPULATED
  - Former editor and viewer grants remain invalid and are not reactivated
  - S is not silently re-added to R and R remains unchanged
  - Other songs and independently owned reusable resources remain unchanged
  - No retained device draft is automatically replayed and no duplicate song is created
covers-transition:
  lifecycle: LC-SONG-RETENTION
  transition: RESTORE
uses-terms:
  - TERM-SONG
  - TERM-LIBRARY
  - TERM-ARRANGEMENT
  - TERM-EVENT
  - TERM-VOICING
  - TERM-PRINCIPAL
  - TERM-REPERTOIRE
---

## Intent

Make owner restoration a new acknowledged retention outcome that preserves identity and history without silently restoring collaboration or repertoire associations. An empty active library can become populated by restoring an existing identity rather than creating a duplicate.

## Boundaries

This single successful command covers LC-SONG-RETENTION RESTORE only. POPULATED active-library presence is an explicit outcome but does not supply a second typed covers-transition edge for LC-LIBRARY RESTORE; final assembly must resolve that coverage through supported authoring. A restore into an already populated library, stale expected revision, identity conflict, failed transaction and concurrent purge are separate requirement examples. Restoration of an active historical revision is a different command and does not change retention. There is no restoration from PURGED, and a copied new identity does not reverse purge. No former grant, membership, cached role or protected pending record supplies authorization. Authoring does not attest executed remote reconstruction, race safety or deployment.
