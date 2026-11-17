---
id: FR-BACKUP
type: functional-requirement
title: Transfer complete musical data without importing authority
status: draft
derived-from:
  - UC-BACKUP
  - BR-BACKUP
  - BR-DURABILITY
  - BR-IDENTITY
  - BR-EDIT-GUARD
  - BR-ACCESS
  - BR-SESSION
verification:
  - scenario-ref: SB-BACKUP-EXPORT
  - scenario-ref: SB-BACKUP-IMPORT
  - scenario-ref: SB-BACKUP-IMPORT-EMPTY
  - scenario-ref: SB-BACKUP-REJECT
  - scenario-ref: SB-BACKUP-CANCEL
  - scenario: With a supported complete arrangement export containing shared form, independent parts and all bindings, import it into an explicitly confirmed compatible anonymous destination; reconstruct every declared musical field and association without silently merging extra destination songs.
  - scenario: With an existing anonymous library and a supported v1 backup, confirm migration and import; preserve original identities, ordering, repeats, triad meaning and associations while recording deterministic generated measure and event mappings and retaining a pre-migration recovery copy.
  - scenario: With a retained migration receipt and an interrupted identical v1 import, retry that import; reuse the receipt's generated identities without duplicating migrated events.
  - scenario: With a valid existing library, import an unknown schema version; refuse activation, preserve both source and current durable data and explain the unsupported version.
  - scenario: With a valid library and a backup containing duplicate identities, request import; refuse before replacement and leave the library unchanged.
  - scenario: With a valid library and a backup containing a dangling part binding, request import; refuse without activating any partial song or changing acknowledged data.
  - scenario: With a valid library and a backup containing an out-of-measure event duration, request import; refuse without truncating the event or modifying durable data.
  - scenario: With a backup containing an attachment capability not yet supported by the destination, request import; refuse before activation rather than silently dropping the attachment.
  - scenario: With a valid pre-migration recovery copy and a simulated activation failure, confirm a supported import; report failure, retain the original source and previous durable revision and do not report the candidate as imported.
  - scenario: With selected anonymous songs, real sign-in and a valid confirmed collision-free preview, submit a claim; acknowledge complete authorized song boundaries with ownership derived from the current session and retain the anonymous source until authorized service reconstruction is verified.
  - scenario: With a claim that has a committed receipt but an unconfirmed response, retry the same principal-bound claim command; reconcile to the existing receipt without creating duplicate songs or revisions.
  - scenario: With a selected claim whose identity collides with destination content, request the unmodified claim; refuse before changing the destination and present an explicit copy-as-new option.
  - scenario: With a preview of all new identities and consistently remapped internal associations for a collision, confirm copy-as-new; create only the declared new content and leave the original source and colliding destination unchanged.
  - scenario: With a prepared claim preview and unchanged source work, cancel confirmation; create no private content and retain the source.
  - scenario: With a private import containing a purported foreign ownership grant, confirm import as principal A; derive destination ownership from A's trusted session and grant no access from the imported authority values.
  - scenario: With current private read/export capability, export a declared song scope; include its complete authorized musical content and provenance but no credentials, session material, reusable access material or authority-conferring grants.
  - scenario: With private export permission revoked before admission, request that export; refuse without exposing retained content and preserve only the protected principal-bound pending record.
  - scenario: With a multi-song import declaring separate song and preference acknowledgements, fail one declared commit boundary; report exact completed receipts and remaining work without calling the batch wholly successful or damaging prior acknowledged revisions.
  - scenario: With a purge receipt for an identity and an old backup proposing restoration under that same identity, request restoration of that identity; refuse resurrection and preserve the purge receipt and unrelated songs.
uses-terms:
  - TERM-BACKUP
  - TERM-LIBRARY
  - TERM-SONG
  - TERM-ARRANGEMENT
  - TERM-EVENT
  - TERM-VOICING
  - TERM-PRINCIPAL
  - TERM-ATTACHMENT
---

## Requirement

