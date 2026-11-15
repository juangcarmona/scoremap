---
id: UC-PDF
type: use-case
title: Consult optional PDF music
status: active
primary-actor: ACT-MUSICIAN
bounded-context: BC-RECOVERY
governed-by:
  - BR-PDF
  - BR-DURABILITY
  - BR-EDIT-GUARD
uses-terms:
  - TERM-ATTACHMENT
  - TERM-SONG
---

## Goal

Attach, open, swipe, navigate and resume a locally stored PDF from its owning song.

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
