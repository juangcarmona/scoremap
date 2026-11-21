---
name: retain-protected-drafts-by-editing-context
description: Protect the latest admitted complete draft independently of transport while preserving older clients and separate tab contexts.
status: Proposed
date: 2026-11-17
deciders: []
tags: [persistence, protection, recovery, compatibility]
---

# ADR-0006: Retain protected drafts by editing context before network serialization

<!-- pdac:cite id="BR-DURABILITY" digest="sha256:d822f18f163b8685937ae5a3137dc04ef4a2d5947ab7a9954245bd965b72fa45" -->
<!-- pdac:cite id="BR-SESSION" digest="sha256:ef810362632ea22983eed6cfcdb6adfafb1d37497623582d64c0bc7c349e7bc2" -->

## Context

Serial service requests protect revision ordering, but encrypting only when a queued request reaches transport leaves newer admitted typing in memory behind an older network response. One principal-keyed pending slot also lets another tab replace a different recoverable draft. Logout must not depend on a response whose commit outcome is unknown. The existing PWA deliberately lets a musician postpone application updates, so old and new clients may coexist on the same origin.

## Decision

The implementation candidate separates local protection from network serialization through an optional prepared-save port. Normal domain commands immediately derive a complete valid optimistic candidate. Its latest protected device record commits before transport; service acknowledgement remains a separate boundary. Ordered service saves retain stable actual expected revisions/versions/command bodies once sent. An unknown result is not automatically rebased or replayed. Generation checks stop an older acknowledgement from replacing a newer candidate or deleting its retained work. Confirmed import/history recovery remains an admission barrier so later commands apply to the resulting state.

Use the existing IndexedDB version-1 store with compound `[stablePrincipal, opaqueEditingContext]` keys for new format-2 protected records. Retain one latest complete encrypted candidate per context, skipping obsolete local encryption jobs. Read older principal-string records alongside the new keys, without rewriting them. Preserve unreadable/unknown records and require an explicit local deletion decision. Local metadata carries only opaque identities, generation/format indicators and cipher framing; musical content and usable keys are absent. These counters never confer identity, resource permission or offline authority.

Continue established AES-GCM protection with a nonextractable active browser key and the server's protected same-principal recovery-key service. Fresh online resource permission remains required before unlocking/replay/export. Multiple previous contexts require explicit selection and review. Logout waits for latest local retention, warns accurately if that fails, cancels the old context and proceeds through real provider termination without waiting for the network queue. Requests also have a bounded timeout. Protected work remains unconfirmed until a real service receipt is reconciled.

## Consequences

- **Positive:** Refresh, interrupted responses and separate tabs preserve their latest protected work without silently replacing one another. Old acknowledgements and atomic local transactions have independently verifiable generation boundaries. Older running clients can keep their legacy record without a database-version error.
- **Negative:** Conflicts remain explicit. Complete per-context snapshots can consume significant local space; quota/protection failures must be visible and must not claim durability. Browser eviction, origin changes and device loss can still lose unsynchronized device work.
- **Neutral:** A local and a service commit are separate transactions. Local ciphertext removal does not claim erasure of already exported copies, service backups or retained server keys. Persistent private offline access remains disabled pending its separate scoped-lease and key-lifecycle qualification. This proposed record describes the candidate; independent review/integration remain required.

## Alternatives considered

- **One record per principal:** rejected because another tab can destroy the only retained copy of a distinct pending draft.
- **Increase the database version immediately:** rejected because an older still-running PWA opens version 1 and may then fail before retaining work. Compound keys permit coexistence and explicit legacy recovery.
- **Append a full snapshot for every keystroke:** rejected because it grows device retention without bound. The latest complete candidate per editing context retains intended work while ordered service history preserves actual acknowledgements.
- **Wait for network idle before logout:** rejected because an unknown response may remain pending even after the transaction committed. Local protection and provider termination must remain independently completable.

## References

- [Protected session rule](../../product/model/business-rules/br-session.md)
- [Durability rule](../../product/model/business-rules/br-durability.md)
- [Private adapter](../../../src/features/library/privateStorage.ts)
- [Atomic protected record storage](../../../src/features/library/protectedPending.ts)
- [Durable recovery change](../../../openspec/changes/issue-26-durable-recovery/specs/durable-recovery/spec.md)
