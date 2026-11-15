---
id: FR-SONGS
type: functional-requirement
title: Manage songs
status: active
derived-from:
  - UC-SONGS
verification:
  - scenario-ref: SB-SONG-CREATE
  - scenario-ref: SB-SONG-ADD
  - scenario-ref: SB-SONG-EDIT
  - scenario-ref: SB-SONG-DELETE-LAST
  - scenario-ref: SB-SONG-DELETE
  - scenario-ref: SB-BLANK-NAME
  - scenario-ref: SB-MISSING-IDENTITY
---

## Requirement

Create, rename, optionally attribute and delete personally authored songs.

## Rationale

Supports the approved prepare, rehearse and perform journey. Observable acceptance resides in the referenced Structured Behaviours.
