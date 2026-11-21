---
id: QR-INTEGRITY
type: quality-requirement
title: No silent loss across acknowledged recovery boundaries
status: draft
quality-attribute: integrity
applies-to:
  - JRN-PREPARE-PERFORM
verification:
  - scenario-ref: SB-NATIVE-SONG-CREATE
  - scenario-ref: SB-NATIVE-SONG-DELETE
  - scenario-ref: SB-NATIVE-SONG-RESTORE
  - scenario-ref: SB-NATIVE-COPY-IMPORT
  - scenario: With native complete songs, ordered sets, required PDF bytes and histories, restart without login/network; reconstruct every acknowledged field and attachment integrity without inventing a service acknowledgement.
  - scenario: With a native mutation or complete selected-graph import and storage or required-attachment publication failure, execute the command; preserve every previously acknowledged field and activate no partial result, reconciling an ambiguous outcome against its receipt.
  - scenario: With native acknowledged history and a current valid restore, restore as a new revision; preserve intervening revisions and refuse missing dependencies or stale revisions without partial activation.
  - scenario: With native recoverable deletion and a separately confirmed purge whose response is lost, retry that command; preserve unrelated music, reconcile the original non-content receipt and prevent stale restore resurrection.
  - scenario-ref: SB-PERSIST-FAILURE
  - scenario-ref: SB-PERSIST-CONFLICT
  - scenario-ref: SB-BACKUP-REJECT
  - scenario-ref: SB-REMOTE-COMMIT
  - scenario-ref: SB-PRIVATE-RECOVER
  - scenario-ref: SB-ISOLATION
  - scenario-ref: SB-ROLE-REVOKE
  - scenario: With a complete private song at revision r and a valid authorized update, fail the durable transaction before commit; preserve every field of r, create no partial revision and report no service acknowledgement.
  - scenario: With two valid private updates based on revision r, submit both concurrently; admit at most one next revision and refuse the stale update while preserving the latest acknowledgement and protected recoverable work.
  - scenario: With a committed private update whose response is lost, retry the same principal-bound command identity; reconcile its existing receipt without duplicating the update or its revision.
  - scenario: With a newer local interaction draft and an older successful save response, process that response; record its actual acknowledged revision without replacing the newer draft.
  - scenario: With a supported migration and a recovery copy, fail candidate activation; preserve the previous durable version and original source without reporting migration success.
  - scenario: With a complete acknowledged arrangement and a new authorized session containing no local copy, open the arrangement; reconstruct all identities, spelling, timing, performed pitches and bindings from the service without creating a revision.
  - scenario: With an owner revocation committed before an editor's write admission, submit the pending write; refuse without changing song content or history and retain only the permitted protected recovery record.
uses-terms:
  - TERM-LIBRARY
  - TERM-SONG
  - TERM-ARRANGEMENT
  - TERM-EVENT
  - TERM-VOICING
  - TERM-PRINCIPAL
  - TERM-BACKUP
---

## Requirement

Invalid, unauthorized, stale and failed operations MUST preserve the last acknowledged valid content at each declared commit boundary. Anonymous success MUST identify a complete atomic device revision. Native Android success MUST identify a complete atomic installation-local song/set or selected import-graph revision with required attachments, retained history and stable command receipt, without implying remote backup. Private success MUST identify a complete authorized service revision, recoverable history and retry receipt; a device write MUST NOT imply remote save. Shared form, all arrangements/parts/events, exact performed pitches and song-owned bindings/content MUST commit together under BR-DURABILITY. Separately owned preferences and reusable resources MUST have separate explicit acknowledgements.

Applicable authority, edit admission, complete validity and expected revision MUST remain independent mutation guards. Private permission changes MUST serialize with private writes; native installation-local authority requires no login or online check. Refusal MUST expose no unauthorized content, create no partial state and perform no lifecycle transition. An ambiguous response MUST remain unconfirmed until receipt reconciliation; a repeated command MUST NOT duplicate revisions. Stale responses MUST NOT replace newer drafts. Pending private work MUST remain protected under BR-SESSION, not become an unrestricted export after authority ends.

Acknowledged content MUST reconstruct completely after reopening at its declared boundary. Private-service content MUST additionally reconstruct from a second authorized session. Migration, transfer and restore MUST validate their full declared scope before activation and preserve recovery/source data on failure. Deleted private content/history MUST remain owner-only until distinct purge; native deleted song/set content and history MUST remain completely recoverable locally without expiry until separate explicit purge; restore MUST create a new revision preserving intervening history. Song restoration MUST NOT silently recreate obsolete grants or former set memberships. Native set restoration MUST validate the selected ordered membership against currently valid dependencies without inventing or resurrecting missing songs/resources. Purge receipts MUST prevent stale resurrection. No product result may imply one transaction across independent device and service stores.

## Measurement

For every declared success, refusal and boundary case, compare independent complete before/after values, not just counts or displayed status. The conformance threshold is zero lost or altered acknowledged fields outside the intended command, zero partial acknowledged commits, zero duplicated retry effects, zero unauthorized disclosures/mutations and zero false success acknowledgements. Assert all identities, ordering, spellings, exact pitches/octaves, timing/repeats, independent parts, bindings, memberships and scoped preference ownership.

Exercise local write/quota failure, service transaction failure, ambiguous response, two writers at the same revision, permission-change races, unsupported version, migration activation failure, complete export/import and restore/purge reconciliation at their actual boundaries. Observe that losing an unconfirmed response is not proof of rollback. Read back committed state independently. For private service, reconstruct it in a genuinely separate authorized session with no local song copy. For native Android, exercise actual local persistence/required-attachment boundaries and process recreation/restart without account or network. Verify complete current-content song/set transfer between two independent installations with unrelated destination music; assert consistent fresh identity mapping, exact required PDF bytes/integrity, preserved destination content and independent destination histories. A local loopback alone is not independent-installation transfer evidence. Browser reload and local fixtures alone MUST NOT establish remote recovery or service atomicity.

Retain deterministic behaviour checks, actual browser assertions and independent assessment bound to the exact source and execution. The connected first private-service checkpoint MUST use real identity login and the same selected users fixture and application settings for manual and automated journeys, exercise private create/edit/save/reload/second-session/logout and refused roles, and record commands, assertions, screenshots, videos and useful redacted failure reports. Include malformed/missing configuration and execution-scoped reset safety. Synthetic content only may enter public evidence; credentials, session material and private operator values MUST NOT.

Report each case's authored criterion, actual executed boundary/result and remaining evidence separately. Passing local checks, generated documents, test counts or a running development environment MUST NOT substitute for native device acceptance, actual independent-installation transfer, real service behaviour where applicable, required checks, independent review, later full-scope qualification or deployment. No measured capacity, recovery duration or passing execution is asserted by this requirement.
