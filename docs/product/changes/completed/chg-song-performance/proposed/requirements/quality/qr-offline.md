---
id: QR-OFFLINE
type: quality-requirement
title: Anonymous continuity and bounded protected private access
status: draft
quality-attribute: availability
applies-to:
  - JRN-PREPARE-PERFORM
verification:
  - scenario-ref: SB-OFFLINE
  - scenario-ref: SB-PERSIST-RECOVER
  - scenario-ref: SB-SESSION-LOCK
  - scenario-ref: SB-LEASE-EXPIRY
  - scenario-ref: SB-PRIVATE-REFUSE
  - scenario: With installed content and a complete acknowledged anonymous library, reopen without connectivity; recover the complete local arrangement and permit guarded local editing and consultation without private sign-in.
  - scenario: With private offline persistence disabled at the connected checkpoint, lose known authority while work is pending; lock private access and retain protected same-principal work without claiming a service save.
  - scenario: With qualified protection and a scoped server authorization anchor t, reach exactly t plus eight hours without an earlier deadline; lock the covered private views and usable plaintext without discarding protected pending work.
  - scenario: With a known session expiry earlier than the maximum resource deadline, reach that expiry; lock at the earlier boundary rather than extending authority to eight hours.
  - scenario: With a lease covering only song S, request another private song T while offline; refuse without exposing T or extending the covered scope.
  - scenario: With an existing resource deadline, restart offline; do not renew its anchor or expose content when trustworthy remaining time cannot be established.
  - scenario: With a retained resource deadline and detected clock rollback, evaluate private access; lock rather than extend the deadline.
  - scenario: With an otherwise unexpired lease, reconnect after a remote permission downgrade; require fresh scoped checks before exposure or replay and enforce the current lower capability.
  - scenario: With A's protected pending record and real sign-in as independent B, request recovery; refuse access to A's record without deleting it or exposing plaintext.
uses-terms:
  - TERM-LIBRARY
  - TERM-SONG
  - TERM-ARRANGEMENT
  - TERM-PRINCIPAL
---

## Requirement

Installed application content and complete acknowledged anonymous data MUST remain usable, editable and consultable without connectivity on the retained origin. Anonymous offline success MUST remain an acknowledged local commit, not a promise against browser eviction, origin changes or device loss. External references retain their separate connectivity requirements.

Private content MUST obey BR-SESSION rather than inherit unconditional anonymous availability. Persistent private offline access MUST remain disabled at the connected first checkpoint and until protected records and their key lifecycle are qualified. Pending-work protection on failure and session termination remains mandatory even while private offline access is disabled. Private plaintext, usable access material and reusable decryption material MUST NOT become publicly cached recovery data.

Qualified private access MUST cover only the stable principal/session and resources/permissions successfully checked online by the service. The authoritative anchor is that successful scoped server check, not login alone. The maximum deadline is anchor plus eight hours, shortened by known session/authorization expiry, configured shorter bounds or observed logout/revocation/disablement. Settings may disable or shorten, never lengthen, that maximum. Offline edits, launch, refresh, restart and failed requests MUST NOT renew it. Uncertain trustworthy time or clock rollback MUST lock. Reconnection MUST revalidate current permissions before private access, export or replay even if the earlier lease has time remaining.

At expiry or unknown authority private views and usable plaintext MUST lock while protected principal-bound pending work remains recoverable only after same-principal reauthentication and fresh online resource/revision checks. Reconciliation MUST be explicit; retention MUST NOT authorize automatic replay or cross-account access. Voluntary termination MUST remain possible without forced plaintext export or silent loss after failed save/export. Observed revocation MUST lock affected views immediately; disconnected detection MUST NOT be described as instantaneous. Original anonymous work MUST survive private-session cleanup.

## Measurement

Verify anonymous continuity with connectivity disabled after installation: open complete prepared content, perform a valid edit, acknowledge a local commit and reopen its complete result. Record real storage/browser results separately from shell availability. The threshold is no network requirement for those anonymous actions and zero loss of acknowledged local fields on the retained origin.

For private qualification use real authenticated resource checks and independently controlled time. Test immediately before and exactly at the eight-hour boundary, each applicable earlier deadline, shortened/disabled configuration, resource-scope mismatch, logout/revocation/disablement, restart, clock rollback, uncertainty and reconnect with changed permissions. No real eight-hour wait or fabricated authentication establishes conformance. The threshold is zero unauthorized access at or beyond the effective deadline, zero local lease renewals and zero expansion of checked resource/capability scope.

Exercise failed save/export followed by voluntary termination, A-to-B switching, unauthenticated reload/restart, same-principal authorized recovery and same-principal revoked recovery at real session/storage boundaries. Assert zero usable private plaintext or reusable access/key material in public caches and zero cross-account exposure, forced export, automatic replay or silent pending-work loss. Verify record/key creation, unlock, lock, retention and deletion before enabling persistent private offline use. Explicit deletion of an inaccessible protected record must not reveal its content.

Retain source/run-bound assertions and useful redacted browser/failure evidence with synthetic data and independent assessment. The first connected checkpoint MUST use the same file-driven real-login fixture and application configuration for manual trials and automation, with isolated reset and safe refusal of missing/malformed settings and Production development defaults. Record this connected qualification separately; it does not close later protected-offline qualification, complete musical coverage or deployment. Authored criteria and passing execution MUST be reported separately.

The focused song sheet, exact-pitch editor and score reference remain subject to the same integrity and offline boundaries described above; their presence does not establish offline qualification.
