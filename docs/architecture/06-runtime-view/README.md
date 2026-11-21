---
title: Runtime view
arc42-section: "06"
description: Mutation, failure and recovery interactions
---

# 6. Runtime view

In the anonymous browser realization, a mutation is admitted only in edit mode, produces a valid candidate and is serialized with other local mutations. The IndexedDB transaction compares the expected revision and atomically writes the next snapshot. The UI acknowledges success after commit. Storage failure or conflict preserves the previous durable revision and exposes a recovery/export path; unreadable storage is never overwritten during startup.

<!-- pdac:cite id="BR-DURABILITY" digest="sha256:d822f18f163b8685937ae5a3137dc04ef4a2d5947ab7a9954245bd965b72fa45" -->

Opening that browser application reads and validates the stored envelope. A first use with no record produces a valid empty library. Performance mode permits musical navigation while all musical content commands remain guarded. Browser PDF page memory belongs to its deferred PDF capability; this does not waive the native target's complete required PDF storage/transfer boundary.

<!-- pdac:cite id="BR-EDIT-GUARD" digest="sha256:20e678c4743404c64a51c01e4446026ac95811827d2f5e1c641839291ad32718" -->

## Native Android runtime target

[ADR-0010](../09-architecture-decisions/ADR-0010-build-a-separate-native-android-application.md) selects installation-local operation without login or backend. [Android target](../05-building-block-view/android-target.md) owns the planned local acknowledgement, retained song/set history, recoverable deletion, separate purge and complete selected-graph file activation mechanics. Native mutations retain edit-mode, expected-revision and complete domain-validity guards; local acknowledgement must not imply service save. These runtime paths need actual implementation and host/device verification; the existing IndexedDB and private-service interactions are separate realizations.

## Private application: one authorized commit

The API host and Library module implement the following interaction under ADR-0003/0004. [Section 08](../08-crosscutting-concepts/README.md) owns the shared admission/authority rules; the applied arrangement Product Change defines the commit aggregate.

1. The editor retains a recoverable local candidate and sends a command with its expected server revision and retry identity, using the protected BFF session. UI state distinguishes local durability from server acknowledgement.
2. The HTTP boundary validates the request/session/CSRF context and invokes the module use case, not a DbContext. The use case enforces resource capability, edit admission and domain invariants independently of the rendered UI.
3. Infrastructure conditionally commits the accepted aggregate, new revision and recovery history in PostgreSQL. Revision comparison and authorization/revocation handling must close their concurrency race within the accepted transaction policy.
4. Only the acknowledged committed result updates the server-saved state. An older response cannot overwrite a newer local draft. Other devices reconstruct the authorized complete revision through the same application boundary.
5. Invalid or unauthorized commands do not mutate. A stale revision returns a predictable conflict and retains pending work. An ambiguous timeout is reconciled with the commit/retry identity before another write; it is not treated as proof of rollback. Session expiry/revocation stops replay under the accepted private-cache policy.

Real HTTP/PostgreSQL tests must exercise these paths and failure timing; analyzer success cannot prove this runtime sequence. Production qualification uses the production artifact contract from [section 07](../07-deployment-view/README.md), separately from development execution and actual operator deployment.

## Shared context and independently routed performance

The arrangement workspace keeps section, repeat occurrence, identified measure and harmonic event as read-only selection. Each device view derives active notes at the same exact rational position from its assigned parts and bindings; durations can hold notes into later harmonic contexts in the same measure. Equal-pitch events in different parts retain distinct identities. Multiple sound layers routing the same event do not fabricate extra musical events. Empty results clear performed highlights immediately. Each device's local octave span is independent of physical range and musical content.

Unrouted occurrences have explicit part views, including when a keyboard or binding is removed. Those operations retain performed music unless the user explicitly removes the owning part or confirms shared-form reconciliation. Destructive previews identify affected arrangements, voicings, numbered part occurrences and assignments before the complete guarded command executes. Reordering changes positions while preserving identifiers and valid references; invalid timing or physical range changes refuse without clipping notes.

Copying an arrangement remaps its owned graph and keeps shared form references. Explicit independent song copying remaps the full song-owned graph without copying repertoire membership or live personal-resource authority. Copied preset provenance remains a value snapshot. Identifier maps and repeat navigation treat opaque strings as data, including prototype-like names.
