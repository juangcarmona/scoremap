---
id: UC-PERSIST
type: use-case
title: Retain and recover complete authorized work
status: draft
primary-actor: ACT-MUSICIAN
bounded-context: BC-RECOVERY
governed-by:
  - BR-DURABILITY
  - BR-IDENTITY
  - BR-EDIT-GUARD
  - BR-ACCESS
  - BR-SESSION
  - BR-STRUCTURE
  - BR-CHORDS
uses-terms:
  - TERM-LIBRARY
  - TERM-SONG
  - TERM-ARRANGEMENT
  - TERM-EVENT
  - TERM-VOICING
  - TERM-PRINCIPAL
---

## Goal

Retain complete valid work at its declared acknowledgement boundary and reconstruct it after reopening. For private work, recover the complete acknowledged song in another authorized session without confusing a device copy, pending draft or retained record with service acknowledgement.

## Trigger

The musician requests a save, reopens retained work, opens a private song in another session, or explicitly requests an authorized historical revision restore. Each is a distinct action with its own result; opening content never implicitly submits a pending write.

## Preconditions

Existing target identities resolve and the relevant acknowledged content is readable and supported. Anonymous local content does not require private sign-in. Private operations require real authentication and current resource-scoped capability under BR-ACCESS and BR-SESSION. Every content mutation independently requires applicable write capability, edit mode, complete musical/reference validity and expected revision. For private-service work, an active historical restore requires current owner/editor capability; deleted-song recovery instead follows UC-SONGS and fresh owner authorization. Native Android operations use installation-local authority without login, network or backend, with complete local song/set history and recoverable deletion under BR-DURABILITY and BR-IDENTITY. Independently owned preferences and reusable resources have their own authority and acknowledgement.

The first connected private checkpoint requires connectivity and persistent private offline access remains disabled. Manual trials and automated journeys use the same selected identity/users fixture through real sign-in and one validated application configuration. The input contracts describe selection, schema, defaults, precedence, validation and a small reproducible start/run/test procedure. Synthetic owner A, independent owner B, editor, viewer, disabled and outsider cases exercise song-scoped permissions, not global ownership roles. Reset is confined to execution-owned resources; missing or malformed required configuration refuses safely. Production rejects development identities/seeds and temporary persistence defaults. Real operator inputs remain private.

## Main Flow

1. The musician edits identified musical content. The product retains the intended complete candidate, distinguishes unacknowledged work from acknowledged content and safely serializes/coalesces autosave requests without losing a newer interaction draft.
2. For a requested mutation the product checks edit admission, complete candidate validity and expected revision; private operations additionally check the current principal's relevant capability. Private permission/revocation changes are serialized with admission and commit, rather than trusted from cached UI roles.
3. For anonymous browser work, commit one complete valid local library revision. For standalone native Android, commit the complete owned song or ordered-set aggregate and required owned attachments with its new local revision, retained history and stable command receipt. A native import activates the whole selected graph under BR-BACKUP. For private work, commit the complete song boundary: shared form, all arrangements, parts, events, exact performed pitches, bindings and song-owned content/configuration, together with the new revision, recoverable history and retry receipt. Separately owned preferences/presets/configuration have separate explicit acknowledgements.
4. Report success only after durable acknowledgement at that boundary. For native work, distinguish unsaved, locally acknowledged, conflicted and failed results; local acknowledgement does not imply service save, sharing or remote backup. For private work, show whether work is unsaved, protected on this device, synchronizing, acknowledged by the private library, conflicted, authorization-locked or failed. An older response may record its actual acknowledgement but cannot replace newer work.
5. When the musician later opens acknowledged content, validate and reconstruct its complete declared scope. A second private session with no local copy obtains it through current authorized service access; identity, ordering, spelling, time, repeats, independent performed parts and bindings remain intact. Principal-owned notation preference applies without rewriting music or exposing another principal's resources.

## Alternative Flows

- An empty library, native set or empty sketch is a valid acknowledged result and reopens without invented songs, parts or notes. Anonymous source work remains separate until explicit claim through UC-BACKUP.
- On an ambiguous save response, keep the outcome unconfirmed and reconcile the same installation/resource/command identity for native work, or principal/resource/command identity for private work, against its receipt before another write. An already committed command returns its original effect without duplicate revisions. A timeout alone does not prove rollback.
- On stale revision, preserve the latest acknowledgement and recoverable candidate, show the conflict and offer explicit comparison, copy or restore subject to current authority. Never silently merge or overwrite. An anonymous export recovery option does not permit private export after authority ends.
- For an active historical restore, validate the chosen complete revision against current invariants and expected revision, plus current permissions in the private-service context; acknowledge it as a new revision without deleting intervening history or reinstating obsolete grants. It does not change song retention or library presence.
- In standalone native Android, reopening reconstructs complete acknowledged songs, ordered sets and required owned PDF bytes offline. Reading local song/set history makes no mutation or revision. Restoring a valid selected historical revision produces a new acknowledged revision preserving intervening history. Validate current dependencies and refuse invalid or partial restoration without inventing or resurrecting missing content. Recoverably deleted song/set restoration and separate purge follow UC-SONGS and UC-REPERTOIRES respectively, without private online checks.
- A native write, attachment-publication or migration-activation failure preserves prior complete durable content and its recovery data. Ambiguous native results reconcile the installation/resource/command receipt; retry of one command cannot duplicate revisions or independent-copy imports. Purge receipts prevent stale replay from resurrecting purged identities.
- After private session end, lock content and preserve only protected principal-bound work. To recover that draft, require the same reauthenticated provider subject and tenant/issuer, fresh online resource permission and revision checks, then explicit comparison/reconciliation. Retention supplies no authorization and opening the song never automatically replays the draft.
- On voluntary logout with pending work, warn and offer save/sync, explicit export while authorized or explicit discard. Failed save/export defaults to protected retention; the musician may still terminate the session without forced plaintext export or silent loss. Account switch closes the previous context first.
- The first connected checkpoint exercises actual sign-in, private create/edit/save, reload, second-session reconstruction, logout and unauthorized/role-refused paths with synthetic data. Its evidence identifies the exact source, run, actions and assertions across desktop, touch tablet and narrow views, including failures and malformed configuration. This does not close full arrangement, protected-offline, third-party identity or production qualification.

## Failure Conditions

Unknown/inaccessible identities, invalid complete candidates, performance-mode mutations, insufficient current capability and stale revisions refuse without partial changes, private disclosure or a lifecycle transition. Failed writes preserve the prior complete durable revision and recoverable work; they never report success. Unsupported or unreadable stored versions remain untouched and produce an actionable error. A failed migration preserves its recovery copy and prior active version.

Expiry, unknown authority and observed revocation/disablement stop private operations and lock usable plaintext; do not expose retained drafts as unrestricted recovery exports. Account switch, restart or an email/display-name match cannot unlock another principal's record. Reconnection requires fresh permission checks before private access or replay. Qualified later offline access obeys the scoped eight-hour maximum and protection requirements in BR-SESSION; local activity cannot mint authority. Private cleanup must not erase the original anonymous library.

## Postconditions

The product has either acknowledged one complete valid boundary or preserved the previous acknowledgement with an honest pending/refusal/failure state. Successful reopening reconstructs complete authorized content without a mutation. Native local song/set acknowledgement with complete history and attachments, anonymous browser-library durability, private service acknowledgement and protected pending retention remain distinct. No transaction across device, service and independent personal resources is claimed, and no save/session/publishing lifecycle is introduced.
