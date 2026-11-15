---
id: SB-PDF-ATTACH
type: structured-behaviour
title: Attach and reopen a local PDF
status: active
illustrates:
  - UC-PDF
  - BR-PDF
  - BR-DURABILITY
  - BR-EDIT-GUARD
given:
  - Edit mode is active
  - A readable device PDF is selected for a song
when: The musician attaches the PDF and later reopens the song offline
then:
  - The PDF remains associated with that song
  - Readable local pages are available inside ScoreMap
  - Sketch and PDF can be switched without data loss
---

## Intent

Attach and reopen a local PDF.

## Boundaries

Clauses describe observable product results. All preconditions and outcomes are conjunctive; alternatives are separate behaviours. Applicable rules supply guards and invariants. Executable evidence is external to the product model.
