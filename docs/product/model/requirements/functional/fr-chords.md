---
id: FR-CHORDS
type: functional-requirement
title: Prepare spelled harmony and exact performed voicings
status: draft
derived-from:
  - UC-CHORDS
  - BR-CHORDS
  - BR-STRUCTURE
  - BR-EDIT-GUARD
  - BR-DURABILITY
  - BR-ACCESS
verification:
  - scenario-ref: SB-CHORD-ASSIGN
  - scenario-ref: SB-CHORD-MODIFY
  - scenario-ref: SB-CHORD-INVALID
  - scenario-ref: SB-KEYBOARD
  - scenario-ref: SB-NOTATION
  - scenario-ref: SB-VOICING
  - scenario: With an existing spelled arrangement and acknowledged preference, select Latin-only notation; symbols, note lists, builders, saved voicing choices, keyboard and accessible labels use fixed-name solfege while musical identities, pitches and other principals' preferences remain unchanged.
  - scenario: With dual notation using Latin primary, select Anglo-American primary; every dual label reverses its primary representation without changing spelling, octave, timing or musical content.
  - scenario: With Latin-only notation active, select Anglo-American notation and acknowledge the preference; reopening uses C D E F G A B labels while the stored arrangement is musically identical.
  - scenario: With a valid notation preference and unchanged musical content, submit an unsupported notation mode; refuse the setting and retain the previous preference and music.
  - scenario: With a valid existing harmonic event in edit mode, select C major-seventh; immediately preview C E G B and pitch classes 0 4 7 11 while preserving event identity, timing and part bindings.
  - scenario: With an F-sharp major harmonic event, request its theoretical preview; return F-sharp A-sharp C-sharp with the original spelling rather than substituting G-flat names.
  - scenario: With a dominant-seventh identity, select compatible flat-ninth and sharp-eleventh alterations; the preview contains each altered degree once and does not retain an additional natural ninth or eleventh.
  - scenario: With a valid existing event, submit an unknown quality; refuse without changing its identity, pitches, timing, bindings or last acknowledged revision.
  - scenario: With an existing event and a valid uncommitted pitch preview, cancel the builder edit; restore the pre-edit music and bindings without creating a content revision.
  - scenario: With a valid reversible performed-pitch edit and no intervening conflicting change, request undo; restore the prior performed pitches without changing the harmonic identity or other parts.
  - scenario: With a known harmonic identity and a new non-chord performed tone not yet reconciled, request commit; refuse until the musician explicitly reconciles the custom voicing, retaining the prior acknowledged content and editable preview.
  - scenario: With manually selected pitches that have multiple plausible chord identifications, request identification; show the candidates as ambiguous without selecting an identity or rewriting the performed notes.
  - scenario: With manually selected pitches for which no catalogue chord matches, request identification; show an honest unknown result and retain the custom performed pitches without inventing a chord.
  - scenario: With an ambiguous candidate list and an existing event, explicitly select one valid candidate; change only the intended harmonic identity while preserving the event identity, timing and independent part bindings.
  - scenario: With a named reusable voicing already copied into an arrangement, edit the independently owned preset; its new version does not change the arrangement's copied pitches or other arrangements.
  - scenario: With a performed pitch at the upper accepted bound, request an octave increase beyond that bound; refuse and retain the pitch, harmonic identity and acknowledged revision.
uses-terms:
  - TERM-CHORD
  - TERM-SECTION
  - TERM-EVENT
  - TERM-VOICING
  - TERM-ARRANGEMENT
  - TERM-PRINCIPAL
---

## Requirement

The product MUST retain ordered major/minor chord preparation with natural, single-sharp and single-flat roots while admitting exactly the finite quality, extension, alias and compatible-alteration catalogue in BR-CHORDS. It MUST preserve diatonic spelling separately from pitch-class equivalence, derive theoretical degrees independently of performed octaves, distinguish explicit slash bass from inversions, and refuse unsupported or contradictory combinations without coercion. Theoretical preview MUST update immediately in the real song editor. C major-seventh MUST yield C/E/G/B; derived spelling MUST retain required accidentals rather than silently respelling enharmonically.

