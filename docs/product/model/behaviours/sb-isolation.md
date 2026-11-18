---
id: SB-ISOLATION
type: structured-behaviour
title: Refuse an independent owner's read of another private song
status: draft
illustrates:
  - UC-PERSIST
  - BR-ACCESS
  - BR-IDENTITY
given:
  - Stable principal A owns private active song S and its identified arrangement P
  - Independent stable principal B is authenticated and owns a different song T
  - B has no grant for S and knows the identities of S and P
  - The request reaches the application authorization boundary without relying on visible navigation controls
when: B requests the contents of arrangement P belonging to S
then:
  - The application refuses the read without returning S's private content or confirming private descriptive details
  - No arrangement, note, reference, attachment, history or personal-resource content from A is exposed in the result
  - B's ownership of T provides no capability for S or P
  - S, P, T, their grants, acknowledged revisions and retained recovery records remain unchanged
  - No product lifecycle transition occurs
uses-terms:
  - TERM-SONG
  - TERM-ARRANGEMENT
  - TERM-PRINCIPAL
---

## Intent

Make B08's independent-owner isolation concrete for a guessed nested identity. Authentication and ownership of another resource must not become a global-role shortcut.

## Boundaries

This is one refused nested read, not a conjunction of separate list/write/delete/history/export commands. Those operations, forged ownership, disabled principals and requests with no session require separate refusal examples and evidence under the same capability rule. The example prescribes no transport status code or existence-disclosure distinction between absent and inaccessible resources. A hidden control alone does not establish refusal at the application boundary.
