---
title: Cross-cutting concepts
arc42-section: "08"
description: Storage, backup, update and trust mechanisms
---

# 8. Cross-cutting concepts

The anonymous envelope initially used schema version 1; the current candidate accepts versions 1 and 2 with a monotonic revision and explicit legacy migration. Load and import validate complete content and associations; future migrations must be explicit and atomic. Unknown versions stop without writes. Anonymous import is confirmed replacement; private import preserves existing songs and uses explicit independently owned copies. IDs are opaque stable browser-generated UUIDs.

<!-- pdac:cite id="BR-BACKUP" digest="sha256:0ca300361becac0a9858d098ab1e029b5bc1dfe41a06a58ecc40408fee32ed3b" -->

External URLs accept only HTTP(S), text uses React escaping, and no application code is loaded from imported content. App-shell caching is separate from personal data. A waiting service worker updates only after an explicit user action, avoiding an unexpected performance interruption.

<!-- pdac:cite id="BR-REFERENCES" digest="sha256:f6c63aa91b8cd5dc754520d4015424c3c56811d90a886f62a895c9db99ce9ce3" -->

## Accepted server target: admission, authority and transactions

The following mechanisms apply to the accepted architecture in ADR-0003/0004 and its implemented private-library candidate after the validated arrangement Product Change. Integration, independent review and production qualification remain separate gates.

Content admission combines authenticated resource capability, edit-mode admission, domain validation and expected-revision checks; none substitutes for another. Direct/non-HTTP use-case calls cannot bypass validation or capability checks. Reads, nested resource references, history, export, restore and role changes require the same explicit ownership policy. The server derives identity/ownership from trusted session context, never a submitted owner ID.

The existing content guard remains an independent invariant.

<!-- pdac:cite id="BR-EDIT-GUARD" digest="sha256:20e678c4743404c64a51c01e4446026ac95811827d2f5e1c641839291ad32718" -->

The accepted account-library commit aggregate is server-authoritative after transaction acknowledgement. Validation, musical content/configuration changes, revision comparison/increment and recoverable revision creation commit together. Transport timeouts and retries use idempotency/reconciliation rather than claiming failure proves no commit. Stale or unauthorized work never silently overwrites acknowledged data; pending device work remains separately recoverable under the accepted session policy. A migration failure preserves the prior recoverable version. EF Core InMemory tests cannot establish PostgreSQL atomicity, isolation or migration correctness.

These mechanisms carry the acknowledged-durability rule across the new persistence boundary. Device protection and the server aggregate commit are separate transactions, with explicit recovery and no cross-boundary atomicity claim.

<!-- pdac:cite id="BR-DURABILITY" digest="sha256:6b075527861da086b9571e8d117c7844348a437e363423bca46f60cc83b02e0b" -->

The BFF retains provider tokens server-side and uses protected HttpOnly session cookies, production-appropriate Secure/SameSite settings and CSRF protection. Logout, expiry and account switch have explicit private-cache/queue behavior; the service worker must not cache private API data as application assets. Production identity remains a separate integration choice, not an obligation to deploy a new identity server. See [section 07](../07-deployment-view/README.md) for trusted ingress and private configuration boundaries.

No mediator, generic repository, distributed cache, message bus, outbox or separate identity platform is mandatory. Add one only for an accepted behavior and demonstrable delivery/operating need, with its own failure tests. Prefer explicit typed handlers, mapping and DI; contracts and generated OpenAPI clients prevent database entities and provider vocabulary leaking into the UI.


## Candidate admission and persistence mechanisms

The current private adapter derives the stable principal from validated OIDC issuer/subject claims, protects provider tokens in server-side session tickets and checks the provider session online. Current database song grants remain independent of the session cookie. Origin/anti-forgery admission precedes mutation; typed application handlers enforce edit mode and domain validation for musical content. A transaction advisory lock serializes grant changes, expected-revision checks, complete song updates/history and retry receipts. An acknowledged response is produced only after commit. Receipt reads recheck current resource access.

