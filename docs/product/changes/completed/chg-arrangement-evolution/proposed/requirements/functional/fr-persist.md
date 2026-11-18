---
id: FR-PERSIST
type: functional-requirement
title: Retain and recover complete authorized work
status: draft
derived-from:
  - UC-PERSIST
  - BR-DURABILITY
  - BR-ACCESS
  - BR-SESSION
  - CON-LOCAL-FIRST
  - CON-PLATFORM
verification:
  - scenario-ref: SB-PERSIST-RECOVER
  - scenario-ref: SB-PERSIST-FAILURE
  - scenario-ref: SB-PERSIST-CONFLICT
  - scenario-ref: SB-RECOVERY-INVALID
  - scenario-ref: SB-REMOTE-COMMIT
  - scenario-ref: SB-PRIVATE-RECOVER
  - scenario-ref: SB-ISOLATION
  - scenario-ref: SB-ROLE-REVOKE
  - scenario-ref: SB-SESSION-LOCK
uses-terms:
  - TERM-LIBRARY
  - TERM-SONG
  - TERM-ARRANGEMENT
  - TERM-PRINCIPAL
---

## Requirement

The product MUST preserve complete acknowledged anonymous local revisions and recover them after reopening on the retained origin. Anonymous work MUST remain separate from private account data until an explicit, authorized, non-destructive claim. Session cleanup MUST NOT erase that original library. Unreadable or unsupported stored content MUST be preserved without replacement.

For authenticated work the product MUST provide real sign-in and a private-by-default library. Every list, read, nested-resource access, history access, export and mutation MUST enforce the current principal's resource-scoped capabilities, including direct requests made outside the visible controls. Submitted owner values, knowledge of an identity, an ingress check and cached roles MUST NOT confer authority. Owners manage grants and deletion; editors may change music; viewers may consult but cannot mutate. Deleted content and its history require the current owner's fresh online authorization. Independently owned preferences, reusable voicings and device configurations MUST NOT become accessible through another song's grant.

A private song save MUST acknowledge only a complete authorized service commit covering shared form, all arrangements, parts, events, performed pitches, bindings and song-owned content/configuration with its new revision, recoverable history and retry receipt. Admission MUST combine current capability, edit mode, complete validity and expected revision, with permission changes serialized against mutation. Personal preferences and reusable resources have separate explicit acknowledgement boundaries; the product MUST NOT claim one atomic transaction across device, service and independent personal resources.

The product MUST distinguish unsaved work, protected device retention, synchronization, service acknowledgement, conflict, blocked authorization and failure. It MUST preserve the previous durable revision on refusal or transaction failure and prevent older responses from replacing newer drafts. An ambiguous save response MUST remain unconfirmed until reconciliation of the command receipt; retry MUST NOT duplicate a committed revision. A stale write MUST NOT silently overwrite acknowledged work. Complete acknowledged private content MUST reconstruct after restart and from a second authorized session, preserving identity, spelling, timing, independent parts and bindings. Restore MUST create a new revision without erasing intervening history or reviving obsolete grants.

Session expiry, unknown authority and observed logout, revocation or disablement MUST stop unauthorized operations and lock private content. Pending work MUST remain protected and bound to its stable principal; neither account switching nor restart may expose it to another principal. Recovery MUST require the same reauthenticated provider subject and tenant/issuer plus fresh online resource and revision checks, followed by explicit reconciliation rather than automatic replay. Voluntary termination MUST remain possible after failed save or export without forced plaintext export or silent discard. Retention MUST NOT grant read, export or replay permission after revocation.

Persistent private offline access MUST remain disabled at the first connected checkpoint and until protected retention and its key lifecycle are qualified. The later qualified capability MUST obey the resource-scoped lease in BR-SESSION: at most eight hours from a successful server-recorded online authorization check, ending earlier on known session/authorization expiry or observed logout/revocation/disablement. Configuration may shorten or disable, never extend, that bound. Restart, offline activity and failed requests MUST NOT renew authority; uncertainty and clock rollback MUST lock. Reconnection MUST revalidate current permissions before private access or replay.

The first usable connected checkpoint MUST allow manual trials and automated journeys to use the same selected identity/users file through real provider login and one application-configuration file. The contracts MUST describe selection, schema, examples, defaults, precedence, validation and a small start/run/test procedure without divergent account lists or required-setting sprawl. Synthetic owner A, independent owner B, editor, viewer, disabled and outsider cases MUST exercise actual song capabilities. Reset MUST be confined to execution-owned resources and MUST NOT reset existing owner songs or another environment. Missing, malformed and conflicting required settings MUST produce actionable refusal without data mutation or insecure fallback. Production MUST reject development identities, seed accounts and temporary persistence defaults. Real operator inputs and usable identity/session material MUST remain outside public artifacts.

That checkpoint MUST demonstrate actual login, private creation/editing, acknowledged save, reload, a second authorized session, logout and unauthorized/role-refused operations with synthetic content. Evidence MUST identify the exact source and execution and include observable assertions and useful visual/failure records for desktop, touch tablet and narrow views, without disclosing private content or access material. Connected qualification MUST NOT be represented as completed private-offline qualification, full arrangement delivery, third-party identity integration, publication or production deployment.

## Rationale

Musicians need trustworthy recovery and private ownership without losing anonymous work or pending drafts when a session ends. Device durability, service acknowledgement, permission and retained recovery are different promises and must remain distinguishable.
