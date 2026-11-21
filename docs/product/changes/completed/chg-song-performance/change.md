---
id: CHG-SONG-PERFORMANCE
type: product-change
title: 'Song sheet and exact-pitch piano preparation'
status: applied
base-revision: '96204e09397597a1240dff83cdc99c125c58bda0'
operations:
  add:
    - FR-SONG-SHEET
    - FR-PIANO-SCORE
    - FR-PHRASE-REFERENCE
  modify: []
  remove: []
---

## Problem

The existing consultation distributes limited tablet space between navigation, configuration and small theoretical diagrams. It does not present the complete song in a musician-readable sheet, the user's exact two-hand positions across the piano, or a compact score-to-piano reference for learning phrases. Selecting pitches across the full instrument and associating lyrics with chord changes need a coherent preparation journey.

## Intended Product Outcome

A focused song sheet communicates known key, sections, chords, repetitions and lyrics when present, with optional notes and piano positions. A musician prepares exact left- and right-hand notes on an accessible full-range piano, reviews the same notes on a compact grand staff with the known key signature, can enter and edit ordered notes and explicit timing for melodic phrases, and can compare prepared phrases between score and piano. Octave colors are consistent across the representations; they never replace exact labels or hand ownership. Existing permissions, edit guard, durability, portable transfer and musical identities remain authoritative.

## Rationale

The musician learns notes first, then the song's sections and repeats, and subsequently refines cues and variations. The sheet must support those stages without making navigation chrome compete with music. A full instrument overview with a legible editable range makes all 88 keys reachable. The score complements the piano and must not pretend to know missing notes, rhythm or key.

## Affected Product Areas

Song consultation and structured lyrics; chord and two-hand preparation; score and phrase consultation; readability and accessibility; complete portable transfer.

## Visual References

The following design references document the owner's approved direction, not implemented functionality or a substitute for the requirements:

- [Selected focused song sheet and wide chord keyboards](../../../../design/ideal-performance-view.md) and its synthetic illustration; the original user's private arrangement stays outside Git.
- [Full 88-key octave color map](../../../../design/song-performance/piano-88-colores.png), with authoritative exact values in [piano octave colors](../../../../design/piano-octave-colors.md).
- [88-key chord editor with compact staff](../../../../design/song-performance/editor-88-partitura-compacta.png): hand selection, orientation, enlarged piano and compact staff.
- [Score and piano phrase comparison](../../../../design/song-performance/comparar-partitura-piano.png): a synthetic phrase, not a transcription of a real song.

These references express the approved direction rather than fixed screen dimensions; accessible touch, valid musical notation and safe data boundaries take precedence over incidental mockup details.

## Open Questions

None block product approval. Exact implementation choices, including supported score input formats and sequencing, are delivery decisions and must be stated honestly rather than implied to exist.

## Product Acceptance

The owner approved the direction and this Product Change on 2026-11-21. The definition captures the mandatory song information, lyrics, optional cues, simultaneous two-hand exact pitches, 88-key navigation, compact accurate staff, synchronized phrase comparison, octave palette and preservation of private data. Approval and application do not themselves mean the product is implemented, merged, tested or deployed.

## Out of Scope

Automatic transcription, guessed songs or lyrics, audio generation, hardware integration and public release are not assumed. This definition does not authorize publishing private arrangements or credentials, nor prescribe a particular score-import format.
