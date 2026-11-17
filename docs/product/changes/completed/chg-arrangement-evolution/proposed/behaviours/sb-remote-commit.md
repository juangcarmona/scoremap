---
id: SB-REMOTE-COMMIT
type: structured-behaviour
title: Acknowledge one complete private song update
status: draft
illustrates:
  - UC-PERSIST
  - BR-DURABILITY
  - BR-ACCESS
  - BR-EDIT-GUARD
given:
  - Owner A is authenticated through real sign-in and currently authorized to change private song S
  - Song S has acknowledged service revision 12 and an existing identified arrangement with two independently voiced parts
  - Edit mode is admitted and a complete valid candidate changes the performed pitches and device bindings without changing the shared form or other songs
  - The save command identifies revision 12 as expected and carries a stable retry identity
  - Authorization remains valid through commit and the complete service transaction succeeds
when: A requests that candidate be saved to the private library
then:
  - The service acknowledges exactly one new complete revision 13 and its retry receipt after durable commit
  - Revision 13 contains both parts, their exact spelled pitches and octaves, bindings and every unchanged song-owned field
  - Revision 12 remains recoverable in authorized history
  - The returned acknowledgement identifies the committed revision rather than claiming separately pending personal preferences were saved
  - Existing song, section, arrangement and part identities remain stable and other songs remain unchanged
  - The visible state distinguishes service-acknowledged revision 13 from work retained only on the device
  - A newer interaction draft is not replaced by this acknowledgement
uses-terms:
  - TERM-SONG
  - TERM-ARRANGEMENT
  - TERM-VOICING
  - TERM-PRINCIPAL
---

## Intent

Make B06's private-save success concrete at the acknowledged service boundary rather than treating a local write as remote acceptance. A complete song revision includes independently performed parts and configuration together.

## Boundaries

This updates an existing song without changing section presence or library presence; it claims no LC-LIBRARY or LC-STRUCTURE transition. It does not create a save-status lifecycle. Failure, stale revision, ambiguous response, expired authority and concurrent revocation are separate examples, not alternative successful outcomes here. Personal preferences and reusable resources have separate commit receipts; no device/service transaction is implied. Executed service and persistence evidence remains external to this definition.
