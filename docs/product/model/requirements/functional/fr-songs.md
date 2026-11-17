---
id: FR-SONGS
type: functional-requirement
title: Manage private songs with recoverable deletion and explicit purge
status: draft
derived-from:
  - UC-SONGS
  - BR-IDENTITY
  - BR-EDIT-GUARD
  - BR-DURABILITY
  - BR-ACCESS
  - BR-SESSION
verification:
  - scenario-ref: SB-SONG-CREATE
  - scenario-ref: SB-SONG-ADD
  - scenario-ref: SB-SONG-EDIT
  - scenario-ref: SB-SONG-DELETE-LAST
  - scenario-ref: SB-SONG-DELETE
  - scenario-ref: SB-BLANK-NAME
  - scenario-ref: SB-MISSING-IDENTITY
  - scenario-ref: SB-SONG-RETAIN
  - scenario-ref: SB-SONG-RESTORE
  - scenario-ref: SB-SONG-PURGE
  - scenario: With real sign-in as principal A and a valid new-song command in edit mode, create a private song; derive ownership from A's trusted session and acknowledge a complete initial song revision with no grants to independent B.
  - scenario: With an authenticated creation request containing a forged different owner value, submit the new song; do not assign ownership to the submitted identity or grant the caller authority through that value.
  - scenario: With current owner capability, edit mode and expected revision, change the optional artist; acknowledge the new revision while preserving title, identity, complete arrangements and unrelated content.
  - scenario: With current editor capability and otherwise valid admission, change a song title; acknowledge the complete change without granting ownership or grant-management capability.
  - scenario: With current viewer capability, open an active song's authorized history; return only that song's authorized revisions without allowing a mutation.
  - scenario: With viewer capability and otherwise valid edit-mode command data, submit a title change; refuse without a new revision or mutation.
  - scenario: With editor capability, request a new grant for another principal; refuse without changing grants or content.
  - scenario: With editor capability, request deletion of the song; refuse and retain active content, memberships and history.
  - scenario: With an outsider who knows a private song identity, request its history; refuse without exposing private content or descriptive details.
  - scenario: With no authenticated session and knowledge of a private song identity, request that song; refuse without returning private content.
  - scenario: With a disabled principal and a formerly valid song grant, request that song; refuse and do not treat the former grant as current authority.
  - scenario: With an owner-authorized current-revision delete of one of two active songs and a successful transaction, delete that song; remove only its active memberships and consultation access while retaining its complete owned content/history for owner-only recovery and leaving the other song unchanged.
  - scenario: With one active private song and a successful current-revision owner delete, delete that final song; leave an empty active library with retained owner-only recovery data and independently owned resources unchanged.
  - scenario: With a valid owner delete command and an atomic-write failure, request deletion; retain the complete prior active song, grants, memberships and acknowledged revision without partial deletion.
  - scenario: With deleted content retained and no explicit purge command, reopen the owner's deleted-song view after fresh online authorization; retain recoverability without any age-based purge.
  - scenario: With a former editor grant invalidated by deletion, request the deleted song's content; refuse without exposing trash or retained history.
  - scenario: With owner authorization, a current revision and valid retained deleted content, confirm restore; preserve song/content identities and create a new acknowledged revision without restoring old grants or repertoire memberships.
  - scenario: With a restore request whose expected revision is stale, submit restore; refuse atomically and preserve retained recovery data and the latest acknowledgement.
  - scenario: With retained deleted content and a conflicting identity, request restore; refuse without overwriting the conflict or discarding recovery data.
  - scenario: With the owner shown a destructive purge confirmation naming the deleted song, decline confirmation; preserve retained content and history without purge.
  - scenario: With fresh owner authorization and distinct irreversible confirmation naming the deleted song, purge it; remove live retained song-owned content/history atomically and retain a non-content purge receipt while leaving independent presets and other songs intact.
  - scenario: With a purge committed but its response lost, retry the same purge command; reconcile the original receipt without partial removal or duplicate effects.
  - scenario: With a purged song identity and a retained old pending edit, attempt replay; refuse resurrection and preserve unrelated acknowledged data.
  - scenario: With two owner commands for restore and purge admitted against the same deleted-song revision, execute them concurrently; serialize admission so incompatible stale work refuses and no partially restored or duplicate song appears.
  - scenario: With an active song revision and an acknowledged owner revocation preceding a former editor's admission, submit the former editor's change; refuse under current capability without modifying content history.
  - scenario: With a current owner grant-change command concurrent with an editor save, execute both; serialize current permission checking with commit so a write cannot pass on authority already revoked at its admission boundary.
  - scenario: With a previously downloaded backup and a later purge receipt, request operator restoration; reconcile the receipt and current authorization before exposing restored data and do not silently republish the purged identity.
