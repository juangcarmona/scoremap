---
id: LC-LIBRARY
type: domain-lifecycle
title: Library active song presence
status: draft
subject: TERM-LIBRARY
states:
  - id: EMPTY
    title: No active songs
    initial: true
  - id: POPULATED
    title: At least one active song
transitions:
  - id: CREATE-FIRST
    title: Create the first active song
    from: [EMPTY]
    to: POPULATED
    trigger: Create a valid first active song and receive durable acknowledgement
    initiated-by: [ACT-MUSICIAN]
    governed-by: [BR-IDENTITY, BR-EDIT-GUARD, BR-DURABILITY, BR-ACCESS, BR-SESSION]
    realized-by: [UC-SONGS]
  - id: CREATE
    title: Create another active song
    from: [POPULATED]
    to: POPULATED
    trigger: Create another valid active song and receive durable acknowledgement
    initiated-by: [ACT-MUSICIAN]
    governed-by: [BR-IDENTITY, BR-EDIT-GUARD, BR-DURABILITY, BR-ACCESS, BR-SESSION]
    realized-by: [UC-SONGS]
  - id: DELETE-LAST
    title: Delete the only active song
    from: [POPULATED]
    to: EMPTY
    trigger: Delete the only active song and receive durable acknowledgement
    initiated-by: [ACT-MUSICIAN]
    governed-by: [BR-IDENTITY, BR-EDIT-GUARD, BR-DURABILITY, BR-ACCESS, BR-SESSION]
    realized-by: [UC-SONGS]
  - id: DELETE
    title: Delete an active song while another remains
    from: [POPULATED]
    to: POPULATED
    trigger: Delete an active song while another active song remains and receive durable acknowledgement
    initiated-by: [ACT-MUSICIAN]
    governed-by: [BR-IDENTITY, BR-EDIT-GUARD, BR-DURABILITY, BR-ACCESS, BR-SESSION]
    realized-by: [UC-SONGS]
  - id: IMPORT-EMPTY
    title: Replace anonymous content with a confirmed valid empty backup
    from: [EMPTY, POPULATED]
    to: EMPTY
    trigger: Confirm a supported complete anonymous replacement containing no songs and receive durable acknowledgement
    initiated-by: [ACT-MUSICIAN]
    governed-by: [BR-BACKUP, BR-DURABILITY, BR-EDIT-GUARD]
    realized-by: [UC-BACKUP]
  - id: IMPORT-POPULATED
    title: Import confirmed valid active songs
    from: [EMPTY, POPULATED]
    to: POPULATED
    trigger: Confirm a supported import or claim containing active songs and receive durable acknowledgement at the declared library boundary
    initiated-by: [ACT-MUSICIAN]
    governed-by: [BR-BACKUP, BR-DURABILITY, BR-EDIT-GUARD, BR-IDENTITY, BR-ACCESS, BR-SESSION]
    realized-by: [UC-BACKUP]
  - id: RESTORE
    title: Restore a retained deleted song to active presence
    from: [EMPTY, POPULATED]
    to: POPULATED
    trigger: Confirm a valid restoration of retained deleted content under the applicable local or current-owner private authority and receive durable acknowledgement
    initiated-by: [ACT-MUSICIAN]
    governed-by: [BR-IDENTITY, BR-EDIT-GUARD, BR-DURABILITY, BR-ACCESS, BR-SESSION]
    realized-by: [UC-SONGS]
---

## Purpose

Expose the persistent presence of active songs in one declared personal-library scope. Preserve the existing EMPTY/POPULATED distinction and transition identities while distinguishing native or private retained deletion from active availability.

## Invariants

EMPTY means exactly zero active songs; POPULATED means at least one active song. Retained deleted songs and purged identities do not count as active. Hidden or inaccessible songs are not erased by a caller's filtered view: state describes the declared library's content, not the current screen or one grantee's visible subset. Repertoires and independently owned reusable resources may exist in either state. Memberships resolve to active songs without duplicates.

Stable song/content identities survive reorder and authorized restoration. Private deletion removes memberships atomically but retains owner-only song-owned content/history under LC-SONG-RETENTION. Native deletion removes active memberships atomically and retains complete local song-owned content, required PDF bytes and history without expiry until a separately confirmed purge under BR-IDENTITY; it requires no private account or online check. Anonymous browser deletion retains its local current-data semantics. Acknowledgement is required at the appropriate complete durable boundary; neither a queued draft nor a private device copy changes acknowledged active presence.

## State Semantics

Presence is derived from persistent active content. It does not describe whether the musician is editing, selected an event, has signed in, has unsaved work or is offline. LC-STRUCTURE independently describes section presence within a song and retains its EMPTY/ARRANGED topology. Retained deletion is separate from library presence: an EMPTY native library may still contain complete local recovery data and an EMPTY private library may still contain owner-only deleted recovery data.

## Transition Semantics

CREATE-FIRST and CREATE retain their distinct starting presence conditions. DELETE-LAST requires exactly one active song; DELETE requires another active song to remain. For native DELETE-LAST and DELETE, retain complete local recovery while removing active memberships without deleting unrelated content. For private DELETE-LAST and DELETE, also move the selected song from ACTIVE to DELETED retention and invalidate grants, without deleting unrelated resources. Same-state CREATE and DELETE are meaningful acknowledged changes to the active collection, not fabricated save-state transitions.

IMPORT-EMPTY remains an explicitly confirmed anonymous complete replacement; it cannot empty a private account through an imported backup. IMPORT-POPULATED preserves the existing anonymous replacement case and also describes a complete acknowledged private import/claim introducing active songs under current authority. Native independent-copy import containing active songs also uses IMPORT-POPULATED: remap the whole selected song/set graph consistently and atomically activate complete copies, required definitions, PDF bytes, initial destination histories and receipt under BR-BACKUP without replacing any destination content. Importing an empty native set without active songs does not change this lifecycle. IMPORT-EMPTY is not a native replacement permission. Private work does not replace unselected destination songs, imported grants confer no authority and partial multi-boundary progress is reported per receipt.

RESTORE reintroduces an existing retained identity as an active song. It produces POPULATED from either valid starting presence and, only for private-service work, coincides with LC-SONG-RETENTION RESTORE for that song. Native restoration is installation-local, preserves complete retained song-owned music/PDF content and history, and requires no online authorization. It creates a new acknowledged content revision but neither restores old grants nor silently recreates repertoire memberships. Identity/revision/reference conflicts refuse before activation. Reading deleted data or purging already deleted content does not change active presence.

Every admitted transition enforces its rules, applicable current capability, edit guard, complete validity and expected revision. BR-ACCESS/BR-SESSION apply to private content without imposing private sign-in on anonymous browser or standalone native local work. A refused, cancelled or failed command performs no transition. Ambiguous responses reconcile actual committed receipts rather than assume rollback or perform duplicate effects.

## Boundaries

This lifecycle does not grant authority, promise erasure or enumerate every musical-content edit. Opening, consulting, session locking, notation changes and saves that do not affect active presence are not transitions here. A behaviour's single covers-transition reference cannot be expanded into an invented multi-transition field merely because a command has effects in both library presence and song retention.