Principal-bound recovery keys are protected on the server; browser pending records contain AES-GCM ciphertext and opaque references. Successful commits bind the covered song identities into the retained key scope. Unlock requires the same principal and fresh resource checks, with explicit export/comparison and no automatic replay. Persistent private offline editing stays disabled. These mechanisms belong to the [candidate module](../../../src/modules/ScoreMap.Modules.Library/LibraryModule.cs); their tested behavior and remaining qualification are recorded in delivery evidence.

<!-- pdac:cite id="BR-DURABILITY" digest="sha256:6b075527861da086b9571e8d117c7844348a437e363423bca46f60cc83b02e0b" -->
<!-- pdac:cite id="BR-ACCESS" digest="sha256:fcc173c80ae4a5903dbeb2e11c141cb6ee8d03382c812ebc527d5065347b72c9" -->
<!-- pdac:cite id="BR-SESSION" digest="sha256:a8c63526b6fe52375791a737ed14280609d00938808928153d49fd2627416326" -->


## Notation and preference acknowledgement

The [shared formatter](../../../src/shared/music/notation.ts) preserves spelled notes, octaves and complete chord symbols while presenting Anglo-American, fixed-name Latin or dual names. A shared context keeps Library and Sketch rendering consistent without introducing feature cycles. The [preference feature](../../../src/features/notation/NotationPreference.tsx) handles display/pending/error states; localized labels are never parsed back into musical data.

Anonymous preference uses an independent device key. Signed-in preference reads ignore that key and use only the current stable principal's [typed settings handlers](../../../src/modules/ScoreMap.Modules.Library/Application/SaveNotationHandler.cs). A separate PostgreSQL preference revision and metadata command receipt commit together; stale changes refuse and lost acknowledgements reconcile without duplicating revisions. Preference selection is presentation configuration, allowed during performance without bypassing the musical edit guard or changing a song/library revision. Account switch/lock removes principal query state. Rich event/arrangement notation fixtures remain a separate pending acceptance boundary.

## Exact performed editing and independent reusable resources

The interactive candidate keeps played-note previews separate from acknowledged library content. Its apply command compares the selected voicing and part occurrences to their opening snapshot, validates the complete graph and preserves occurrence identity/timing. Undo replaces the prior complete arrangement only when its current value still matches the acknowledged post-edit arrangement. Unrelated or conflicting updates cannot be overwritten by an old undo. Cancel and view changes produce no content command. Before leaving an unapplied preview the UI offers a deliberate discard decision; applied-but-unacknowledged private content uses the existing encrypted pending-work boundary.

The piano reuses chromatic geometry while marking theoretical classes and exact performed occurrences separately. Individual native key targets remain at least 48 CSS pixels; bounded horizontal scrolling preserves geometry on small or enlarged-text views. Pitches outside the selected octave span remain named. Spelling plus written octave determines absolute pitch; the absolute 0..127 bound does not impose an additional unsupported written-octave restriction on enharmonic spelling. Identification orders octave-bearing pitches by actual register and proposes identities without changing their source notes.

Reusable voicings have independently scoped content and conditional revisions. Anonymous presets use a separate IndexedDB database; private presets use principal-keyed PostgreSQL records and metadata-only retry receipts through typed application handlers. Applying a named version creates a new independent arrangement voicing and note occurrences with copied provenance. Updating or deleting the personal resource leaves every song copy unchanged. The song grant confers no personal-resource access.

Resource backups declare their separate scope. Confirmed preset import records opaque destination IDs and command IDs before any personal-resource mutation. After a failure/reload, the same source file resumes that mapping and compares fresh authorized current resources before continuing. This journal stores neither musical content nor usable credentials. A complete library/song commit and separately acknowledged personal-resource import are deliberately distinct transactions. Owner-scope query caches are cleared when the active application context closes.


## Known session deadlines and protected pending review

The candidate session response carries a non-secret fresh-login session identifier, authoritative check time and the earliest known cookie/provider-token expiry. Browser authority charges the full request duration, checks monotonic and wall-clock elapsed time, and expires independently of background polling. Clock rollback, elapsed-clock reset and overlong/invalid metadata fail closed. A late poll cannot revive an expired context. These values describe session lifetime; they confer no song permission or private offline lease.

