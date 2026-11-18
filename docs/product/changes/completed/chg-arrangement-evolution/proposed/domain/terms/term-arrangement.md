---
id: TERM-ARRANGEMENT
type: domain-term
title: Arrangement
status: draft
defined-in: BC-SKETCH
uses-terms: [TERM-SONG, TERM-VOICING, TERM-EVENT]
---

## Definition

An identified performed interpretation of one song's shared timeline, owning independent identified musical parts, voicings/note occurrences and instrument/range/layer bindings. A part carries a name and musical role; optional contextual hand metadata never defines its identity. A device is a physical configuration, not a part, hand or sound. Collections have no domain maximum of three.

## Distinguish From

Arrangement note/register/binding edits do not change another arrangement or harmonic identity. A split constrains assignment ranges; overlapping layers preserve distinct performed-event ownership even at the same pitch.

## Usage

One piano with left/right parts; two keyboards including one hand each; three keyboards with independent sounds; one keyboard split; overlapping layers; parts without one-to-one hand mapping are all valid. Multiple parts may share a keyboard. Sound metadata implies no hardware control. Future instrument visualizers consume instrument-agnostic pitches.
