---
id: FR-OFFLINE
type: functional-requirement
title: Continue local work within explicit private authority
status: draft
derived-from:
  - UC-OFFLINE
  - BR-DURABILITY
  - BR-EDIT-GUARD
  - BR-ACCESS
  - BR-SESSION
  - CON-LOCAL-FIRST
  - CON-PLATFORM
verification:
  - scenario-ref: SB-OFFLINE
  - scenario-ref: SB-SESSION-LOCK
  - scenario-ref: SB-LEASE-EXPIRY
  - scenario-ref: SB-PRIVATE-REFUSE
  - scenario: With an installed application shell and acknowledged anonymous local content, open a song while disconnected; reconstruct its complete local arrangement without requiring private sign-in.
  - scenario: With a valid anonymous local arrangement in edit mode and no connectivity, commit a performed-note change; acknowledge only local durability and preserve that complete revision across reopening.
  - scenario: With persistent private offline access disabled at the connected checkpoint, lose connectivity while private work is pending; cease private access without known current authority, preserve protected principal-bound work and show that no service acknowledgement has been received.
  - scenario: With qualified protection and a still-valid resource-scoped offline read lease for song S, open S while disconnected; expose only the leased scope and distinguish local state from current service acknowledgement.
  - scenario: With a qualified current write lease and valid edit-mode command for S, retain an offline performed-note change; acknowledge only protected device retention and do not claim a service commit.
  - scenario: With a successful login but no successful server resource-authorization check, request offline access to S; refuse because login alone created no resource lease.
  - scenario: With an authoritative scoped authorization anchor at time t and no earlier expiry, reach exactly t plus eight hours while disconnected; lock private views and usable plaintext and retain only protected pending work.
  - scenario: With a scoped lease whose session expiry precedes t plus eight hours, reach the known session expiry; lock private content at that earlier instant without extending the lease.
  - scenario: With configured private access duration shorter than eight hours, reach that configured expiry; lock without using the product maximum as an automatic extension.
  - scenario: With application settings that attempt to lengthen private offline authority beyond eight hours, validate those settings; refuse that value without extending existing authority.
  - scenario: With a lease covering only S and no permission for T, request T while disconnected; refuse without revealing T or broadening the lease scope.
  - scenario: With an existing lease anchored at t, restart the application offline before expiry; retain the same authoritative deadline and never mint a new anchor from startup.
  - scenario: With pending private work and an existing lease, perform an offline edit before expiry; retain its original deadline without renewal from local activity.
  - scenario: With an existing lease and a failed background authorization request, process that failure; grant no renewal and lock whenever authority is unknown.
  - scenario: With a retained authorization deadline and detected clock rollback, evaluate private access; lock instead of granting additional time.
  - scenario: With retained private work and uncertain trustworthy elapsed time, request private access; lock rather than assume an unexpired lease.
  - scenario: With an otherwise unexpired offline lease and permissions downgraded remotely, reconnect; require fresh resource checks before exposure or replay and apply the current lower capability without automatic write replay.
  - scenario: With a previously valid scope and newly observed revocation, process the revocation; immediately lock affected private views and operations and retain no usable plaintext authority.
  - scenario: With protected pending work and current permission revalidated for the same stable principal, request draft recovery online; expose only the authorized scope for explicit revision comparison and apply no queued mutation automatically.
  - scenario: With principal A's retained record and a newly authenticated independent principal B, request recovery of A's record; refuse display, import, export and replay while preserving A's protected record.
  - scenario: With the same reauthenticated principal but revoked song permission, request retained-draft recovery; refuse access and replay while permitting explicit local deletion of the protected record.
  - scenario: With private pending work and a failed save followed by failed authorized export, confirm voluntary logout with retention; terminate the session, lock content and preserve the protected record without forcing export or discarding work.
  - scenario: With principal A's protected pending work, switch to principal B; close A's context before opening B's and expose none of A's content, keys or drafts to B.
  - scenario: With private-session cleanup and an original anonymous library, expire the private session; preserve the anonymous source without turning protected private work into anonymous content.
