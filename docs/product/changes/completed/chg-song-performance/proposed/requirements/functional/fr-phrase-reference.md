---
id: FR-PHRASE-REFERENCE
type: functional-requirement
title: Prepare phrases and compare score and piano
status: draft
derived-from:
  - UC-CHORDS
  - UC-CONSULT
  - UC-BACKUP
  - BR-STRUCTURE
  - BR-EDIT-GUARD
  - BR-ACCESS
  - BR-DURABILITY
verification:
  - scenario: With an ordered phrase and explicitly supplied timing, save and reopen; retain pitches, order, timing and hand association.
  - scenario: With timing unknown, consult the phrase without inventing a precise rhythm.
  - scenario: Select a prepared phrase note; the score and piano identify the same pitch and octave.
uses-terms: []
---

## Requirement

The musician MUST be able to enter, review, change and remove an ordered sequence of exact pitched notes for a passage, including explicit note durations and rests when supplied, and identify the associated hand or part. Selection through the enlarged piano MUST update the synchronized score and piano preview. The editor MUST preserve note order, actual register and supplied timing; when timing has not been supplied it MUST NOT invent a precise rhythm. Save, cancel, invalid notes and conflicts obey the same guarded, authorized and durably acknowledged boundaries as other musical edits.

For prepared melodic phrases, the product MUST offer a synchronized staff and piano reference where selecting a represented note identifies its exact pitch and octave on the piano and in the staff, with consistent octave colors and accessible non-color labels. The product MUST NOT claim score content or a transcription exists when it is unavailable.


Portable transfer MUST preserve the declared song key, lyric text and its explicit chord associations, section cues and prepared phrase data, including exact pitches, order, timing when present and hand ownership. An unsupported version or content capability MUST be refused before activation rather than silently discarding these fields. Existing supported exports and imports MUST retain their documented migration and recovery guarantees.

Existing timed note events MUST continue to satisfy BR-STRUCTURE; an untimed phrase MUST NOT be represented as a falsely timed event.

## Rationale

This capability realizes the approved musician journey while retaining existing access, integrity, readability and durability boundaries.
