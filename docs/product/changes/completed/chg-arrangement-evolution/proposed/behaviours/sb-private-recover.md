---
id: SB-PRIVATE-RECOVER
type: structured-behaviour
title: Read the complete acknowledged song from a second authorized session
status: draft
illustrates:
  - UC-PERSIST
  - BR-DURABILITY
  - BR-ACCESS
  - BR-SESSION
given:
  - Owner A's private song S has acknowledged service revision 13 containing shared form and two independently performed arrangements
  - A second browser session has no local copy of S
  - That session has completed real sign-in as the same stable provider subject and tenant/issuer as A
  - The service has freshly confirmed that principal's current read permission for S
  - The service is reachable and revision 13 remains the current acknowledged revision
when: A opens S in the second session
then:
  - The session reconstructs complete acknowledged revision 13 from the authorized service result
  - Song, section, measure, harmonic-event, arrangement, part and performed-event identities and order are preserved
  - Root spelling, theoretical identity, exact performed pitches and octaves, timing, repeats, hand metadata and device/range/layer bindings are preserved
  - Each arrangement remains an independent performed interpretation of the same shared song form
  - A's separately acknowledged notation preference applies without rewriting the musical content
  - No other principal's preferences, private resources or pending drafts are exposed
  - No retained pending write is automatically replayed and no new content revision is created by opening the song
uses-terms:
  - TERM-SONG
  - TERM-ARRANGEMENT
  - TERM-EVENT
  - TERM-VOICING
  - TERM-PRINCIPAL
---

## Intent

Establish B07's genuine authenticated reconstruction boundary. A private library must be recoverable beyond the original browser's retained storage, with the entire arrangement meaning intact.

## Boundaries

This is a successful current read, not an anonymous claim, imported ownership decision, deleted-song restore or pending-draft recovery. It performs no library-presence, structure-presence or song-retention transition. Same-principal draft recovery additionally requires current write capability and explicit revision reconciliation before applying work. A matching email is not the principal precondition. Local round trips and fabricated sign-in do not establish this cross-session result; execution evidence is separate.
