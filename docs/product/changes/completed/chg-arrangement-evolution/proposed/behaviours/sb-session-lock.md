---
id: SB-SESSION-LOCK
type: structured-behaviour
title: Lock private work at known session expiry without losing the pending draft
status: draft
illustrates:
  - UC-PERSIST
  - UC-OFFLINE
  - BR-SESSION
  - BR-ACCESS
  - BR-DURABILITY
given:
  - Stable principal A is viewing private song S and has unacknowledged performed-note edits
  - S has a complete acknowledged service revision that remains unchanged by those edits
  - The pending edits have a protected account-bound recovery record with no unauthenticated plaintext access
  - Persistent private offline access is disabled for the connected checkpoint
  - A's known session expiration instant has arrived without successful reauthentication
when: The application observes that the session has expired
then:
  - Private views and usable draft plaintext are locked immediately and authenticated writes stop
  - Usable session and decryption material is removed from the active context rather than retained in public application caches
  - The protected record remains bound to A and S while the last acknowledged service revision is preserved
  - The product shows that access is locked and the edits are not acknowledged as saved to the private library
  - Reload and restart cannot expose the retained record to an unauthenticated session or another account
  - No write is automatically replayed and no forced plaintext export or silent discard occurs
  - Recovery requires A's same stable provider subject and tenant/issuer to reauthenticate and pass fresh online resource and revision checks before exposure or explicit reconciliation
  - The original anonymous library is not erased by private-session cleanup
  - No musical-content, library-presence, structure-presence or song-retention transition occurs
uses-terms:
  - TERM-SONG
  - TERM-PRINCIPAL
---

## Intent

Make involuntary session end safe even in the first connected checkpoint: private content locks while pending work remains protected for the same principal. Disabling offline editing does not permit pending-work loss.

## Boundaries

This single expiry event asserts the retained lock boundary, including its persistence across reopening; it does not claim recovery has already succeeded. Voluntary logout with failed save/export, account switching, observed revocation and refused recovery require separate command examples. Qualified offline access has the separately specified resource-scoped maximum of eight hours and may expire earlier; this connected example neither starts nor renews that lease. Protection/key qualification and real execution remain external evidence, not a consequence of authoring this behaviour.
