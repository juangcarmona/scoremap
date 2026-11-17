---
id: BR-CHORDS
type: business-rule
title: Spelled bounded harmony and independent performed pitches
status: draft
applies-to: [BC-SKETCH]
uses-terms: [TERM-CHORD, TERM-VOICING]
---

## Rule

A root is A through G with at most one sharp or flat. Preserve spelling separately from pitch equivalence. The finite catalogue below defines all theoretical degrees; extensions include every listed lower degree, without implicit omissions. Voicings may explicitly omit theoretical tones without rewriting identity. Degrees are relative to the root's major scale; b/# lower/raise one semitone and degree spelling advances the diatonic letter. Base semitones are 1=0, 2/9=2/14, 3=4, 4/11=5/17, 5=7, 6/13=9/21, 7=11; b7=10, bb7=9. Retain derived accidentals, including multiple accidentals when required; do not respell enharmonically to conceal the degree.

| Canonical quality | Complete degrees | Accepted symbol aliases |
| --- | --- | --- |
| major | 1 3 5 | empty suffix, maj, M |
| minor | 1 b3 5 | m, min, - |
| diminished | 1 b3 b5 | dim, ° |
| augmented | 1 3 #5 | aug, + |
| suspended-second | 1 2 5 | sus2 |
| suspended-fourth | 1 4 5 | sus4, sus |
| fifth | 1 5 | 5 |
| major-sixth | 1 3 5 6 | 6, maj6 |
| minor-sixth | 1 b3 5 6 | m6 |
| major-sixth-ninth | 1 3 5 6 9 | 6/9, 69 |
| minor-sixth-ninth | 1 b3 5 6 9 | m6/9, m69 |
| dominant-seventh | 1 3 5 b7 | 7 |
| major-seventh | 1 3 5 7 | maj7, M7, Δ7 |
| minor-seventh | 1 b3 5 b7 | m7, min7 |
| half-diminished-seventh | 1 b3 b5 b7 | m7b5, ø7 |
| diminished-seventh | 1 b3 b5 bb7 | dim7, °7 |
| minor-major-seventh | 1 b3 5 7 | mMaj7, mM7 |
| augmented-seventh | 1 3 #5 b7 | aug7, +7 |
| augmented-major-seventh | 1 3 #5 7 | augMaj7, +maj7 |
| suspended-second-seventh | 1 2 5 b7 | 7sus2 |
| suspended-fourth-seventh | 1 4 5 b7 | 7sus4, 7sus |
| dominant-ninth | 1 3 5 b7 9 | 9 |
| major-ninth | 1 3 5 7 9 | maj9, M9 |
| minor-ninth | 1 b3 5 b7 9 | m9 |
| dominant-eleventh | 1 3 5 b7 9 11 | 11 |
| major-eleventh | 1 3 5 7 9 11 | maj11, M11 |
| minor-eleventh | 1 b3 5 b7 9 11 | m11 |
| dominant-thirteenth | 1 3 5 b7 9 11 13 | 13 |
| major-thirteenth | 1 3 5 7 9 11 13 | maj13, M13 |
| minor-thirteenth | 1 b3 5 b7 9 11 13 | m13 |
| major-added-ninth | 1 3 5 9 | add9 |
| minor-added-ninth | 1 b3 5 9 | madd9, m(add9) |

Only dominant-seventh/ninth/eleventh/thirteenth accept explicit b5, #5, b9, #9, #11, b13. One alteration per degree; distinct degrees may compose. Replace the natural selected degree rather than duplicate it; if that extension degree was absent, explicitly add its altered degree. No other quality/alteration combination is implied by a library dictionary. Reject contradictory degree selections and unknown quality/symbol; aliases map to one canonical identity.

An explicit slash bass is independently spelled; a non-chord bass is an additional specified bass, not a silent quality change. An inversion selects a chord-tone bass; register/played octave remains separate. Cmaj7 derives C/E/G/B at pitch classes 0/4/7/11; F# major derives F#/A#/C#, Gb major derives Gb/Bb/Db, Cdim7 derives C/Eb/Gb/Bbb. Independent degree expectations, not provider output alone, determine correctness.

Performed pitches MUST be consistent spelled pitch plus octave and absolute chromatic position in the inclusive 0..127 pitch range (C-1..G9, C4=60). This is a pitch bound, not MIDI I/O. Keyboard configured physical ranges and selected view are explicit; view changes cannot transpose, drop or duplicate events. Standard white/black geometry has no black key between E/F or B/C. Two- or three-octave interactive views permit range/position changes, label each selected pitch+octave and distinguish theoretical references from exact played notes. Outside-view notes remain identifiable.

Notation modes are Anglo-American C D E F G A B, fixed-name Latin Do Re Mi Fa Sol La Si, and dual with either primary. Accidentals and octave remain consistent everywhere, including accessible names. Default is Anglo-American; anonymous device preference is separate from authenticated principal preference. On login use the principal's acknowledged preference, with Anglo-American fallback if absent; anonymous preference transfers only by explicit choice. Current-session pending preference changes are displayed as pending and cannot overwrite another account. Switching labels never changes stored music or anyone else's preference.

Builder actions preview, cancel and undo explicitly. Existing event identity, time and bindings remain unless deliberately edited. Octave/inversion/voicing changes do not reharmonize; incompatible added tones require explicit reconciliation, such as retaining an acknowledged custom voicing, before commit. Detection presents candidates or unknown/ambiguous state; only explicit selection changes harmonic identity. Reusable preset application copies a named version, never a live mutable reference.

## Rationale

Separate harmonic meaning, performed intent and presentation so realistic preparation remains trustworthy.

## Examples

Cmaj7 performed C2/G2/E4/B4 retains C/E/G/B harmony. b9+#11 on dominant seventh is valid; b9+#9 on the same ninth degree is refused.

## Exceptions

None. No arbitrary interval dictionary or hardware behavior is admitted.
