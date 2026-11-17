---
id: SB-SONG-RETAIN
type: structured-behaviour
title: Retain complete owner-only recovery after an acknowledged delete
status: draft
illustrates:
  - UC-SONGS
  - BR-IDENTITY
  - BR-EDIT-GUARD
  - BR-DURABILITY
  - BR-ACCESS
  - BR-SESSION
given:
  - Authenticated current owner A has private song S in ACTIVE retention at acknowledged revision 17
  - S contains shared form, two independent arrangements, performed parts and bindings, owned attachments and complete revision history
  - S has active repertoire memberships and an editor grant to E and a viewer grant to V
  - Edit mode is active and A has current delete capability
  - The valid owner-confirmed delete command expects revision 17 and has a stable retry identity
  - Permission and revision checks serialize with a successful complete durable transaction
when: A submits that confirmed delete command for S
then:
  - S changes from ACTIVE to DELETED retention in one complete acknowledged result
  - Shared form, both arrangements, performed notes, bindings, owned attachments and prior history remain retained together with their stable identities
  - A new acknowledged deletion revision 18 and the command receipt record the result without erasing intervening history
  - S is absent from active lists, repertoire memberships and ordinary consultation
  - E's and V's grants are invalidated and confer no right to retained content or its history
  - Only the current owner after fresh online authorization may read the retained content, restore it or confirm purge
  - Retained content has no automatic age-based purge deadline
  - Other songs and independently owned reusable resources remain unchanged
  - No purge or restoration occurs
covers-transition:
  lifecycle: LC-SONG-RETENTION
  transition: DELETE
uses-terms:
  - TERM-SONG
  - TERM-LIBRARY
  - TERM-ARRANGEMENT
  - TERM-EVENT
  - TERM-PRINCIPAL
  - TERM-ATTACHMENT
---

## Intent

Give the genuine retention DELETE transition a concrete example. Recoverable deletion moves the whole private song out of active use while retaining its complete owned content and revisions for the current owner, rather than erasing history or keeping collaborator access.

## Boundaries

The stimulus is a successful delete, not a read-only trash visit. No RETAIN self-transition is introduced. This example's single coverage object binds retention DELETE; the applicable library DELETE or DELETE-LAST effect depends on active collection size and has separate explicit examples. Owner-only retained availability is an authorization invariant, not a claim that a subsequent read, restore or purge was executed. A separate fresh-owner deleted-read example already appears in FR-SONGS. No time-based purge, public/private backup erasure or cross-account protected-draft access is authorized. Unsupported attachment delivery remains independent. Anonymous local deletion does not enter this private retention lifecycle. Actual failure, concurrency and recovery evidence is required separately.
