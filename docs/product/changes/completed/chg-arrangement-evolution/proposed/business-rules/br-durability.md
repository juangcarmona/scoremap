---
id: BR-DURABILITY
type: business-rule
title: Complete acknowledged commits and explicit recovery boundaries
status: draft
applies-to: [BC-RECOVERY]
uses-terms: [TERM-LIBRARY, TERM-ARRANGEMENT, TERM-PRINCIPAL]
---

## Rule

Anonymous success acknowledges one atomic complete valid local library revision. Private success acknowledges a conditional authorized service commit, never merely a device write. A private song commit includes its shared form, every arrangement/part/event/voicing/binding and song-owned configuration/content plus revision/history and retry receipt as one complete boundary. Current permission/revocation checks and expected-revision comparison serialize with mutation; a concurrent revoke cannot be bypassed by cached authority. A new private song's owner is derived from trusted session context. Library membership changes caused by song deletion commit with that deletion.

Principal-owned preferences, reusable presets and reusable device configurations have separate explicit revisions/acknowledgements. Applying them copies the needed content into the song commit; no hidden transaction across independent stores is claimed. Multi-song operations declare their atomic scope and per-boundary receipts; partial progress is reported and recoverable rather than called total success. No transaction spans browser and service.

Content revision is monotonic and separate from schema version. Each successful private mutation preserves an immutable complete recoverable revision until owner purge. Current authorized history reads/restore follow capability rules. Restoring a revision creates a new revision without erasing intervening history or restoring obsolete grants.

Autosave safely coalesces/serializes changes and distinguishes unsaved draft, protected on this device, syncing, service-acknowledged, conflict, blocked authorization and failure in musician-friendly language. Only service acknowledgement means saved to the private library. Old responses cannot overwrite newer interaction drafts. Failure never reports success or replaces the previous durable revision; retain pending work under the session-protection policy. A timeout may have committed: reconcile the stable principal/resource/command retry identity with its receipt before another write. Retrying the same command does not duplicate revisions. Stale expected revisions refuse, preserving latest acknowledgement and recoverable draft; explicit comparison/copy/restore replaces silent merge.

Unreadable/unknown schema versions are reported without replacement. Migrations preserve a pre-migration recovery copy, validate complete candidates, activate atomically and keep the original on failure. Backup/restore and release rollback must be compatible with stored schema; incompatible rollback is refused instead of damaging data. Device refresh/restart cannot lose acknowledged changes. Protection of unacknowledged private work on session termination is required independently of whether persistent offline editing is enabled.

## Rationale

Move authority without losing acknowledged completeness, stale-write refusal or recovery honesty.

## Examples

A network timeout shows unconfirmed save until receipt reconciliation. A failed transaction leaves revision r intact. A restored historical revision becomes r+1.

## Exceptions

None. Local test fixtures do not establish real service or cross-device acknowledgement.