Musicians MUST be able to select Anglo-American, fixed-name Latin and dual notation with either primary. Every musical label MUST follow the selected mode consistently, including chord symbols, note lists, selectors, theoretical previews, exact-pitch keyboard labels, saved voicing choices, editing/performance views and accessible names. Octaves and accidentals MUST remain explicit where relevant. Preference changes MUST NOT rewrite harmonic identity, played pitches, musical spelling, timing or another principal's preference. Preference persistence and precedence MUST follow BR-CHORDS: documented Anglo-American fallback, separate anonymous preference and acknowledged principal preference, with no implicit transfer on login or account switch. A pending preference MUST NOT be misreported as acknowledged.

The integrated builder MUST support root/quality/extension selection, exact-key addition/removal, per-note register/octave changes, valid inversions and alternative voicings, immediate preview, explicit cancel and reversible edits. Pointer, touch and keyboard operation MUST provide equivalent musical actions without requiring internal notation syntax or numerical pitch entry. The piano MUST have correct chromatic geometry and configurable position/range with two- or three-octave views; each selected performed pitch MUST have an individual pitch-and-octave label. Theoretical reference highlights MUST remain distinguishable from exact played notes. View changes MUST NOT transpose, erase or duplicate music, and out-of-view pitches MUST remain identifiable. Valid absolute pitch bounds and spelling/octave consistency MUST follow BR-CHORDS.

Changing a voicing, register or inversion MUST preserve harmonic identity unless the musician explicitly selects a harmonic change. Editing an existing event MUST retain its stable identity, musical position/duration, part bindings and other arrangement data unless deliberately changed. Incompatible added tones MUST require explicit reconciliation; candidate detection MUST show supported candidates, ambiguity or unknown rather than automatically reharmonizing. A suggestion changes identity only through explicit selection. Silence MUST NOT be fabricated into a chord.

Musicians MUST be able to name, retain and reuse custom voicings. A preset MUST remain independently principal-owned and versioned; applying it MUST copy its content and version provenance into the selected arrangement. Later edits/deletion of the preset MUST NOT mutate previously prepared arrangements. All content commits MUST also satisfy edit admission, current private-resource capability where applicable, complete validity and the declared durable acknowledgement boundary. Failed, cancelled, unauthorized and out-of-range operations MUST preserve prior acknowledged music and never imply a successful lifecycle transition.

## Rationale

A chord's harmonic meaning, a musician's exact performed pitches and the language used to display them are different things. Keeping them separate allows realistic preparation without losing existing triads, event associations or trust in the piano reference.

## Piano-first two-hand editor

The editor MUST provide an 88-key A0–C8 orientation and an enlarged, navigable keyboard with operable touch targets for selecting exact pitches across that range. Left and right hand selections MUST remain independently identifiable and reviewable together, including notes outside the current enlarged range. An explicit save MUST obey the declared atomic commit boundary and all existing admission, conflict, authorization and durability rules; cancel MUST preserve acknowledged music.

A compact staff MUST show the selected pitches with correct clefs, known key signature, accidentals and ledger lines or explicit octave indications. Staff note colors and complete selected white and black piano keys MUST use the documented octave mapping, with text or other non-color cues for pitch and hand. The staff MUST NOT fabricate a key signature, pitch, duration or performed note. The representation of a single chord MUST use compact horizontal space.

## Melodic phrase preparation

The musician MUST be able to enter, review, change and remove an ordered sequence of exact pitched notes for a passage, including explicit note durations and rests when supplied, and identify the associated hand or part. Selection through the enlarged piano MUST update the synchronized score and piano preview. The editor MUST preserve note order, actual register and supplied timing; when timing has not been supplied it MUST NOT invent a precise rhythm. Save, cancel, invalid notes and conflicts obey the same guarded, authorized and durably acknowledged boundaries as other musical edits.
