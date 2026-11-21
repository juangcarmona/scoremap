---
id: BR-DURABILITY
type: business-rule
title: Complete acknowledged commits and explicit recovery boundaries
status: draft
applies-to: [BC-RECOVERY]
uses-terms: [TERM-LIBRARY, TERM-ARRANGEMENT, TERM-PRINCIPAL, TERM-REPERTOIRE]
---

## Rule

Anonymous browser success acknowledges one atomic complete valid local library revision. Private-service success acknowledges a conditional authorized service commit, never merely a device write. A private song commit includes its shared form, every arrangement/part/event/voicing/binding and song-owned configuration/content plus revision/history and retry receipt as one complete boundary. Current permission/revocation checks and expected-revision comparison serialize with mutation; a concurrent revoke cannot be bypassed by cached authority. A new private song's owner is derived from trusted session context. Library membership changes caused by song deletion commit with that deletion.

Principal-owned preferences, reusable presets and reusable device configurations have separate explicit revisions/acknowledgements. Applying them copies the needed content into the song commit; no hidden transaction across independent stores is claimed. Service multi-song operations declare their atomic scope and per-boundary receipts; partial progress is reported and recoverable rather than called total success. No transaction spans browser and service.

Content revision is monotonic and separate from schema version. Each successful private-service mutation preserves an immutable complete recoverable revision until owner purge. Current authorized history reads/restore follow capability rules. Restoring a revision creates a new revision without erasing intervening history or restoring obsolete grants.

Native Android success acknowledges the complete valid selected local operation, its expected revision, retained history and stable command receipt without login or service acknowledgement. A song commit covers its complete shared form, arrangements, parts, events, exact pitches, bindings and all owned content. A set commit preserves its ordered membership and its own revision history. Song deletion and caused active-membership changes commit together without losing the affected sets' acknowledged history. Retain acknowledged native song/set revisions without automatic expiry until separately confirmed applicable permanent purge. Inspection is read-only; an admitted historical restore validates current dependencies and creates a new acknowledged revision preserving intervening history.

A native selected song or complete ordered-set import has one atomic activation boundary covering the entire copied graph, required copied musical definitions, identity mapping, initial destination histories and retry receipt. Required owned PDF bytes and integrity associations must have qualified publication before success is acknowledged. No partial song/set or unavailable attachment may become an acknowledged import. Attachment staging, interrupted publication and crash recovery must preserve prior acknowledged data and reconcile the command; temporary transport/staging progress is not import success. Separately owned existing resources/preferences are not silently enrolled in this transaction or modified. This local boundary claims no transaction with the source installation, external share route or private service.

Autosave safely coalesces/serializes changes and distinguishes unsaved draft, protected on this device, syncing, service-acknowledged, conflict, blocked authorization and failure in musician-friendly language where those states apply. Only service acknowledgement means saved to the private-service library; native local save clearly means acknowledged on this installation. Old responses cannot overwrite newer interaction drafts. Failure never reports success or replaces the previous durable revision; retain pending service work under session-protection policy. A timeout may have committed: reconcile the stable context/resource/command retry identity with its receipt before another write. Retrying the same command does not duplicate revisions or imported copies. Stale expected revisions refuse, preserving latest acknowledgement and recoverable draft; explicit comparison/copy/restore replaces silent merge.

Unreadable/unknown schema versions are reported without replacement. Migrations preserve a pre-migration recovery copy, validate complete candidates, activate atomically and keep the original on failure. Backup/restore and release rollback must be compatible with stored schema; incompatible rollback is refused instead of damaging data. Device refresh/restart cannot lose acknowledged changes. Protection of unacknowledged private-service work on session termination is required independently of whether persistent offline editing is enabled. Native local recovery does not depend on a service session.

## Rationale

Keep each authority and acknowledgement boundary explicit without losing completeness, stale-write refusal, recoverable history or failure honesty.

## Examples

A network timeout shows unconfirmed service save until receipt reconciliation. A failed transaction leaves revision r intact. A restored historical revision becomes a new revision. A native set import whose PDF publication fails is not acknowledged and leaves the destination's previous music unchanged.

## Exceptions

None. Local test fixtures do not establish real service or cross-device acknowledgement. Native local durability does not imply remote backup, live synchronization or protection against device loss.
