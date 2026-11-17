---
name: separate-personal-resource-recovery-keys
description: Protect personal-resource commands under an independent principal-bound key purpose without broadening song recovery authority.
status: Proposed
date: 2026-11-17
deciders: []
tags: [security, recovery, personal-resources]
---

# ADR-0007: Separate personal-resource recovery keys

## Context

Note-name preferences, reusable voicings and device configurations have independent principal ownership and acknowledgement boundaries. A song grant does not grant access to these resources. Existing song recovery keys are deliberately bound to the covered song identities and require current resource access before unlocking. Reusing those keys for independent personal settings would couple their recovery to unrelated song grants; using an unrestricted personal key for song drafts would bypass that protection.

<!-- pdac:cite id="BR-DURABILITY" digest="sha256:6b075527861da086b9571e8d117c7844348a437e363423bca46f60cc83b02e0b" -->
<!-- pdac:cite id="BR-ACCESS" digest="sha256:fcc173c80ae4a5903dbeb2e11c141cb6ee8d03382c812ebc527d5065347b72c9" -->

## Decision

We will give recovery keys an explicit server-enforced purpose. Existing keys retain the `song` purpose and their original data-protection context. New `personal` keys use a different protection context and principal-only authorization through separate authenticated endpoints. A song commit accepts only a song key; unlocking a key through the other purpose refuses before returning usable material. Authentication still uses the real provider and current stable principal.

Personal commands enter an independent encrypted IndexedDB journal before transport. Each opaque principal/context/kind/resource slot retains its original command identity and complete request under AES-GCM with the slot as authenticated data. No usable key or personal content is stored in public caches. Service acknowledgement must match the intended resource, revision and content before removing the protected command. A lost response keeps that original request for explicit fresh-authorized review, comparison export, retry or removal. Closing the context releases usable keys; reopening does not replay automatically.

Voluntary termination waits for both protection boundaries, without waiting for a network response. Failure to protect a personal setting remains visible to termination but does not prevent a separately valid song commit. Removing one personal draft does not remove another context, another principal or anonymous music. The independent acknowledgement boundaries remain visible in the UI.

## Consequences

- **Positive:** Personal resources recover independently of song-sharing changes without widening song authority. Original-command retry and precise acknowledgements preserve ambiguous work.
- **Negative:** The application maintains another protected journal and explicit recovery UI. Browser eviction or device loss can still destroy unsynchronized work. Retained server key records need an operator retention policy; local removal does not promise server-key erasure.
- **Neutral:** The schema adds an explicitly defaulted purpose to older keys. Persistent private offline access remains a separate capability with its own scoped-lease qualification. This candidate record does not claim independent review or release acceptance.

## Alternatives considered

- **Reuse the current song key:** rejected because an unrelated song revocation would block independent personal-resource recovery.
- **Use a personal key for all drafts:** rejected because it would bypass current song-resource authorization at unlock.
- **Keep failed settings only in memory:** rejected because closing a session or tab could lose the only original request needed for receipt reconciliation.

## References

- [Existing context-bound song recovery](ADR-0006-retain-protected-drafts-by-editing-context.md)
- [Durable recovery change](../../../openspec/changes/issue-26-durable-recovery/)
- [Recovery key repository](../../../src/modules/ScoreMap.Modules.Library/Infrastructure/RecoveryVault.cs)
- [Personal protected journal](../../../src/features/library/personalPending.ts)