Every private adapter request is bound to a cancellable context generation and checks that generation and its deadline before and after asynchronous responses. Lock aborts requests, releases the working encryption key, retry plaintext and capability/version caches, cancels session queries and unmounts private views. Normal effect cleanup can reopen a store only through a new authorized load; explicit termination cannot. Original anonymous storage is independent. Protected ciphertext admitted before termination may finish retention, while its subsequent write request is refused.

A reopened pending command blocks new musical edits until an explicit decision. Review first obtains a same-principal current-resource unlock; original-save retry uses the retained command ID, expected revisions and recovery-key reference. A lost acknowledgement reconciles the existing receipt without a second revision. Conflicts and permission refusal retain the protected record; no automatic replay or merge occurs. Conditional record removal prevents an older acknowledgement from deleting a different pending command. Explicit local removal remains available without decrypting the refused record. For a stale original retry, the musician can explicitly save one pending song as a separate private copy. An atomic local journal adds only opaque source/destination identities and a command ID to the original protected record before dispatch; its musical ciphertext remains unchanged. Copying remaps the complete owned graph, preserves descriptive external preset provenance and leaves existing content, memberships and history untouched. A lost response is reconciled by a fresh owner-authorized complete comparison at the retained destination identity. Changed/deleted destinations refuse rather than create another copy. Legacy copies enter the existing atomic migration boundary, retain their raw source at history revision 0 and reconstruct the same generated graph on retry. The original protected draft remains until explicit removal; no automatic conflict merge occurs.

Private song/preview exports recheck current scope immediately before download. Personal-resource exports fetch their independently owned current collection; historical export fetches the chosen revision through the authorized history endpoint again. A cached visible label or previously loaded historical body is insufficient. The optional bounded private-offline capability defaults to disabled and requires explicit protected admission; its implementation and qualification boundaries are recorded below.


## Protecting the latest interaction before transport

The [prepared-save port](../../../src/features/library/storage.ts) separates local retention from ordered service transport. Normal commands derive their latest complete valid candidate immediately; a generation check permits an older acknowledgement to advance the known service revision without replacing newer admitted content. Import and history reconciliation remain admission barriers. A failed initial protection step sends no save request and remains explicitly retryable. Once sent, a request keeps its exact command/body/expected revisions for reconciliation; an unknown outcome never authorizes automatic rebasing.

The [atomic pending store](../../../src/features/library/protectedPending.ts) keeps one latest ciphertext per stable principal and random editing context in the existing version-1 IndexedDB store. Generation and matching-command checks prevent older writes or acknowledgements from replacing/removing a newer record. Legacy principal-string records remain readable alongside compound keys; unsupported versions are preserved. Selection, review and removal act on the chosen record. Explicit principal removal leaves anonymous data and other principals untouched. See [ADR-0006](../09-architecture-decisions/ADR-0006-retain-protected-drafts-by-editing-context.md).

Voluntary logout waits for latest local retention, reports failure truthfully, then closes the cancellable context and submits provider termination without waiting for transport. A bounded request timeout handles unknown responses. An unconfirmed import is immediately exposed for explicit review and blocks new content changes until resolved. Neither encrypted device retention nor its opaque counters grant resource permission or private offline authority.


## Recoverable revision provenance

New history rows retain the trusted acting principal, operation, base song revision and command identity atomically with the musical content and receipt. A restore additionally identifies the selected source revision, independently of its current base. Imported legacy source snapshots identify their retention operation without attributing original authorship to the importer. Additive nullable columns leave older complete rows and their timestamps unchanged; the interface states when older authorship was not recorded. History authorization remains current song scope, and purge removes content and this metadata together.


## Selected transfer and anonymous claim

Private file import and same-origin anonymous claim share an explicit complete-song selection preview. Selection preserves source ordering and all song-owned content; repertoire memberships are limited to selected songs and can be excluded. Identity-preserving collisions refuse, with an explicitly selected independent-copy route. That route remaps complete internal identities before confirmation; the existing protected original-command receipt preserves its exact destination identities after an ambiguous response. The anonymous store and original source file remain untouched. Origin transfer still requires export from the old origin.

