---
id: LC-LIBRARY
type: domain-lifecycle
title: Library song presence
status: active
subject: TERM-LIBRARY
states:
  - id: EMPTY
    title: No songs
    initial: true
  - id: POPULATED
    title: At least one song
transitions:
  - id: CREATE-FIRST
    title: Create the first song
    from:
      - EMPTY
    to: POPULATED
    trigger: Create the first song
    initiated-by:
      - ACT-MUSICIAN
    governed-by:
      - BR-IDENTITY
      - BR-EDIT-GUARD
    realized-by:
      - UC-SONGS
  - id: CREATE
    title: Create another song
    from:
      - POPULATED
    to: POPULATED
    trigger: Create another song
    initiated-by:
      - ACT-MUSICIAN
    governed-by:
      - BR-IDENTITY
      - BR-EDIT-GUARD
    realized-by:
      - UC-SONGS
  - id: DELETE-LAST
    title: Delete the only song
    from:
      - POPULATED
    to: EMPTY
    trigger: Delete the only song
    initiated-by:
      - ACT-MUSICIAN
    governed-by:
      - BR-IDENTITY
      - BR-EDIT-GUARD
    realized-by:
      - UC-SONGS
  - id: DELETE
    title: Delete a song while other songs remain
    from:
      - POPULATED
    to: POPULATED
    trigger: Delete a song while other songs remain
    initiated-by:
      - ACT-MUSICIAN
    governed-by:
      - BR-IDENTITY
      - BR-EDIT-GUARD
    realized-by:
      - UC-SONGS
  - id: IMPORT-EMPTY
    title: Import a confirmed valid backup containing no songs
    from:
      - EMPTY
      - POPULATED
    to: EMPTY
    trigger: Import a confirmed valid backup containing no songs
    initiated-by:
      - ACT-MUSICIAN
    governed-by:
      - BR-BACKUP
      - BR-DURABILITY
      - BR-EDIT-GUARD
    realized-by:
      - UC-BACKUP
  - id: IMPORT-POPULATED
    title: Import a confirmed valid backup containing songs
    from:
      - EMPTY
      - POPULATED
    to: POPULATED
    trigger: Import a confirmed valid backup containing songs
    initiated-by:
      - ACT-MUSICIAN
    governed-by:
      - BR-BACKUP
      - BR-DURABILITY
      - BR-EDIT-GUARD
    realized-by:
      - UC-BACKUP
---

## Purpose

Expose meaningful persistent content states and valid guarded operations.

## Invariants

Song IDs remain unique; memberships resolve; a successful write is recoverable. EMPTY means exactly zero songs; POPULATED means at least one.

## State Semantics

State is derived from persistent content, never from the current screen, editing mode or a fabricated publishing lifecycle.

## Transition Semantics

Every transition requires its governed business rules. An invalid operation is refused without a transition; failures are separate Structured Behaviours.

## Boundaries

Repertoires can exist in either state. No song Draft, Published or Archived lifecycle is introduced.