uses-terms:
  - TERM-SONG
  - TERM-LIBRARY
  - TERM-ARRANGEMENT
  - TERM-PRINCIPAL
---

## Requirement

The product MUST allow creation, title editing, optional artist attribution and deletion of personally authored songs while preserving stable opaque identities. Titles MUST be nonblank; unknown target identities and invalid commands MUST refuse without mutation. Reordering MUST change position rather than identity. Repertoire membership MUST remain non-owning: deleting a repertoire MUST NOT delete its songs, and a song MUST appear at most once in a repertoire. Empty active libraries MUST remain valid. Anonymous local management MUST retain its existing complete device-commit boundary and remain separate from private account authority.

Private songs MUST be private by default. The product MUST derive the principal and new-song ownership from trusted real authentication, never submitted owner values or global roles. Current resource capability MUST govern all lists, reads, nested content, history, export and writes. Owners MAY manage grants and delete; editors MAY change music and restore active historical content under BR-ACCESS; viewers MAY read/consult active authorized content/history/export but MUST NOT mutate. Outsiders, disabled principals and no-session requests MUST receive no private content. Independently owned preferences/presets/configuration MUST NOT become accessible through a song grant. Edit admission, complete validity and expected revision MUST remain independent write requirements. Grant changes MUST serialize with mutation so cached authority cannot bypass a committed downgrade/revocation.

An authorized private delete MUST be current-owner, edit-admitted, revision-checked and atomically acknowledged. It MUST remove the song from active lists, repertoire memberships and normal consultation, retain all song-owned arrangements/events/attachments and complete revision history in recoverable deletion, and invalidate collaborative grants. Other songs and independently owned reusable resources MUST remain unchanged. Deleting the last active song MUST yield an empty active library, not erased recovery history. No automatic age-based purge is permitted. Anonymous current-data deletion MUST NOT be falsely described as already providing private retained history.

Only the current owner after fresh online authorization MAY list/read deleted content/history, restore a deleted song or confirm its purge. Former editor/viewer grants MUST confer no deleted-content capability. Restore MUST validate retained content, current identity/references and expected revision, retain the song/content identities and create a new acknowledged revision. It MUST NOT erase intervening history or silently restore old grants or repertoire memberships. Identity/revision conflict and failed writes MUST preserve the retained recovery data and last acknowledgement without partial activation. Active-song history and restore-as-new-revision MUST retain their separate BR-ACCESS capability rules.

Permanent purge MUST be a distinct, clearly destructive, owner-confirmed action naming the song and explaining irreversibility. Its atomic acknowledged result MUST remove retained song-owned live application content/history, not independently owned reusable resources. A non-content purge receipt MUST prevent a purged identity from being resurrected by stale commands, backup restoration or protected pending-work replay. Lost responses and concurrent delete/restore/purge MUST reconcile deterministically through current revision and command receipts without duplicate resurrection or partial deletion. A failed or refused command MUST NOT perform a lifecycle transition.

The product MUST state that recoverable deletion is not erasure. It MUST NOT promise instant deletion of previously downloaded exports, unobserved offline copies or operator backups. Operator retention and restoration procedures MUST explicitly reconcile delete/purge records and current authorization before restoring access; restoration MUST NOT silently republish deleted data. Protected retained drafts MUST remain subject to session lock and fresh same-principal online permission/revision checks, without automatic replay. Retention MUST NOT grant read/export access after revocation. The eight-hour maximum private offline policy MUST NOT authorize offline trash, restore or purge without their required fresh online checks.

The first connected private-song journey MUST use real provider login with the same selected users fixture for manual and automated trials and one validated application-configuration contract. Owner A, independent owner B, editor, viewer, disabled and outsider cases MUST exercise actual per-song capabilities rather than global-role shortcuts. Missing/malformed configuration MUST fail safely and Production MUST refuse development identity/seed/persistence defaults. Execution-scoped setup/reset MUST NOT erase an existing owner library or another environment. Private offline persistence MUST remain disabled at that checkpoint while protected session-end handling remains required.

Verification MUST exercise actual authorized service/persistence boundaries, complete acknowledged reconstruction and atomic failure/race cases, including final-song deletion, unchanged other songs, owner-only trash, restoration without grants/memberships and no purge resurrection. Synthetic source-bound browser evidence MUST cover the connected create/edit/save/reopen/logout journey and role-refused paths. Authoring these obligations MUST NOT be represented as delivered retention, executed tests, accepted product apply or production deployment.

## Rationale

Musicians need ordinary song management and recovery from accidental deletion without ambiguous ownership, hidden history loss or misleading erasure promises. Distinct delete, restore and purge outcomes preserve both recoverability and explicit destructive choice.
