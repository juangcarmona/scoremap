---
id: SB-PERSIST-RECOVER
type: structured-behaviour
title: Reopen the complete acknowledged anonymous library
status: draft
illustrates:
  - UC-PERSIST
  - BR-DURABILITY
given:
  - A complete supported anonymous library revision 7 was durably acknowledged on the retained device origin
  - That revision contains songs, repertoires, memberships, identified shared sections and measures, harmonic events and two independently performed arrangements
  - The arrangements contain exact spelled pitches and octaves, timing, repeat references, optional hand metadata and device, range, layer and sound bindings
  - Acknowledged anonymous preferences and copied preset provenance are retained within their declared local scope
  - The application shell and retained local content remain available and connectivity is unavailable
  - There is no later acknowledged local revision and no private account unlock is requested
when: The musician reopens the application on that retained origin
then:
  - Complete acknowledged local revision 7 is reconstructed without requiring network access or private sign-in
  - Every song, repertoire, membership, section, measure, harmonic-event, arrangement, part and performed-event identity and order is preserved
  - Spelling, harmonic meaning, exact performed pitches and octaves, musical timing, repeats, optional hands and all owned bindings are preserved
  - Both arrangements retain their independent performed content against the same shared song form
  - Retained reminders, references, supported associated content, scoped preferences and copied version provenance remain intact
  - The application identifies the recovered content as acknowledged on this device rather than acknowledged by a private service
  - Opening creates no new content revision, performs no lifecycle transition and replays no pending write
  - No retained private draft, session material or another principal's resources are exposed
uses-terms:
  - TERM-LIBRARY
  - TERM-SONG
  - TERM-ARRANGEMENT
  - TERM-EVENT
  - TERM-VOICING
  - TERM-BACKUP
---

## Intent

Keep the accepted acknowledged-local-recovery identity and both original illustrates relationships while making complete arrangement reconstruction explicit. Recovery means all acknowledged values and associations, not merely the latest title or triad diagram.

## Boundaries

This single successful reopen reads a supported anonymous local revision. Unknown/unreadable versions must be preserved without replacement under SB-RECOVERY-INVALID, not silently repaired here. Reopening does not migrate, claim, import, restore deleted content or renew private authority. Supported associated content does not imply delivery of an independently pending renderer or unsupported attachment transfer. Browser eviction, an origin move and device loss cannot be recovered from absent storage by this example. Private second-session service reconstruction has its separate SB-PRIVATE-RECOVER and real authentication boundary; this local round trip is not that evidence. Physical-device acceptance, actual storage execution and production deployment remain separate.
