---
title: Cross-cutting concepts
arc42-section: "08"
description: Storage, backup, update and trust mechanisms
---

# 8. Cross-cutting concepts

The initial stored envelope has schema version 1 and a monotonic revision. Load and import validate complete content and associations; future migrations must be explicit and atomic. Unknown versions stop without writes. Import is confirmed replacement rather than implicit merge. IDs are opaque stable browser-generated UUIDs.

<!-- pdac:cite id="BR-BACKUP" digest="sha256:0ca300361becac0a9858d098ab1e029b5bc1dfe41a06a58ecc40408fee32ed3b" -->

External URLs accept only HTTP(S), text uses React escaping, and no application code is loaded from imported content. App-shell caching is separate from personal data. A waiting service worker updates only after an explicit user action, avoiding an unexpected performance interruption.

<!-- pdac:cite id="BR-REFERENCES" digest="sha256:f6c63aa91b8cd5dc754520d4015424c3c56811d90a886f62a895c9db99ce9ce3" -->

## Accepted server target: admission, authority and transactions

The following mechanisms apply to the accepted next architecture in ADR-0003/0004, pending Product Change #20 and implementation. The current device-only semantics above remain implemented reality.

Content admission combines authenticated resource capability, edit-mode admission, domain validation and expected-revision checks; none substitutes for another. Direct/non-HTTP use-case calls cannot bypass validation or capability checks. Reads, nested resource references, history, export, restore and role changes require the same explicit ownership policy. The server derives identity/ownership from trusted session context, never a submitted owner ID.

The existing content guard remains an independent invariant.

<!-- pdac:cite id="BR-EDIT-GUARD" digest="sha256:20e678c4743404c64a51c01e4446026ac95811827d2f5e1c641839291ad32718" -->

The accepted account-library commit aggregate is server-authoritative after transaction acknowledgement. Validation, musical content/configuration changes, revision comparison/increment and recoverable revision creation commit together. Transport timeouts and retries use idempotency/reconciliation rather than claiming failure proves no commit. Stale or unauthorized work never silently overwrites acknowledged data; pending device work remains separately recoverable under the accepted session policy. A migration failure preserves the prior recoverable version. EF Core InMemory tests cannot establish PostgreSQL atomicity, isolation or migration correctness.

These mechanisms carry the existing acknowledged-durability rule across the new persistence boundary; #20 and #26 determine the aggregate and recovery policies, not an implicit transaction spanning browser and server.

<!-- pdac:cite id="BR-DURABILITY" digest="sha256:6b075527861da086b9571e8d117c7844348a437e363423bca46f60cc83b02e0b" -->

The BFF retains provider tokens server-side and uses protected HttpOnly session cookies, production-appropriate Secure/SameSite settings and CSRF protection. Logout, expiry and account switch have explicit private-cache/queue behavior; the service worker must not cache private API data as application assets. Production identity remains a separate integration choice, not an obligation to deploy a new identity server. See [section 07](../07-deployment-view/README.md) for trusted ingress and private configuration boundaries.

No mediator, generic repository, distributed cache, message bus, outbox or separate identity platform is mandatory. Add one only for an accepted behavior and demonstrable delivery/operating need, with its own failure tests. Prefer explicit typed handlers, mapping and DI; contracts and generated OpenAPI clients prevent database entities and provider vocabulary leaking into the UI.


## Candidate admission and persistence mechanisms

The current private adapter derives the stable principal from validated OIDC issuer/subject claims, protects provider tokens in server-side session tickets and checks the provider session online. Current database song grants remain independent of the session cookie. Origin/anti-forgery admission precedes mutation; typed application handlers enforce edit mode and domain validation. A transaction advisory lock serializes grant changes, expected-revision checks, complete song updates/history and retry receipts. An acknowledged response is produced only after commit. Receipt reads recheck current resource access.

Principal-bound recovery keys are protected on the server; browser pending records contain AES-GCM ciphertext and opaque references. Successful commits bind the covered song identities into the retained key scope. Unlock requires the same principal and fresh resource checks, with explicit export/comparison and no automatic replay. Persistent private offline editing stays disabled. These mechanisms belong to the [candidate module](../../../src/modules/ScoreMap.Modules.Library/LibraryModule.cs); their tested behavior and remaining qualification are recorded in delivery evidence.

<!-- pdac:cite id="BR-DURABILITY" digest="sha256:6b075527861da086b9571e8d117c7844348a437e363423bca46f60cc83b02e0b" -->
<!-- pdac:cite id="BR-ACCESS" digest="sha256:fcc173c80ae4a5903dbeb2e11c141cb6ee8d03382c812ebc527d5065347b72c9" -->
<!-- pdac:cite id="BR-SESSION" digest="sha256:a8c63526b6fe52375791a737ed14280609d00938808928153d49fd2627416326" -->
