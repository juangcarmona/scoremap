---
id: SB-PERSIST-RECOVER
type: structured-behaviour
title: Recover acknowledged local content
status: active
illustrates:
  - UC-PERSIST
  - BR-DURABILITY
given:
  - A complete library revision has been saved successfully
when: The musician reopens ScoreMap
then:
  - The last acknowledged songs, repertoires, memberships and sketch content are
    recovered
  - Stable identities and order remain unchanged
---

## Intent

Recover acknowledged local content.

## Boundaries

Clauses describe observable product results. All preconditions and outcomes are conjunctive; alternatives are separate behaviours. Applicable rules supply guards and invariants. Executable evidence is external to the product model.
