---
id: SB-LEASE-EXPIRY
type: structured-behaviour
title: Lock private content at the exact scoped eight-hour deadline
status: draft
illustrates:
  - UC-OFFLINE
  - UC-PERSIST
  - BR-SESSION
  - BR-ACCESS
  - BR-DURABILITY
given:
  - Stable principal A has qualified protected private offline access for song S
  - At authoritative server instant t the service successfully checked A's current session and the specific read and write permissions for S
  - The retained lease covers only those checked resources and permissions and has not been renewed
  - No shorter configured bound, known earlier session or authorization expiry, or observed logout, revocation or disablement has ended that authority
  - A is disconnected with S visible and has unacknowledged edits retained in an account-bound protected recovery record
  - Trustworthy elapsed time reaches exactly t plus eight hours
when: The scoped private access deadline is reached
then:
  - The lease no longer authorizes private access to S at that instant
  - Private views and usable draft plaintext lock and authorized operations stop
  - Usable session and decryption material is removed from the active context and is not retained in public application caches
  - Only A's protected resource-bound pending-work record remains available for later authorized recovery without unauthenticated plaintext access
  - S's last service-acknowledged revision and complete history remain unchanged
  - The product identifies locked access and unacknowledged pending work rather than reporting a private-library save
  - Offline actions, refresh and restart cannot renew the expired authority or unlock the retained work
  - Recovery requires the same stable provider subject and tenant or issuer, fresh online resource and revision checks, and explicit reconciliation without automatic replay
  - No musical-content, active-library, structure-presence or song-retention transition occurs
uses-terms:
  - TERM-PRINCIPAL
  - TERM-SONG
  - TERM-LIBRARY
---

## Intent

Make the resolved maximum boundary concrete: a successful scoped server authorization check starts a lease, and access ends at the eight-hour deadline, not after one more offline action. Protected retention prevents pending-work loss without extending authority.

## Boundaries

This is one deadline event in the later qualified private-offline capability. The first connected checkpoint keeps persistent private offline access disabled and does not satisfy this example merely by locking on disconnection. Earlier session/configuration deadlines, observed revocation, resource mismatch, clock rollback and uncertain time are separate FR-OFFLINE and QR-OFFLINE verification cases. A successful login alone cannot satisfy the resource-check precondition. This example does not promise detection of unobserved remote revocation while disconnected and does not claim draft recovery has succeeded. The anonymous library remains separate and is not erased. Actual protection, independently controlled-time verification and real server authorization evidence are later obligations, not results of authoring.
