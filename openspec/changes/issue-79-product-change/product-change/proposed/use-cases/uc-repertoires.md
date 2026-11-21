---
id: UC-REPERTOIRES
type: use-case
title: Manage repertoires and recoverable native ordered sets
status: active
primary-actor: ACT-MUSICIAN
bounded-context: BC-LIBRARY
governed-by: [BR-IDENTITY, BR-EDIT-GUARD, BR-DURABILITY]
uses-terms: [TERM-REPERTOIRE, TERM-SONG]
---

## Goal

Create, rename and remove repertoires without deleting songs. In native Android, organize explicit song order and inspect/restore retained set revisions, recoverably delete a set or separately purge it.

## Trigger

The musician requests the corresponding distinct action on personal content. A history read, reorder, delete, restore and purge are separate actions, not one compound command.

## Preconditions

The library is readable. Mutations require edit mode, complete valid values/references, expected revision and resolution of existing target identities. Native local operations require no login/backend. Existing service content retains its applicable authorization; local authority does not grant service access.

## Main Flow

1. The musician selects the action and supplies valid values; the product resolves the identified repertoire and requested scope.
2. For create/rename/order, enforce non-owning unique active-song membership and preserve song identities/content. In native Android retain the set's complete ordered-membership revision/history.
3. Enforce admission and acknowledge success only after the complete durable boundary and stable command receipt. Reopen and display the actual result.

## Alternative Flows

- Empty libraries and empty sets remain valid. External references remain external.
- Existing browser repertoire deletion removes the repertoire and memberships, not songs.
- Native set deletion removes active use/memberships but retains its own complete ordered history without expiry. Songs and independently owned resources remain unchanged.
- Native history inspection is read-only. A chosen valid historical revision restores as a new acknowledged revision, preserving intervening history.
- Restoring a recoverably deleted native set preserves set identity and its selected ordered membership only after current dependency/revision validation. Missing or permanently removed songs/resources are disclosed; refuse invalid/partial restore without inventing or resurrecting content.
- Native permanent purge is distinct from delete and has a separate destructive confirmation naming the set and irreversibility. Confirmed purge removes only retained set-owned live content/history and preserves a non-content receipt against stale resurrection. Never delete songs or independent resources. Declining changes nothing.
- Same-command retries reconcile the original receipt without duplicate revisions/effects. Ambiguous responses do not prove rollback.

## Failure Conditions

Unknown identities, invalid values, duplicate/dangling membership, unsupported data, stale revisions, failed persistence and performance-mode mutations refuse with actionable errors and preserve complete previous durable content/history. Failed restore does not activate a partial set. Failed/cancelled purge does not claim content was erased.

## Postconditions

The requested complete result is durably acknowledged or prior data remains unchanged with an honest refusal/failure. Non-owning membership, identity, order and all domain/durability invariants hold. Native deletion retains local recovery until confirmed purge; previously exported files are not promised erased.
