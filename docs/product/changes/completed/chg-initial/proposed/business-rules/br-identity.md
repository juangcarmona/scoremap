---
id: BR-IDENTITY
type: business-rule
title: Stable identity and ownership
status: active
applies-to:
  - BC-LIBRARY
---

## Rule

Song, repertoire and section IDs are stable and unique. Membership contains each existing song at most once. Deleting a repertoire removes only memberships; deleting a song removes its memberships and owned data. Reordering changes position only, preserving section IDs, chords, notes and repeats.

## Rationale

Protect the musician’s content and preserve trustworthy consultation.

## Examples

Concrete accepted and refused outcomes are authored in the related Structured Behaviours.

## Exceptions

None.
