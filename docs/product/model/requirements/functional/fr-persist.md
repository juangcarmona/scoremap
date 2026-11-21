---
id: FR-PERSIST
type: functional-requirement
title: Retain and recover complete work at explicit local and service boundaries
status: draft
derived-from: [UC-PERSIST, BR-DURABILITY, BR-ACCESS, BR-SESSION, CON-LOCAL-FIRST, CON-PLATFORM, BR-IDENTITY]
verification:
  - scenario-ref: SB-NATIVE-SONG-CREATE
  - scenario-ref: SB-NATIVE-SONG-DELETE
  - scenario-ref: SB-NATIVE-SONG-RESTORE
  - scenario-ref: SB-PERSIST-RECOVER
  - scenario-ref: SB-PERSIST-FAILURE
  - scenario-ref: SB-PERSIST-CONFLICT
  - scenario-ref: SB-RECOVERY-INVALID
  - scenario-ref: SB-REMOTE-COMMIT
  - scenario-ref: SB-PRIVATE-RECOVER
  - scenario-ref: SB-ISOLATION
  - scenario-ref: SB-ROLE-REVOKE
  - scenario-ref: SB-SESSION-LOCK
  - scenario: With native installation and no login or network, create and edit a complete synthetic song and ordered set, acknowledge save and restart; reconstruct complete acknowledged content and ordering without a backend.
  - scenario: With a native song/set at a current revision, fail a write, submit a stale revision or repeat an acknowledged command; preserve previous durable music on failure/staleness and do not duplicate revisions on retry.
  - scenario: With a newer native draft and an older successful response, process the response; retain the newer draft rather than replacing it.
  - scenario: With several acknowledged native revisions, inspect history offline and restore an earlier valid revision; inspection makes no mutation and restore creates a new revision while preserving intervening history.
  - scenario: With native performance mode active, submit a direct valid-looking content mutation; reject without changing music or history.
  - scenario: With an acknowledged native song including owned PDF bytes and history, delete it; remove active use and memberships while retaining complete recovery without expiry and preserving unrelated music.
  - scenario: With valid recoverably deleted native content, restore offline; preserve its identities, create a new revision and do not recreate former set memberships.
  - scenario: With a native deleted item and distinct purge confirmation naming irreversibility, confirm purge; remove retained live owned content/history while preserving independent resources and a non-content anti-resurrection receipt.
  - scenario: With purged native identity and a stale restore command, retry restore; refuse resurrection, while a separately confirmed independent-copy import uses a different identity.
  - scenario: With a native restore whose dependency is missing and with a failed or cancelled purge, execute the respective command; refuse invalid restoration and preserve each operation's prior complete durable state.
  - scenario: With supported native schema upgrade and recovery copy, fail activation; preserve original data and previous active version without false success.
uses-terms: [TERM-LIBRARY, TERM-SONG, TERM-ARRANGEMENT, TERM-PRINCIPAL, TERM-REPERTOIRE]
---

## Requirement

The product MUST preserve complete acknowledged anonymous browser local revisions and recover them after reopening on the retained origin. Anonymous work MUST remain separate from private account data until explicit authorized non-destructive claim. Session cleanup MUST NOT erase that original library. Unreadable or unsupported stored content MUST be preserved without replacement.

For authenticated private-service work the product MUST provide real sign-in and a private-by-default library. Every list, read, nested-resource access, history access, export and mutation MUST enforce the current principal's resource-scoped capabilities, including direct requests outside visible controls. Submitted owner values, knowledge of an identity, ingress checks and cached roles MUST NOT confer authority. Owners manage grants and deletion; editors may change music; viewers may consult but cannot mutate. Deleted private content/history requires the current owner's fresh online authorization. Independently owned preferences, reusable voicings and device configurations MUST NOT become accessible through another song's grant.

A private song save MUST acknowledge only a complete authorized service commit covering shared form, all arrangements, parts, events, performed pitches, bindings and song-owned content/configuration with new revision, recoverable history and retry receipt. Admission MUST combine current capability, edit mode, complete validity and expected revision, with permission changes serialized against mutation. Personal preferences and reusable resources have separate explicit acknowledgement boundaries; no single atomic transaction across device, service and independent personal resources may be claimed.

