---
id: SB-PDF-NAVIGATE
type: structured-behaviour
title: Navigate and remember PDF pages
status: active
illustrates:
  - UC-PDF
  - BR-PDF
  - BR-DURABILITY
  - BR-EDIT-GUARD
given:
  - A readable PDF with at least two pages is open
when: The musician navigates forward, backward and with a horizontal swipe
then:
  - Each navigation stays within the page bounds
  - The current page is remembered when the song is reopened
  - Performance mode permits page navigation without modifying musical content
---

## Intent

Navigate and remember PDF pages.

## Boundaries

Clauses describe observable product results. All preconditions and outcomes are conjunctive; alternatives are separate behaviours. Applicable rules supply guards and invariants. Executable evidence is external to the product model.
