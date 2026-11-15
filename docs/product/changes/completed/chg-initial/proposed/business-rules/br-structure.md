---
id: BR-STRUCTURE
type: business-rule
title: Valid ordered sections
status: active
applies-to:
  - BC-SKETCH
---

## Rule

Each section belongs to exactly one song. Section order is an exact permutation of its existing unique IDs. Repeats are integers from 1 through 99; repeating a section preserves one section identity and repeats its complete chord sequence. Empty songs and empty chord sequences are valid.

## Rationale

Protect the musician’s content and preserve trustworthy consultation.

## Examples

Concrete accepted and refused outcomes are authored in the related Structured Behaviours.

## Exceptions

None.
