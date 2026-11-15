---
id: UC-MEMBERSHIP
type: use-case
title: Choose repertoire songs
status: active
primary-actor: ACT-MUSICIAN
bounded-context: BC-LIBRARY
governed-by:
  - BR-IDENTITY
  - BR-EDIT-GUARD
uses-terms:
  - TERM-REPERTOIRE
  - TERM-SONG
---

## Goal

Add existing songs once, remove memberships and browse songs inside or outside repertoires.

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