Declared source kind, schema version, revision, selected counts and copy choice travel inside the protected command and its stable retry body. The service validates the new destination scope, derives ownership from the session and retains source provenance in history independently of its destination revision/actor. These source declarations are descriptive, never authority. After acknowledgement, a separate fresh authorized read compares the complete admitted songs and limited repertoires. A failed readback reports acknowledged-but-unverified reconstruction and retains the source; it does not claim rollback or create another copy. Independent personal resources keep their separate acknowledgement/import boundaries.

## Candidate personal-resource recovery

The [personal journal](../../../src/features/library/personalPending.ts) encrypts a complete original personal command before its service request. Opaque principal/editing-context/resource keys isolate records; AES-GCM binds ciphertext to that slot. A matched service acknowledgement removes only the confirmed command. Lost replies retain the original command for explicit authenticated review/retry/export/removal. Other principals cannot list or unlock its usable content. Personal protection and song protection are separately acknowledged; a failed setting does not prevent an independent valid song commit. Voluntary termination checks both retention boundaries.

[ADR-0007](../09-architecture-decisions/ADR-0007-separate-personal-resource-recovery-keys.md) records the proposed key-purpose separation. Existing protected song keys keep their original semantics and receive the `song` default in an additive schema migration. Personal endpoints select only `personal` keys with a separate server protection context. Song commit binding refuses a personal key; a song grant does not expose another principal's settings. Authenticated requests still revalidate the real provider. Neither purpose creates an offline lease.

The [configuration store](../../../src/features/library/deviceConfigurations.ts) and typed device-configuration handlers give reusable physical ranges a separate principal-owned revision/receipt boundary. Song application copies a new device identity; later resource changes do not cascade into the copied song. Anonymous resources stay in an independent local store. Single-resource version-1 transfer is explicit and non-destructive. [Checkpoint evidence](../../evidence/music/personal-resources.md) records execution separately from integration and deployment.

Session ticket creation inserts a new random identity. Renewal updates only an existing unexpired row; a late renewal cannot recreate a session deleted by logout. The [isolated storage probe](../../../tests/runtime/ScoreMap.SessionProbe/Program.cs) exercises that ordering against real disposable PostgreSQL without issuing authentication cookies.


## Bounded protected offline preparation

[ADR-0008](../09-architecture-decisions/ADR-0008-prepare-bounded-private-offline-copies.md) records explicit scoped authorization and acknowledged encrypted-cache admission before in-memory offline authority. A server transaction anchors the configured maximum to the current principal/session and actual resources; the earliest known bound wins. Independent wall and elapsed clocks fail closed on expiry or rollback. Pending commands remain protected without service acknowledgement. Reconnect discards active authority before fresh sign-in and explicit reconciliation. Restart cannot reconstruct usable keys from public caches. See [execution evidence](../../evidence/music/private-offline.md) for actual browser coverage and the separate exact eight-hour domain witness.


## Direct nested reads and exact retention examples

The private arrangement endpoint selects a child from the current principal-authorized library query. Resource knowledge and ownership of a different song grant no access; absent and inaccessible children share a non-content refusal. [Canonical execution evidence](../../evidence/music/canonical-private-boundaries.md) separates real nested reads, a revision-21 editor downgrade, exact revision-17/18/19 retention and dual notation from attachment delivery and integration approval.

Recovery-key unlock also checks the authority needed to expose a previously editable draft. New song keys carry distinct read and write sets derived on the server, including offline-issued keys. Current viewer reading cannot unlock a key whose checked write set included that song. Originally read-only baseline songs remain read checks. Atomic save extends the scopes under the existing permission/write serialization. The nullable legacy footprint fails closed against its original scope while preserving key and ciphertext bytes; independent personal keys keep their own purpose boundary. [ADR-0007](../09-architecture-decisions/ADR-0007-separate-personal-resource-recovery-keys.md) records this compatibility limit.
