---
id: SB-OFFLINE
type: structured-behaviour
title: Acknowledge a complete anonymous edit without connectivity
status: draft
illustrates:
  - UC-OFFLINE
  - BR-DURABILITY
  - BR-EDIT-GUARD
  - BR-STRUCTURE
given:
  - The installed application shell and complete supported anonymous library revision 6 are available on the retained device origin
  - Connectivity is unavailable and no private account authority is required for this anonymous content
  - The musician has opened song S and prepared one valid performed-note edit in an existing identified arrangement and part
  - Edit mode is active and all existing event, measure, part and binding references resolve
  - The complete candidate preserves all other songs, repertoires, memberships, spelling, timing and independent arrangements
  - The save command expects local revision 6 and the complete local transaction succeeds
when: The musician requests local retention of that complete candidate
then:
  - Exactly one complete valid local revision 7 is acknowledged without requiring network access or private sign-in
  - Revision 7 contains the intended note edit and every unchanged library field and association
  - Existing song, section, measure, event, arrangement and part identities and order remain stable
  - The complete committed revision remains recoverable on subsequent reopening of the retained origin without connectivity
  - Chord references and repertoire navigation remain available for the retained anonymous content
  - The visible result identifies local device durability and does not claim a private-service save or another-device recovery
  - No private record is exposed, claimed, unlocked or replayed by the anonymous save
  - No active-library, section-presence or private-song-retention transition occurs
uses-terms:
  - TERM-LIBRARY
  - TERM-SONG
  - TERM-ARRANGEMENT
  - TERM-EVENT
  - TERM-VOICING
---

## Intent

Preserve accepted network-free anonymous editing and complete acknowledged local continuity. Use one save stimulus with an already prepared candidate instead of combining reload, navigation, editing and saving into one ambiguous behaviour.

## Boundaries

Subsequent reopenability is a durable result, not a second command in the when clause; SB-PERSIST-RECOVER supplies the separate concrete reopen stimulus. FR-OFFLINE also retains explicit anonymous opening and browsing cases. This example does not start a private lease, enable persistent private offline editing or prove service durability. The connected private checkpoint still requires real connectivity and protected pending-work handling. External reference targets are not promised offline availability. Device eviction, origin changes and device loss retain their explicit backup/recovery limits. Local write failure and stale revisions have separate refusal examples preserving the previous durable revision. No execution, private login or complete later offline qualification is claimed by this text.
