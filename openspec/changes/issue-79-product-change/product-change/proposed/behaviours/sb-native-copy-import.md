---
id: SB-NATIVE-COPY-IMPORT
type: structured-behaviour
title: "Import an independent complete native set into existing local music"
status: draft
illustrates:
  - UC-BACKUP
  - BR-BACKUP
  - BR-IDENTITY
  - BR-EDIT-GUARD
  - BR-DURABILITY
  - BR-STRUCTURE
given:
  - "Native installation B is offline with no signed-in account and a POPULATED library containing unrelated song X and its complete acknowledged history"
  - "A supported portable file from independent installation A contains current acknowledged ordered set R with two songs S and T, shared required musical definitions and source revision provenance"
  - "The complete valid graph includes known key, sections and chord/lyric associations, cues, phrase data, exact spelled pitches and registers, explicit timing and repeats, independent arrangements and parts, hands, musical bindings and required owned PDF bytes with verified integrity"
  - "The file contains no private revision history, app preferences, actual hardware authority, usable sessions, credentials or authority-conferring grants; external references remain explicit links"
  - "Whole-envelope version, capability, size, identity, reference, musical and attachment validation has succeeded and the musician sees a complete independent-copy preview with one consistent fresh identity mapping"
  - "Edit mode is active, the command expects the current destination revision and has a stable retry identity, and the complete selected graph plus required attachment publication can commit durably"
when: "The musician confirms that previewed native set import into B"
then:
  - "The active library remains POPULATED through IMPORT-POPULATED with new independent editable copies of R, S, T and every required copied definition"
  - "Every copied local identity and reference uses the confirmed fresh mapping, shared dependencies remain shared within the imported graph and exact set order is preserved"
  - "Every declared musical field, supported association and required PDF byte with its integrity reference reconstructs in B without source-device paths or invented notes or timing"
  - "The whole selected graph, complete required attachments, initial independent destination histories, mapping and command receipt activate atomically with one honest local acknowledgement"
  - "X and every pre-existing destination song, set, resource, attachment and history remain unchanged; no replacement, overwrite, merge or same-identity update occurs"
  - "The source file remains unchanged and source revision provenance remains informational rather than ownership or runtime authority"
  - "The original command receipt identifies this import result and mapping for idempotent reconciliation; a deliberately new confirmed import remains a distinct copy command"
  - "The imported music is editable and exportable under the normal local guards without login or backend; no delivery through an unavailable messaging route is claimed"
covers-transition:
  lifecycle: LC-LIBRARY
  transition: IMPORT-POPULATED
uses-terms:
  - TERM-BACKUP
  - TERM-LIBRARY
  - TERM-SONG
  - TERM-REPERTOIRE
  - TERM-ARRANGEMENT
  - TERM-EVENT
  - TERM-VOICING
  - TERM-ATTACHMENT
---

## Intent

Use the existing active-song import edge for a complete native independent-copy set transfer, with full musical and PDF content preserved alongside unrelated destination music.

## Boundaries

This is one successful confirmed import and one LC-LIBRARY IMPORT-POPULATED edge. It is neither anonymous-browser replacement nor private claim. Actual edit/re-export, repeated-command reconciliation, cancellation, malformed or incomplete input and storage/attachment failures need separate execution evidence. An empty native set without active songs does not imply this transition. This authored behaviour does not establish independent-device acceptance or a supported messaging route.
