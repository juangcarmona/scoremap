---
id: UC-OFFLINE
type: use-case
title: Continue anonymous work and bounded protected private work
status: draft
primary-actor: ACT-MUSICIAN
bounded-context: BC-RECOVERY
governed-by:
  - BR-DURABILITY
  - BR-EDIT-GUARD
  - BR-ACCESS
  - BR-SESSION
  - BR-IDENTITY
  - BR-STRUCTURE
  - BR-CHORDS
uses-terms:
  - TERM-LIBRARY
  - TERM-SONG
  - TERM-ARRANGEMENT
  - TERM-PRINCIPAL
  - TERM-MODE
---

## Goal

Open, browse, edit, locally retain and consult prepared anonymous content without connectivity, and later use qualified private content only within protected, explicitly scoped authority without losing pending work when that authority ends.

## Trigger

The musician requests an action while disconnected, connectivity/authority changes, a private access deadline arrives, or the musician requests session termination or protected-draft recovery. These are distinct stimuli governed by the same boundaries, not alternative outcomes of one behaviour.

## Preconditions

Anonymous continuation requires an installed application and readable supported content on the retained origin. Local mutations require edit mode, valid complete values/references and expected local revision. Browser eviction, origin changes and device loss remain separate recovery risks.

Private continuation requires qualified protected records/key lifecycle and a still-valid resource/capability lease belonging to the current stable principal/session. Its authoritative anchor is the service-recorded successful online check of that principal/session and the particular resources/permissions, not login alone. Persistent private offline access is disabled for the first connected checkpoint and until protection is qualified; disabling it does not waive safe pending-work retention. Private mutations require leased write capability, edit admission, complete validity and expected revision and remain pending, not service-acknowledged.

## Main Flow

1. The product distinguishes retained anonymous work from private account content. The musician selects an available authorized scope without exposing another principal's data.
2. For anonymous work, reconstruct the complete acknowledged local library. Allow browsing, guarded editing, local save and performance consultation without a network, including arrangements and repertoire navigation.
3. For qualified private work, establish trustworthy remaining authority for the exact scope. Expiry is the earliest of the successful server anchor plus eight hours, known session/authorization expiry, any configured shorter bound, or observed logout/revocation/disablement. Configuration may disable/shorten, never extend, the maximum.
4. While authority remains valid, allow only covered reads and valid guarded changes. Distinguish protected device retention from the last service-acknowledged revision. Preserve independent musical identities and complete pending content; no offline write is represented as a remote backup.
5. At expiry, uncertain authority or observed revocation/disablement, lock affected private views and usable plaintext and stop authorized operations. Remove usable session/decryption material from the active context and retain only protected principal/resource-bound pending work. Reopening cannot expose it unauthenticated or renew its deadline.
6. On reconnection, obtain fresh online resource permission checks before private access, export or any write replay, even when an old lease has remaining time. If the musician requests draft recovery, require the same reauthenticated provider subject and tenant/issuer, current resource permission and revision checks, then explicit comparison/reconciliation. Do not replay automatically.

## Alternative Flows

- Anonymous empty libraries/sketches remain valid. External reference targets retain their connectivity limitations; application-shell availability does not imply their offline availability.
- The first connected private checkpoint requires real connectivity, shared selected identity/users and application inputs for manual trials and automated real sign-in, safe configuration validation and execution-scoped reset. It must protect pending work on connection/session failure but does not enable persistent private offline editing or claim later qualification. Production refuses development defaults.
- A successful fresh online scoped authorization check may renew only currently permitted resources/capabilities. An offline action, preference edit, launch, refresh/restart, failed background request, generic success or cached role cannot start or renew authority. Login without a resource check provides no lease.
- Clock rollback or uncertain trustworthy elapsed time locks rather than extends access. A known earlier session expiry ends authority before the eight-hour maximum. An observed revocation locks immediately; unobserved remote revocation cannot be promised instantly detectable while disconnected.
- Voluntary logout warns about pending work and offers save/sync, explicit export while authorized or explicit discard. If save/export fails, protected retention is the default; session termination remains possible without forced plaintext export or silent discard. Switching accounts first closes the old principal's context and reveals none of its drafts, keys or content to the new account.
- Same-principal recovery with current permission exposes only the permitted scope for explicit revision comparison. Reconnection with a downgrade enforces the lower capability; a retained edit cannot override it. If permission remains revoked, deny read/export/replay but permit explicit local deletion of the inaccessible protected record. Display-name/email equality cannot satisfy principal identity.
- Private-session cleanup preserves original anonymous work without converting private pending data into anonymous content. Later anonymous claim is an explicit separate operation.

## Failure Conditions

Unknown or unsupported retained data is preserved without replacement. Local commit failure retains the prior durable revision and actionable failure state. Invalid content, missing references, performance-mode mutations and stale revisions refuse without partial changes or lifecycle transitions.

Private access without proven protection, trustworthy unexpired scoped authority or current required capability refuses without private disclosure. Plaintext account namespacing, hidden controls and public caches are not protection. Private responses and reusable session/decryption material must not enter public application caches. Another account cannot display/import/export/replay a retained draft. No failure renews authority, silently discards work or fabricates a service acknowledgement.

## Postconditions

Anonymous acknowledged work remains usable on the retained origin without connectivity. Qualified private work is either confined to current bounded scope with pending status or locked with protected recoverable work. Restoration of private access requires the correct principal and fresh online permission/revision checks; application restart alone cannot unlock or renew. Navigation, session lock, lease and save status are not musical or publishing lifecycles.
