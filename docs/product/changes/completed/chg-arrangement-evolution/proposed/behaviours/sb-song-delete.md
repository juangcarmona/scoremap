---
id: SB-SONG-DELETE
type: structured-behaviour
title: Remove one private song from active use while another remains
status: draft
illustrates:
  - UC-SONGS
  - BR-IDENTITY
  - BR-EDIT-GUARD
  - BR-DURABILITY
  - BR-ACCESS
  - BR-SESSION
given:
  - Current owner A is authenticated and authorized to delete private active song S
  - A's declared library contains exactly two active songs S and T
  - S has complete acknowledged content at revision 7 with arrangements, sections, performed events, attachments and recoverable history
  - S has repertoire memberships and editor and viewer grants
  - Edit mode is active and the valid delete command expects revision 7 with a stable retry identity
  - Current permission and revision admission remain valid through a successful complete durable transaction
when: A confirms deletion of S
then:
  - The acknowledged result removes S from active song lists and ordinary consultation
  - S's memberships disappear while its repertoires remain
  - T and its content, grants, memberships and revision remain unchanged
  - Active-library presence remains POPULATED because T remains active
  - S's complete owned content and history remain retained in DELETED state rather than erased
  - S's collaborative grants are invalidated and former editors and viewers have no deleted-content access
  - Deleted content is available only to the current owner after fresh online authorization
  - Independently owned reusable resources remain unchanged
  - The complete deletion revision and retry receipt are acknowledged only after commit
covers-transition:
  lifecycle: LC-LIBRARY
  transition: DELETE
uses-terms:
  - TERM-SONG
  - TERM-LIBRARY
  - TERM-ARRANGEMENT
  - TERM-PRINCIPAL
  - TERM-REPERTOIRE
  - TERM-ATTACHMENT
---

## Intent

Preserve the accepted nonfinal-song deletion identity and LC-LIBRARY DELETE edge while making private active removal, retained owned history and unchanged other songs explicit. Acknowledged removal from active use must not be confused with permanent erasure.

## Boundaries

This is one successful current-owner private deletion. Its single typed coverage edge is library DELETE; the coincident retention change is an asserted outcome, not a second covers-transition field. SB-SONG-RETAIN separately covers retention DELETE. Failure, stale revision, editor refusal and delete/restore/purge races have separate FR-SONGS examples; they perform no successful transition. Anonymous deletion continues to remove its current local owned data and memberships at the existing complete local boundary under BR-IDENTITY; private history retention is not retroactively claimed for it. Attachment retention does not implement an independently pending rendering or transfer capability. Deletion neither purges exported copies/operator backups nor changes another song's section-presence state. No executed transaction or browser evidence is asserted here.
