---
id: LC-SONG-RETENTION
type: domain-lifecycle
title: Private song recoverable retention
status: draft
subject: TERM-SONG
states:
  - id: ACTIVE
    title: Available under current active-song capabilities
    initial: true
  - id: DELETED
    title: Removed from active use with owner-only recoverable content
  - id: PURGED
    title: Retained live content removed and identity barred from resurrection
    terminal: true
transitions:
  - id: DELETE
    title: Recoverably delete an active private song
    from: [ACTIVE]
    to: DELETED
    trigger: The current owner confirms a valid revision-checked delete and receives durable acknowledgement
    initiated-by: [ACT-MUSICIAN]
    governed-by: [BR-IDENTITY, BR-EDIT-GUARD, BR-DURABILITY, BR-ACCESS, BR-SESSION]
    realized-by: [UC-SONGS]
  - id: RESTORE
    title: Restore retained deleted content as a new active revision
    from: [DELETED]
    to: ACTIVE
    trigger: The current owner confirms a valid revision-checked restore after fresh online authorization and receives durable acknowledgement
    initiated-by: [ACT-MUSICIAN]
    governed-by: [BR-IDENTITY, BR-EDIT-GUARD, BR-DURABILITY, BR-ACCESS, BR-SESSION, BR-STRUCTURE]
    realized-by: [UC-SONGS]
  - id: PURGE
    title: Permanently purge retained deleted song content
    from: [DELETED]
    to: PURGED
    trigger: The current owner separately confirms irreversible purge naming the song after fresh online authorization and receives durable acknowledgement
    initiated-by: [ACT-MUSICIAN]
    governed-by: [BR-IDENTITY, BR-EDIT-GUARD, BR-DURABILITY, BR-ACCESS, BR-SESSION]
    realized-by: [UC-SONGS]
---

## Purpose

Distinguish a private song's current active availability, recoverable deletion and explicit irreversible live-content purge. This lifecycle records genuine retention outcomes, not publishing, session, navigation or save status.

## Invariants

One retained private song identity has exactly one acknowledged retention state. Song-owned shared form, arrangements, events, attachments and history follow the same atomic retention outcome. Independently owned reusable voicings/configurations/preferences and other songs do not cascade with it. Private ownership derives from the trusted stable principal; grants cannot be imported or self-escalated.

A current owner's fresh online authorization is required for deleted-content reads, restore and purge. Former editor/viewer grants confer no deleted-content or trash/history access. No age-based purge occurs. Restore retains song/content identities and creates a new revision, preserving intervening history but never reactivating former grants or memberships. A non-content purge receipt prevents resurrection of the same identity through old commands, retained drafts or backup restoration.

## State Semantics

ACTIVE means the song participates in active libraries and is available only under current song capabilities and session policy. It is not public or globally readable. Initial ACTIVE describes a newly acknowledged private song, not uncommitted draft creation or permission for a no-session read.

DELETED means the song is absent from active lists, memberships and ordinary consultation while its complete owned content and revisions remain recoverable by the current owner. Collaborative access has been invalidated. The last active song may be DELETED while LC-LIBRARY is EMPTY. Retained data is not erased data, and protected pending device retention is not this server-owned retention state.

PURGED means the live application no longer retains the song-owned content/history and has an anti-resurrection receipt without musical content. There is no restore transition out of PURGED. This is not a promise to erase already exported copies, unobserved offline data or operator backups instantly. Operator restoration must reconcile current deletion/purge receipts and authorization before exposure. A deliberately confirmed copy-as-new is another identity, not restoration of this purged identity.

## Transition Semantics

DELETE admits only a current-owner, edit-admitted, valid expected-revision command. Its complete acknowledgement removes active memberships, retains owned content/history and invalidates grants together. It also realizes LC-LIBRARY DELETE or DELETE-LAST according to whether other active songs remain; no partly deleted state is observable as success.

RESTORE admits only the current owner after fresh online authorization, edit admission and valid identity/reference/expected-revision checks. The complete result retains identities, becomes ACTIVE and creates a new revision without old grants or memberships. Active-library presence becomes POPULATED through LC-LIBRARY RESTORE, irrespective of whether other active songs already existed. Restoration of an active historical revision is not this transition: it creates a content revision while retention remains ACTIVE.

PURGE requires a separate destructive confirmation naming the deleted song and explaining irreversibility, current-owner fresh authorization, edit admission and expected revision. Its acknowledged result atomically removes retained live song-owned data/history and records the anti-resurrection receipt. Declining confirmation, failed writes or conflicting revisions preserve the prior complete state. Lost responses reconcile command receipts; concurrent delete/restore/purge cannot create duplicate or partial resurrection.

Merely reading deleted content, reopening an owner's trash view or waiting without a purge command leaves DELETED unchanged and creates no revision or transition. No RETAIN self-transition is invented for these reads. Refused/failed/unauthorized commands perform no transition and never gain access through retained state. Session locking protects pending work independently and is not a song-retention transition.

## Boundaries

This lifecycle applies to private acknowledged songs. Existing anonymous local deletion remains its current-data boundary and does not claim newly delivered private history. It does not change LC-STRUCTURE's section-presence topology. A single structured behaviour may reference only its one actual covered transition; additional coincident lifecycle effects are stated explicitly without inventing a multi-transition field. Executed failure/race/recovery evidence and operator backup policies remain separate from this definition.