uses-terms:
  - TERM-LIBRARY
  - TERM-SONG
  - TERM-ARRANGEMENT
  - TERM-PRINCIPAL
  - TERM-MODE
---

## Requirement

The installed product MUST allow opening, browsing, editing, locally saving and consulting prepared anonymous content without connectivity. This includes complete local arrangements and repertoire navigation, not just shell loading. Local success MUST mean a complete validated atomic device commit under edit admission; failure MUST preserve the previous durable revision. External reference targets MUST retain their separate connectivity limitations. Anonymous work MUST remain separate from private account content and its later explicit claim.

Private content MUST NOT inherit unconditional anonymous offline availability. The first usable private-library checkpoint MUST require real connectivity and keep persistent private offline access disabled. It MUST still protect pending work when a session ends or a request fails. Disabling offline editing MUST NOT authorize plaintext retention, silent loss, forced export or blocked logout. The same selected file-driven identity fixture and application settings MUST support manual and automated real-login journeys; missing/malformed configuration MUST refuse safely, reset MUST stay execution-scoped, and Production MUST reject development identities and unsafe fallback settings. This checkpoint MUST NOT be called full protected-offline qualification or remove that later capability from scope.

Before persistent private offline editing is enabled, the product MUST qualify account-bound protected records and their key creation, unlock, lock, retention and destruction lifecycle using established protection mechanisms. Reload/restart MUST NOT expose retained work while unauthenticated. Plaintext account namespacing, hidden controls and public application caches MUST NOT count as protection. Public caches MUST contain neither private responses nor reusable session/decryption material.

Qualified private offline access MUST be limited to the stable principal, session, resources and permissions checked successfully online by the service. Its anchor MUST be the authoritative server-recorded instant of that resource authorization check; sign-in alone, a cached role and a generic success MUST NOT start or renew it. Expiry MUST be the earliest of anchor plus eight hours, known session/authorization expiry and observed logout/revocation/disablement. Application configuration MAY disable or shorten that bound and MUST NOT extend it. Offline activity, launch, refresh, restart and failed requests MUST NOT renew authority. Clock rollback and uncertain trustworthy time MUST lock rather than extend it. Offline lease verification MUST use independently controlled time including the exact boundary, not a real eight-hour wait or fabricated authentication.

During an eligible lease the product MUST enforce its resource/capability scope and edit guard and distinguish protected pending changes from acknowledged private revisions. At expiry or unknown authority it MUST stop authorized operations, lock private views and remove usable plaintext/session/decryption material from the active context while retaining only protected principal-bound work. Observed revocation/disablement MUST lock immediately; the product MUST NOT claim instant knowledge of revocation while disconnected. Reconnection MUST require fresh online permission checks before private reading, export and write replay even if a previous lease has not expired. A successful fresh scoped check MAY renew only the current authorized scope.

Voluntary logout MUST warn about pending work and offer save/sync, explicit authorized export and explicit discard. Failed save/export MUST default to protected retention without preventing termination. Account switch MUST close the prior principal's context before opening another. Recovery MUST require the same stable provider subject and tenant/issuer, fresh online resource permission and current revision checks; display-name/email equality is insufficient. Draft reconciliation MUST be explicit, never automatic replay. Refusal MUST preserve protected work and current acknowledgement, without making retention an access right. A revoked principal MUST still be able to explicitly delete its local protected record without reading/exporting it. Private-session cleanup MUST preserve the original anonymous library.

The product MUST distinguish unsaved work, protected device retention, service synchronization, service acknowledgement, conflict, authorization lock and failure in ordinary musician-facing language. A local write MUST NOT be called private-library recovery on another device. Complete acknowledged remote reconstruction remains FR-PERSIST's separate service obligation. Verification MUST exercise actual storage and real identity/session boundaries with synthetic data and redacted evidence, including voluntary termination, expiry, restart, user switch, scoped lease bounds, reconnect/downgrade and authorized/refused same-principal recovery.

## Rationale

Offline preparation is useful only when its authority and recovery promises are honest. Anonymous continuity, bounded private access and protected pending work must coexist without leaking one musician's data or losing it at session end.
