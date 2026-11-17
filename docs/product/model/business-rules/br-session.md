---
id: BR-SESSION
type: business-rule
title: Protected session end and scoped private offline lease
status: draft
applies-to: [BC-LIBRARY, BC-SKETCH, BC-RECOVERY]
uses-terms: [TERM-PRINCIPAL, TERM-SONG]
---

## Rule

Use established identity integration with real login, secure session lifecycle and protected server-mediated browser sessions; do not expose provider access/refresh tokens to browser storage. Session/anti-forgery checks and current resource authorization are independent. A development identity graph is not Production qualification.

Voluntary logout/switch warns about pending work and offers save/sync, explicit export while authorized and explicit discard. Failed save/export defaults to protected retention; never force plaintext export, silently discard or prevent session termination. End the old account context before switching; the next principal cannot display/import/export/replay its drafts.

On expiry, unknown authority or observed revocation/disablement, stop writes and lock private views/work. Remove usable session/decryption/plaintext material from active views and memory and retain only an account-bound protected recovery record. Reload/restart cannot make it readable while unauthenticated. Account-namespaced plaintext storage and hidden controls are insufficient; public application caches contain neither private responses nor reusable key/session material. Established protection mechanisms require a verified record/key creation, unlock, lock, retention and deletion lifecycle before persistent private offline editing is enabled. Until that boundary is proven, it stays disabled, including the connected first checkpoint; pending-work termination protection remains required.

Recovery requires the same reauthenticated stable provider subject and tenant/issuer plus fresh online checks for every covered resource and current revision. No email/display-name match, cached role or automatic queued replay suffices. Explicitly compare/reconcile before applying the draft; preserve latest acknowledged revision and protected work on refusal. Revoked work remains inaccessible for read/export/replay, but explicit local protected-record deletion is permitted. Preserve the original anonymous library.

Qualified private offline access has a maximum eight-hour lease anchored to the server-recorded successful online check of the current stable principal/session AND permissions for the particular resources. Login alone, health response or generic success does not start it. Retain resource/permission scope. Expiry is the earliest of anchor+8 hours, known session/authorization expiry or observed logout/revocation/disablement. Configuration may disable/shorten, never lengthen. Offline activity, app launch/reload/restart and failed/background requests cannot renew authority. The server timestamp is authoritative; uncertainty or clock rollback locks rather than extends it. Reconnection requires fresh permission checks before private access, export or write replay, even with an otherwise unexpired lease. A successful scoped online recheck may renew only current permissions.

At expiry lock usable plaintext and authorized operations, preserving protected work for same-principal online revalidation; never promise instantaneous unobserved offline revocation or erasure of already exported copies.

## Rationale

Allow safe session termination and bounded rehearsal access without trading privacy for hidden data loss.

## Examples

At the exact eight-hour boundary a disconnected private view locks. A new account cannot recover the old account's retained draft. Reauthentication by the original principal still refuses exposure after permission revocation.

## Exceptions

Anonymous offline content remains separate. The initial private checkpoint requires connectivity and does not claim qualified private offline behavior.
