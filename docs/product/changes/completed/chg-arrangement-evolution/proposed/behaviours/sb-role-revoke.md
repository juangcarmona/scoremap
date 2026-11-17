---
id: SB-ROLE-REVOKE
type: structured-behaviour
title: Refuse a former editor's write after downgrade to viewer
status: draft
illustrates:
  - UC-PERSIST
  - BR-ACCESS
  - BR-DURABILITY
  - BR-SESSION
given:
  - Owner A owns private song S at acknowledged content revision 21
  - Principal E previously held editor capability for S and retains a pending performed-note change based on revision 21
  - A's authorized downgrade of E to viewer has been durably acknowledged before E's write is admitted
  - E remains authenticated and in edit mode with valid command data but stale client knowledge of the former editor grant
  - The authoritative current song capability permits E to read but not change S
when: E submits the pending change expecting content revision 21
then:
  - The application refuses the mutation using E's current viewer capability
  - Cached editor status, edit mode and an otherwise valid expected content revision do not admit the write
  - S's music, acknowledged content revision and content history remain unchanged by the refused command
  - E's pending work remains protected and bound to E without being automatically replayed or reported as saved
  - The visible capability and refusal state reflect that E cannot save changes to S
  - Retention grants no additional right to expose, export or apply the pending record
  - No product lifecycle transition occurs
uses-terms:
  - TERM-SONG
  - TERM-PRINCIPAL
---

## Intent

Establish B09's next-operation permission boundary after an acknowledged downgrade. A content revision check cannot substitute for current authorization.

## Boundaries

The ordering is explicit: the grant change is committed before write admission. This does not prove concurrent revoke/write serialization and does not treat the downgrade itself as E's command. A viewer's currently authorized reading is distinct from protected-draft exposure/recovery, which requires fresh online checks. Complete revocation, disabled accounts and observed private-view lock need their own cases. No claim of instantaneous detection while disconnected is made.
