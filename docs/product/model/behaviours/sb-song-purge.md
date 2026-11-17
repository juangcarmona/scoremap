---
id: SB-SONG-PURGE
type: structured-behaviour
title: Permanently purge one retained deleted private song
status: draft
illustrates:
  - UC-SONGS
  - BR-IDENTITY
  - BR-EDIT-GUARD
  - BR-DURABILITY
  - BR-ACCESS
  - BR-SESSION
given:
  - Private song S is in DELETED retention at acknowledged revision 18 with complete song-owned content and revision history
  - Current owner A has completed real sign-in and fresh online authorization to purge S
  - A has been shown a distinct destructive confirmation naming S and explaining irreversible removal of retained live content and history
  - Edit mode is active and the valid purge command expects revision 18 and carries a stable retry identity
  - Another active song T, surviving repertoires and independently owned reusable voicings and instrument configurations exist
  - Current owner authorization and expected-revision admission serialize with a successful complete durable transaction
when: A explicitly confirms that permanent purge of S
then:
  - S enters terminal PURGED retention only after the complete durable result is acknowledged
  - All retained live song-owned shared form, arrangements, performed events, bindings, attachments and musical revision history of S are removed atomically
  - A non-content purge receipt records the command result and bars resurrection of S's identity by stale commands, retained drafts or backup restoration
  - No musical content, usable session material or former grant is retained in that receipt
  - T, its history and grants, surviving repertoires and independently owned reusable resources remain unchanged
  - Active-library presence remains unchanged because S was already absent from active content
  - Former collaborative grants remain invalid and no pending device write is automatically replayed
  - The product distinguishes this permanent live-content removal from recoverable deletion
  - The product does not promise instantaneous erasure of prior exports, unobserved offline copies or operator backups
covers-transition:
  lifecycle: LC-SONG-RETENTION
  transition: PURGE
uses-terms:
  - TERM-SONG
  - TERM-LIBRARY
  - TERM-ARRANGEMENT
  - TERM-EVENT
  - TERM-PRINCIPAL
  - TERM-ATTACHMENT
---

## Intent

Make permanent purge a separately confirmed owner action, not a hidden consequence of ordinary deletion or elapsed time. The complete live retained musical scope disappears together, while a non-content receipt prevents resurrection of the same identity.

## Boundaries

This is one successful purge of already deleted private content. Its single typed edge covers retention PURGE, not a library-presence or section-removal transition. Declined confirmation, editor/viewer requests, stale revisions, failed transactions, lost responses and concurrent restore/purge have separate FR-SONGS cases; a refusal or failure performs no transition. A committed lost-response retry reconciles the original receipt rather than producing another effect. Operator restoration must reconcile purge records and current authorization before admitting restored content. A deliberate copy-as-new has another identity and does not restore S. Independent reusable resources do not cascade. This definition neither provisions backup storage nor claims executed race, failure or erasure evidence.