The product MUST provide a documented, versioned portable ScoreMap data envelope with explicit scope, field meaning, schema version, source-revision provenance, compatibility and migration rules. Export MUST preserve every field in its declared authorized scope: stable song, section, measure and event identities/order/positions/durations/repeats; spelled harmonic identity; exact performed pitches and octaves; independent arrangements/parts/voicings; optional hands; device/range/layer/sound bindings; repertoires/memberships; reminders/references; and supported attachments with their complete required bytes and associations. Explicitly included owned preferences, presets and reusable configuration MUST retain their ownership distinction and copied version provenance. Export MUST NOT change source music or imply that pending work is service-acknowledged. Credentials, usable sessions/provider material and authority-conferring grants MUST NOT be exported.

Anonymous import MUST remain an explicitly confirmed complete replacement after whole-envelope validation. Valid empty replacement MUST remain possible. Cancellation, malformed data, duplicate identities/memberships, dangling associations, invalid pitch/timing/values, incomplete attachments, unsupported versions and unsupported capabilities MUST leave the previous durable library unchanged. The product MUST explain refusal rather than silently drop unsupported fields or merge unselected songs. Unsupported attachment transfer MUST remain refused until that independent capability is supported.

Supported v1 migration MUST preserve existing song/repertoire/section/membership/reminder/reference identities, order, repeats and triad spelling. New measure/event identities, timing defaults and the unassigned default arrangement MUST follow BR-STRUCTURE; theoretical keyboard references MUST NOT be fabricated into performed notes. A durable migration receipt MUST preserve generated identity mappings across retries. Migration MUST retain a recovery copy, validate complete content and activate atomically at its declared boundary. Unknown versions and failed migration MUST preserve the source and previous acknowledged data without replacement.

Anonymous-to-account claim and private import MUST require real authentication, current online resource capability, explicit selection, preview and confirmation. The product MUST derive destination ownership from trusted session identity, not imported owner/grant values. Identity collision MUST refuse before mutation and offer explicit copy-as-new with a previewed, consistently remapped set of associations; no silent overwrite or merge is permitted. Principal-bound command receipts MUST make retry/reconciliation idempotent. Original anonymous work MUST remain until verified authorized service reconstruction, and removing that source MUST require explicit user choice. Session cleanup MUST NOT erase it. An origin change MUST require explicit export from the old origin rather than pretending the new origin can read its retained local work.

Each acknowledged private import boundary MUST contain a complete valid song with its arrangements and owned content. Independently owned preferences and reusable resources MUST have separate explicit acknowledgements; a song grant MUST NOT transfer access to the owner's other resources. Multi-song work MUST declare its commit boundaries and receipts and make partial progress recoverable and visible. No import/export result may claim a single atomic transaction across independent device and service stores. Full acknowledged reconstruction MUST preserve the new musical fields rather than only a triad sketch.

Private export, history read and restoration MUST enforce current capability and BR-SESSION, including fresh online checks on reconnect. Retained protected work MUST NOT permit export after authority expires or is revoked. Deleted-song export/history requires the current owner's fresh online permission; former grants confer none. Backup restoration MUST reconcile deleted/purged identities and current authorization before exposing restored data. Purged identities MUST NOT be resurrected by import retries or stale restore. The product MUST distinguish a musician's portable transfer from operator disaster recovery and MUST NOT promise instant erasure of old exports or backups.

Verification MUST compare complete independent source and reconstructed values at the actual declared storage/service boundaries. Anonymous local round trips MUST NOT count as authenticated second-session recovery. Synthetic transfer fixtures and the same file-driven manual/automated real-login contract used for the connected checkpoint MUST support repeatable private journeys without introducing a bypass; reset MUST stay execution-scoped. Real operator inputs, credentials and private libraries MUST remain outside public evidence, and Production MUST reject development identity/configuration defaults.

## Rationale

Portability must preserve the musician's complete work without granting imported authority, erasing a source before recovery is verified or confusing device-only replacement with private service recovery.