The product MUST distinguish unsaved work, protected device retention, synchronization, service acknowledgement, conflict, blocked authorization and failure where applicable. Preserve previous durable revisions on refusal/transaction failure and prevent older responses replacing newer drafts. Ambiguous responses MUST remain unconfirmed until command-receipt reconciliation; retries MUST NOT duplicate committed revisions. Stale writes MUST NOT silently overwrite acknowledged work. Complete acknowledged private content MUST reconstruct after restart and from a second authorized session with identity, spelling, timing, independent parts and bindings intact. Restore creates a new revision without erasing intervening history or reviving obsolete grants.

Session expiry, unknown authority and observed logout/revocation/disablement MUST stop unauthorized service operations and lock private content. Pending work remains protected and bound to its stable principal; account switching/restart cannot expose it to another principal. Recovery requires the same reauthenticated provider subject and tenant/issuer plus fresh online resource/revision checks and explicit reconciliation, never automatic replay. Voluntary termination remains possible after failed save/export without forced plaintext export or silent discard. Retention does not grant read/export/replay after revocation.

Persistent private-service offline access remains disabled at the first connected checkpoint and until protected retention/key lifecycle qualification. Qualified later access obeys BR-SESSION's resource-scoped maximum eight hours from a successful server-recorded online authorization check, ending earlier on known session/authorization expiry or observed logout/revocation/disablement. Settings may shorten/disable, not extend. Restart/offline activity/failed requests do not renew; uncertainty/clock rollback lock. Reconnection revalidates current permissions before private access/replay.

The connected private checkpoint MUST use the same selected identity/users file through real provider login and one application-configuration file for manual and automated journeys. Contracts describe selection, schema, examples, defaults, precedence, validation and a small start/run/test procedure without divergent account lists or required-setting sprawl. Synthetic owner A, independent B, editor, viewer, disabled and outsider cases exercise actual song capabilities. Reset stays execution-owned and cannot erase existing owner songs or another environment. Missing/malformed/conflicting settings refuse actionably without mutation or insecure fallback. Production rejects development identities/seeds and temporary persistence defaults; real operator and usable identity/session inputs stay private.

That checkpoint MUST demonstrate actual login, private creation/editing, acknowledged save, reload, second-session reconstruction, logout and unauthorized/role-refused operations with synthetic content. Evidence identifies exact source/execution, assertions and useful visual/failure records for desktop, touch tablet and narrow views, without exposing access material. Connected qualification does not complete private offline, full arrangement, third-party identity, publication or production deployment.

For standalone native Android, the product MUST persist complete valid songs and ordered sets without login, network or backend and reconstruct them after process recreation/restart. Local save means acknowledged atomic durability on this installation, not service save or remote backup. Every direct or visible content mutation MUST enforce edit mode, expected revision and musical/reference validity. Commit the complete owned musical aggregate and required owned attachments with revision/history and stable command receipt; native complete song/set import additionally obeys its whole-selected-graph boundary in BR-BACKUP. Failed/stale/cancelled commands preserve prior durable music. Ambiguous results reconcile receipts; duplicate retry cannot create duplicate revisions/copies. Old responses cannot replace newer drafts. Supported upgrades retain a recovery copy and preserve original data on failed activation.

Retain acknowledged native song and set revisions without automatic expiry. History inspection MUST be read-only. Restore validates current graph/revision and produces a new acknowledged revision preserving intervening history. Native deletion MUST be recoverable under BR-IDENTITY, retaining complete owned content/PDF/history while removing active use; song deletion removes active memberships atomically. Restore preserves identities and never silently recreates former song memberships. Missing dependencies refuse invalid/partial restoration without mutation. Permanent purge requires a distinct destructive confirmation naming the deleted item and irreversibility, preserves independent resources and keeps a non-content anti-resurrection receipt. Set delete/purge never deletes songs. Native history/delete/restore/purge require no online service checks. Existing exported copies are not promised erased.

Native verification MUST compare complete independently expected before/after content at actual local storage and attachment boundaries, including failure, retry, stale revision, cancellation, restart, restore, purge and supported upgrades. Record authored criteria, executed checks, product apply, implementation acceptance and device evidence separately; this requirement claims none of them performed.

## Rationale

Musicians need trustworthy local or authorized service recovery without losing acknowledged work or confusing authority, retention, save status and cross-device guarantees.
