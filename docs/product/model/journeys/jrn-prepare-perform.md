---
id: JRN-PREPARE-PERFORM
type: journey
title: Prepare and perform a song
status: active
primary-actor: ACT-MUSICIAN
steps:
  - use-case: UC-REPERTOIRES
  - use-case: UC-SONGS
  - use-case: UC-MEMBERSHIP
  - use-case: UC-SECTIONS
  - use-case: UC-CHORDS
  - use-case: UC-ANNOTATIONS
  - use-case: UC-PERSIST
  - use-case: UC-CONSULT
  - use-case: UC-OFFLINE
  - use-case: UC-BACKUP
---

## Intended Outcome

A personally prepared song can be consulted quickly and safely on a tablet without connectivity.

## Entry Conditions

A musician opens ScoreMap; an empty library is a supported beginning.

## Journey Narrative

Prepare local musical content, retain it, consult during performance and keep a backup.

## Variants and Branches

Songs may have no repertoire, sections or chords. External references and PDFs are optional.

## Completion Conditions

The current content is durably recoverable and readable in performance consultation.
