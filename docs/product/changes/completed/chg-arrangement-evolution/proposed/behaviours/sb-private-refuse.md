---
id: SB-PRIVATE-REFUSE
type: structured-behaviour
title: Refuse retained-draft recovery after song access is revoked
status: draft
illustrates:
  - UC-PERSIST
  - UC-OFFLINE
  - BR-SESSION
  - BR-ACCESS
  - BR-DURABILITY
given:
  - Principal E previously held editor permission for private song S owned by A
  - E has an unacknowledged draft retained as a protected principal-bound record after the prior session ended
  - A has durably revoked E's access to S
  - E completes real reauthentication with the same stable provider subject and tenant or issuer that owns the retained record
  - The service is reachable and a fresh online authorization check confirms that E has no current permission for S
  - The retained record has not been exposed or replayed
when: E requests recovery of that retained draft
then:
  - Recovery is refused because current resource permission is absent despite the matching authenticated principal
  - No retained musical plaintext, song content, history or private descriptive details are exposed
  - The record remains protected and bound to E rather than being exported, imported into another account or discarded
  - No queued command is replayed and no private-library save is reported
  - S's acknowledged content, revision, history and current grants remain unchanged
  - A cached role, previous lease and ownership of the protected record confer no read, export or write capability for S
  - The refusal does not prevent E from explicitly deleting the local protected record without reading it
  - The original anonymous library remains unchanged
  - No product lifecycle transition occurs
uses-terms:
  - TERM-PRINCIPAL
  - TERM-SONG
  - TERM-LIBRARY
---

## Intent

Make retained work distinct from permission. Even the correct reauthenticated principal cannot recover private musical content after current song access is revoked. Retention preserves the work without laundering an old grant into fresh authority.

## Boundaries

The single stimulus requests recovery; it does not also request export, replay or deletion. Their absence is a refusal invariant, and the option of explicit protected-record deletion does not claim that deletion occurred. Successful same-principal recovery with current permission is a separate FR-OFFLINE case requiring current revisions and explicit reconciliation. Cross-account requests, disabled principals, voluntary logout with failed save/export and concurrent revocation have separate retained requirement examples. This case is online and does not claim instantaneous offline revocation detection. Neither this refusal nor session locking changes active presence, structure or song retention. Real identity, authorization and protected-storage execution remain separate evidence.
