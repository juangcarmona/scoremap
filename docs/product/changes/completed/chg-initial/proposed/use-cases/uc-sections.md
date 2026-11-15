---
id: UC-SECTIONS
type: use-case
title: Organize a song sketch
status: active
primary-actor: ACT-MUSICIAN
bounded-context: BC-SKETCH
governed-by:
  - BR-IDENTITY
  - BR-STRUCTURE
  - BR-EDIT-GUARD
uses-terms:
  - TERM-SECTION
  - TERM-SONG
---

## Goal

Insert, rename, remove, repeat and reorder identified sections.

## Trigger

The musician requests the corresponding action on local personal content.

## Preconditions

The library is readable. Mutations require edit mode; operations on existing objects require their identity to resolve.

## Main Flow

The musician selects the action, supplies valid values and receives its observable result. Local writes report success only after durable acknowledgement.

## Alternative Flows

Empty libraries and empty sketches are valid. Refused operations preserve existing content; offline reference targets remain external.

## Failure Conditions

Unknown identities, invalid values, unsupported data and failed persistence produce actionable errors and preserve the previous durable content.

## Postconditions

The requested result is observable and every applicable identity, structure, musical and persistence invariant remains true.
