---
id: FR-CONSULT
type: functional-requirement
title: Consult synchronized arrangements without changing music
status: draft
derived-from:
  - UC-CONSULT
  - BR-EDIT-GUARD
  - BR-STRUCTURE
  - BR-CHORDS
  - BR-ACCESS
  - BR-SESSION
  - CON-PLATFORM
verification:
  - scenario-ref: SB-PERFORMANCE
  - scenario-ref: SB-PERFORMANCE-REJECT
  - scenario-ref: SB-EDIT-RESUME
  - scenario-ref: SB-NAVIGATION
  - scenario-ref: SB-NOTATION
  - scenario: With two assigned keyboards and an active event followed by an event with a silent second part, select the latter event; both views show the same new context and the second view clears its previous played highlights without changing music.
  - scenario: With a selected event containing valid played pitches outside one keyboard's visible viewport, open its consultation view; identify those pitches and their part without clipping, transposing or falsely showing them as in-range keys.
  - scenario: With a repeated section and distinct occurrence coordinates, select the second occurrence; every relevant keyboard shows that occurrence's shared measure/event context while the stored section and event identities remain unchanged.
  - scenario: With a selected event removed by an acknowledged authorized update, refresh the consultation result; clear the now-invalid event selection and stale highlights, identify that the event is no longer available and leave the musician able to choose valid context without a content mutation.
  - scenario: With current private read permission and performance mode active, request a performed-note mutation directly; refuse at the application boundary and preserve all music, bindings and acknowledged revisions.
  - scenario: With several keyboard views in landscape touch-tablet consultation, select an event using touch; keep the relevant keyboards simultaneously readable with their own ranges, part labels and shared context, without changing musical content.
  - scenario: With the arrangement open at a narrow viewport and enlarged text at 200 percent, consult its assigned keyboard views; retain readable key proportions and labels using bounded keyboard scrolling or explicit view controls without page-level horizontal overflow or loss of controls.
uses-terms:
  - TERM-MODE
  - TERM-SONG
  - TERM-SECTION
  - TERM-EVENT
  - TERM-ARRANGEMENT
  - TERM-VOICING
---

## Requirement

The product MUST allow deliberate switching between editing and protected performance consultation without changing musical content. Consultation MUST make the song title, ordered sections, repeats, harmonic sequence, exact performed pitches, keyboard references and personal reminders immediately readable and support rapid song/context navigation. Performance mode MUST reject every musical content mutation, including indirect command paths and import, independently of whether the current private role permits editing. Returning deliberately to edit mode MUST NOT itself mutate music or grant a viewer write capability. Navigation and permitted page memory MUST remain distinct from musical edits.

One active song/arrangement section, repeat occurrence, measure and event context MUST drive every relevant keyboard view. Each view MUST show only its assigned parts' actual pitches for that context, with its own physical/view range, exact pitch/octave labels, part name and musical role. Silence MUST clear obsolete played highlights. Out-of-view notes MUST remain identifiable without becoming fabricated visible keys or being dropped from the music. Equal-pitch overlapping layers MUST remain attributable to their distinct parts. Theoretical references MUST remain distinguishable from performed notes, and selecting context MUST NOT copy or alter events. A removed selected event MUST clear its invalid selection and stale highlights, state its unavailability and permit valid reselection without a content write.

Notation mode and dual-primary preference MUST apply consistently to consultation symbols, note lists, piano labels and accessible names without changing stored meaning. Part labels and optional hand cues MUST not depend on color alone. Multiple keyboards MUST be readable together on landscape tablet; narrow views MUST use intentional view controls or bounded keyboard scrolling rather than distorted key geometry, unreadable proportions or page overflow. Pointer, touch and keyboard navigation MUST provide equivalent results with visible focus and screen-reader names/states. The product MUST meet WCAG 2.2 AA, retain readable controls at 200 percent text and preserve the existing minimum 48 CSS pixel touch targets.

Private consultation MUST require current resource-scoped read authority and obey the session-lock policy; hidden editing controls and cached roles MUST NOT substitute for authorization. Observed expiry/revocation MUST lock private content under BR-SESSION. The connected first private checkpoint MUST NOT claim persistent private offline consultation, while later qualified private consultation remains bounded by the protected resource lease. Anonymous offline consultation remains separate. Loading, empty, saving, unsaved, conflict, validation and authorization-failure states MUST be intelligible without claiming unacknowledged content is remotely saved.

## Rationale

A musician must see the intended pitches across all instruments at the same musical moment without accidentally editing them. Readability, consistent context and explicit authority make consultation trustworthy on tablet, phone and desktop.

## Focused song sheet and phrase reference

The product MUST offer a focused vertically scrollable song sheet with title, known key, ordered sections, chords, declared repeats and optional lyrics and notes; persistent application chrome MUST NOT dominate the tablet performance view. Chord changes MUST align with their associated lyric positions where supplied. Repeated harmonic loops and varying lyrics MUST be representable without inventing musical structure. The musician MUST be able to reveal exact performed piano positions for a chord and identify both hands, actual pitches and octaves without conflating them with theoretical harmony. Wide keyboards MUST preserve note identity outside the viewport, and use the approved octave palette on complete selected white and black key surfaces.

For prepared melodic phrases, the product MUST offer a synchronized staff and piano reference where selecting a represented note identifies its exact pitch and octave on the piano and in the staff, with consistent octave colors and accessible non-color labels. The product MUST NOT claim score content or a transcription exists when it is unavailable.

The musician MUST be able to prepare and edit a known song key, lyrics, explicit chord-to-lyric associations, section cues, and repeated-loop structure in edit mode. Lyrics and associations remain optional; missing data MUST remain visibly unknown or absent. Save and transfer MUST retain these values and their stable song, section and event associations subject to existing guards, revision and durable acknowledgement.
