---
id: FR-REPERTOIRES
type: functional-requirement
title: Manage non-owning repertoires and recoverable native sets
status: active
derived-from: [UC-REPERTOIRES, BR-IDENTITY, BR-DURABILITY, BR-EDIT-GUARD]
verification:
  - scenario-ref: SB-REPERTOIRE-CREATE
  - scenario-ref: SB-REPERTOIRE-RENAME
  - scenario-ref: SB-REPERTOIRE-DELETE
  - scenario: With a native set and valid edit admission, reorder its existing song membership and save; reopen the exact order without changing song identities or music.
  - scenario: With a native set containing existing songs, delete it offline; remove active set/memberships but retain its own ordered history and leave every song and independent resource unchanged.
  - scenario: With a deleted native set and all required songs currently valid, restore it; retain set identity and ordered membership, create a new acknowledged revision and preserve intervening history.
  - scenario: With a retained native set whose required song or resource was permanently removed, request restore; disclose the missing dependency and refuse an invalid or partial restore without durable mutation or resurrection.
  - scenario: With a deleted native set and separate destructive purge confirmation, cancel then later confirm as distinct commands; cancellation preserves it and confirmed purge removes only retained set-owned content/history with an anti-resurrection receipt, never songs.
  - scenario: With a native set command at a stale revision or storage failure, submit it; preserve acknowledged order/history and reconcile retries without duplicate effects.
---

## Requirement

The product MUST allow creating, renaming and deleting repertoires without deleting songs. Membership remains non-owning and contains each existing active song at most once. Empty sets and libraries are valid; edit admission and acknowledged durability govern mutation.

Native Android sets MUST preserve explicit membership order through save/reopen and complete transfer. Retain acknowledged set revisions and ordered-membership history without automatic expiry. Deleting a native set removes active use and active memberships but retains its own complete recoverable history until a distinct confirmed permanent purge. Neither delete nor purge may delete songs or independently owned resources. History inspection is read-only; valid restore preserves identity, creates a new revision and preserves intervening history. Validate current dependencies before activation; missing or permanently removed required songs/resources MUST be disclosed and invalid/partial restoration refused without silently inventing or resurrecting content.

Native set mutations, history restore, delete and purge MUST require edit mode, current expected revision, domain validity and atomic durability with stable command receipts, not account login or backend checks. Failed/stale/cancelled commands preserve prior data. Purge confirmation names the deleted set and irreversibility; a non-content receipt prevents stale resurrection. Existing web/browser behavior remains in its existing context.

## Rationale

Supports preparation, rehearsal and performance while protecting independently owned songs and preserving deliberate recovery choices for local ordered sets.
