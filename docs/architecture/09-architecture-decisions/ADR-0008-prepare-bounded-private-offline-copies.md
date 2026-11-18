---
name: prepare-bounded-private-offline-copies
description: Admit private offline access only after scoped service authorization and an acknowledged encrypted local snapshot.
status: Proposed
date: 2026-11-18
deciders: []
tags: [security, persistence, offline]
---

# ADR-0008: Prepare bounded private offline copies

## Context

Private music requires current authenticated resource authority. A network interruption must preserve pending work without turning cached data or successful login into indefinite access. The accepted offline requirement caps authorization at eight hours and respects earlier session, configuration and authorization limits.

## Decision

We will prepare offline access explicitly while connected. One database transaction checks the current principal and selected song scope, records a server-timed lease, and obtains purpose-separated recovery keys and complete acknowledged song/personal snapshots. The browser encrypts that complete copy and waits for its atomic IndexedDB commit before activating the lease. Authorization metadata and usable keys remain in memory.

The optional `Application.PrivateOfflineMinutes` defaults to zero (disabled); accepted enabled values are 1 through 480. Expiry is the earliest configured limit, known session/authorization expiry and eight-hour maximum. Independent wall and elapsed clocks detect rollback or uncertain time. Reads, edits and restart never extend the lease. Offline writes retain encrypted pending commands without sending a service mutation or claiming acknowledgement. Reconnection closes the context before fresh authentication, current-resource checks and explicit recovery.

## Consequences

- **Positive:** Complete acknowledged content and new protected work can remain usable within explicitly checked scope during an interruption. Failed preparation leaves the previous protected data intact.
- **Negative:** Offline restart cannot restore usable keys; fresh online authentication is required. A provider's short token lifetime can make the actual usable interval much shorter than the configured maximum. Unobserved remote revocation cannot be discovered while disconnected.
- **Neutral:** Retained ciphertext is recoverable data, not authority. History, grants, trash, restore and purge still require online checks. Explicit own-copy removal leaves anonymous data and other principals intact.

## Alternatives considered

- Login-derived offline access: rejected because it does not check song scope or acknowledge a protected snapshot.
- Persist usable keys beside encrypted content: rejected because restart or a copied public cache could bypass fresh authority.
- Automatic pending replay on reconnect: rejected because an unknown outcome, newer revision or revoked grant requires explicit reconciliation.

## References

- [ADR-0006](ADR-0006-retain-protected-drafts-by-editing-context.md)
- [ADR-0007](ADR-0007-separate-personal-resource-recovery-keys.md)
- [Offline qualification evidence](../../evidence/music/private-offline.md)
