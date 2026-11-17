---
id: TERM-EVENT
type: domain-term
title: Musical event
status: draft
defined-in: BC-SKETCH
uses-terms: [TERM-SECTION, TERM-CHORD, TERM-VOICING]
---

## Definition

An identified musical occurrence with explicit position and positive duration. Song-owned harmonic events refer to measures and chord identities; arrangement-owned performed note events refer to the shared form and their owning part. Position is musical time, never a list index used as identity.

## Distinguish From

Consultation selection and repeat occurrence are transient context. Silence is absence of performed events, not an invented chord.

## Usage

Stable references preserve identity/timing/bindings during builder edits. Repeats reuse events through occurrence coordinates. Timing bounds and atomic reconciliation of shared-form changes are governed by BR-STRUCTURE.
