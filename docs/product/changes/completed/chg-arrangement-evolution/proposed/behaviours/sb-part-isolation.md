---
id: SB-PART-ISOLATION
type: structured-behaviour
title: Add a fourth assigned part without altering existing music
status: draft
illustrates:
  - UC-SECTIONS
  - BR-STRUCTURE
  - BR-IDENTITY
  - BR-EDIT-GUARD
  - BR-ACCESS
  - BR-DURABILITY
given:
  - Owner A has current write capability for song S and edit mode is active
  - S has identified shared form and arrangement R with three independent parts assigned to three keyboards
  - Each existing part has identified performed events, exact pitches, timing, register, range and sound metadata
  - R also contains an unassigned valid fourth keyboard configuration K4 within accepted pitch bounds
  - Another arrangement Q references S's form independently
  - A supplies a valid new part specification P4 with its own name and musical role, no required hand assignment and a binding to K4
  - The supplied P4 note events reference existing valid form positions and fit K4's physical range
  - Expected revision is current and the complete authorized commit succeeds
when: A adds the specified fourth performed part P4 with its K4 binding to R
then:
  - R contains four independently identified parts and four assigned keyboard configurations
  - P4 retains its own name, role, note identities, pitches, timing and K4 binding without being forced into a left or right hand
  - Every prior part's identity, performed content, register, sound metadata and bindings remain unchanged
  - No prior note event is cloned, merged, deleted or transposed by adding P4
  - All existing keyboard ranges and configurations remain unchanged
  - S's shared sections, measures, harmonic events, repeats and ordering remain unchanged
  - Q and other songs remain unchanged
  - The complete updated song revision is acknowledged after commit without implying a separate personal-resource acknowledgement
uses-terms:
  - TERM-SONG
  - TERM-ARRANGEMENT
  - TERM-EVENT
  - TERM-VOICING
---

## Intent

Make B04 concrete and prevent the initial two/three-keyboard presentation from becoming a domain limit. One added part and its declared binding must leave prior performed interpretations intact.

## Boundaries

K4 already exists as an unassigned arrangement configuration; the single stimulus adds one specified part and binding, not an unrelated device-creation command sequence. This example does not itself demonstrate all six split/layer/hand scenarios, which have distinct FR-SECTIONS acceptance examples. It does not change section or library presence or song retention, and therefore claims no transition in those lifecycles. Invalid references, excluded physical pitches, unauthorized operations and failed atomic commits must refuse separately without partial addition. Core support beyond three does not promise infinite device capacity or measured viewport performance. Execution and full round-trip evidence remain separate.
