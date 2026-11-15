---
id: CHG-INITIAL
type: product-change
title: ScoreMap approved initial product definition
status: applied
base-revision: 0309491a37fabf8b43b287f1408e1a40bd28c911
operations:
  add:
    - ACT-MUSICIAN
    - BC-LIBRARY
    - BC-SKETCH
    - BC-RECOVERY
    - TERM-SONG
    - TERM-REPERTOIRE
    - TERM-SECTION
    - TERM-CHORD
    - TERM-ANNOTATION
    - TERM-LIBRARY
    - TERM-BACKUP
    - TERM-ATTACHMENT
    - TERM-MODE
    - BR-IDENTITY
    - BR-EDIT-GUARD
    - BR-STRUCTURE
    - BR-CHORDS
    - BR-DURABILITY
    - BR-BACKUP
    - BR-REFERENCES
    - BR-PDF
    - CON-LOCAL-FIRST
    - CON-PLATFORM
    - CON-SCOPE
    - CON-CONTENT
    - UC-REPERTOIRES
    - UC-MEMBERSHIP
    - UC-SONGS
    - UC-SECTIONS
    - UC-CHORDS
    - UC-ANNOTATIONS
    - UC-CONSULT
    - UC-PERSIST
    - UC-OFFLINE
    - UC-BACKUP
    - UC-REFERENCES
    - UC-PDF
    - JRN-PREPARE-PERFORM
    - LC-LIBRARY
    - LC-STRUCTURE
    - SB-REPERTOIRE-CREATE
    - SB-REPERTOIRE-RENAME
    - SB-REPERTOIRE-DELETE
    - SB-MEMBERSHIP-ADD
    - SB-MEMBERSHIP-DUPLICATE
    - SB-MEMBERSHIP-REMOVE
    - SB-SONG-CREATE
    - SB-SONG-ADD
    - SB-SONG-EDIT
    - SB-SONG-DELETE-LAST
    - SB-SONG-DELETE
    - SB-BLANK-NAME
    - SB-MISSING-IDENTITY
    - SB-SECTION-FIRST
    - SB-SECTION-INSERT
    - SB-SECTION-MODIFY
    - SB-SECTION-REORDER
    - SB-SECTION-REMOVE
    - SB-SECTION-REMOVE-LAST
    - SB-SECTION-INVALID-ORDER
    - SB-SECTION-REPEAT-BOUNDARY
    - SB-CHORD-ASSIGN
    - SB-CHORD-MODIFY
    - SB-CHORD-INVALID
    - SB-KEYBOARD
    - SB-ANNOTATIONS
    - SB-PERFORMANCE
    - SB-PERFORMANCE-REJECT
    - SB-EDIT-RESUME
    - SB-PERSIST-RECOVER
    - SB-PERSIST-FAILURE
    - SB-PERSIST-CONFLICT
    - SB-RECOVERY-INVALID
    - SB-OFFLINE
    - SB-BACKUP-EXPORT
    - SB-BACKUP-IMPORT
    - SB-BACKUP-IMPORT-EMPTY
    - SB-BACKUP-REJECT
    - SB-BACKUP-CANCEL
    - SB-REFERENCE
    - SB-REFERENCE-INVALID
    - SB-PDF-ATTACH
    - SB-PDF-NAVIGATE
    - SB-PDF-REJECT
    - FR-REPERTOIRES
    - FR-MEMBERSHIP
    - FR-SONGS
    - FR-SECTIONS
    - FR-CHORDS
    - FR-ANNOTATIONS
    - FR-CONSULT
    - FR-PERSIST
    - FR-OFFLINE
    - FR-BACKUP
    - FR-REFERENCES
    - FR-PDF
    - QR-READABILITY
    - QR-OFFLINE
    - QR-INTEGRITY
  modify: []
  remove: []
---

## Problem

The new repository has no canonical model of the approved ScoreMap product.

## Intended Product Outcome

The owner-supplied ScoreMap scope is expressed as an instrument-agnostic product graph with explicit states, guarded transitions, invariants and independently citable Structured Behaviours.

## Rationale

The November 15, 2026 owner request approves the product identity, scope and end-to-end execution through the November 20 deadline. This initial definition records that supplied intent. Implementation choices include bounded repeats and confirmed atomic backup replacement to protect data; these remain visible for product review.

## Affected Product Areas

Personal library, song sketches and local continuity.

## Open Questions

No additional product decision is needed for the core scope. Real Android installation and PDF delivery remain verification/delivery obligations.

## Product Acceptance

Approval source: the owner request in the ScoreMap bootstrap chat on November 15, 2026. It explicitly authorizes this product definition and implementation. Product Change apply does not accept the resulting Git baseline or prove delivery. The resulting baseline remains reviewable in its pull request.

## Out of Scope

No implemented-feature claim, architecture authority, publishing, MIDI, accounts, backend or cloud synchronization.
