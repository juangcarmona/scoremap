---
id: LC-STRUCTURE
type: domain-lifecycle
title: Song structure presence
status: active
subject: TERM-SONG
states:
  - id: EMPTY
    title: No sections
    initial: true
  - id: ARRANGED
    title: One or more sections
transitions:
  - id: INSERT-FIRST
    title: Insert the first section
    from:
      - EMPTY
    to: ARRANGED
    trigger: Insert the first section
    initiated-by:
      - ACT-MUSICIAN
    governed-by:
      - BR-STRUCTURE
      - BR-EDIT-GUARD
    realized-by:
      - UC-SECTIONS
  - id: INSERT
    title: Insert another section
    from:
      - ARRANGED
    to: ARRANGED
    trigger: Insert another section
    initiated-by:
      - ACT-MUSICIAN
    governed-by:
      - BR-STRUCTURE
      - BR-EDIT-GUARD
    realized-by:
      - UC-SECTIONS
  - id: MODIFY
    title: Modify an existing section including its repeat count
    from:
      - ARRANGED
    to: ARRANGED
    trigger: Modify an existing section including its repeat count
    initiated-by:
      - ACT-MUSICIAN
    governed-by:
      - BR-STRUCTURE
      - BR-EDIT-GUARD
    realized-by:
      - UC-SECTIONS
  - id: REORDER
    title: Reorder at least two existing sections
    from:
      - ARRANGED
    to: ARRANGED
    trigger: Reorder at least two existing sections
    initiated-by:
      - ACT-MUSICIAN
    governed-by:
      - BR-STRUCTURE
      - BR-IDENTITY
      - BR-EDIT-GUARD
    realized-by:
      - UC-SECTIONS
  - id: REMOVE
    title: Remove a section while another remains
    from:
      - ARRANGED
    to: ARRANGED
    trigger: Remove a section while another remains
    initiated-by:
      - ACT-MUSICIAN
    governed-by:
      - BR-STRUCTURE
      - BR-EDIT-GUARD
    realized-by:
      - UC-SECTIONS
  - id: REMOVE-LAST
    title: Remove the final section
    from:
      - ARRANGED
    to: EMPTY
    trigger: Remove the final section
    initiated-by:
      - ACT-MUSICIAN
    governed-by:
      - BR-STRUCTURE
      - BR-EDIT-GUARD
    realized-by:
      - UC-SECTIONS
---

## Purpose

Expose meaningful persistent content states and valid guarded operations.

## Invariants

Section IDs, associated chords, notes and repeats survive reordering. Each section has one owner; order has no missing or duplicate IDs.

## State Semantics

State is derived from persistent content, never from the current screen, editing mode or a fabricated publishing lifecycle.

## Transition Semantics

Every transition requires its governed business rules. An invalid operation is refused without a transition; failures are separate Structured Behaviours.

## Boundaries

The initial empty song is valid. Repetitions are a positive count, not copied section identities.
