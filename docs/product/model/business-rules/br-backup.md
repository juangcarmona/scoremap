---
id: BR-BACKUP
type: business-rule
title: Complete portable data and explicit context-specific import
status: draft
applies-to: [BC-RECOVERY]
uses-terms: [TERM-BACKUP, TERM-LIBRARY, TERM-SONG, TERM-REPERTOIRE, TERM-ATTACHMENT]
---

## Rule

Export uses a versioned portable ScoreMap envelope covering its declared authorized scope. Include every song/section/measure/event identity/order/time/repeat, spelled harmony, exact pitches/voicings, arrangement/part/hand/device/range/layer/sound binding, repertoire/membership, reminder/reference and supported attachment, plus explicitly scoped owned preferences/presets/configuration where that transfer context permits them. Preserve schema and source-revision provenance without treating it as destination authority. Never include credentials, usable session/provider material or authority-conferring grants.

Existing anonymous browser import remains explicit confirmed complete replacement after whole-envelope validation. Duplicate IDs/memberships, dangling associations, invalid values/timing/pitches, unsupported versions, incomplete attachments and unsupported capabilities refuse before any activation; cancellation/failure preserves the current durable library. v1 browser import explicitly migrates with recovery copy and deterministic generated-ID receipt, preserving existing identities and triad meaning. Unsupported PDF-bearing browser/service transfer remains refused until its independent capability is qualified.

Anonymous-to-account claim and private-service import require current online authorization, explicit selection, preview and confirmation. Destination owner derives from the session, never imported ACLs or owner IDs. Identity collisions refuse before mutation with an explicit copy-as-new option that remaps all selected internal identities consistently; never silently overwrite or merge. The user confirms collision mapping. A stable claim/import receipt makes retries idempotent. Declared song boundaries are complete; separately owned preferences/resources are acknowledged separately and are not silently assigned to collaborators. Source anonymous work is retained until verified authorized remote reconstruction, with explicit user choice before source removal. Session cleanup cannot erase it. Origin changes require explicit export from the old origin; another origin cannot read that stored library.

Native Android export selects one current acknowledged song or one complete current acknowledged ordered set and all its required songs. Include every supported musical field/association, song-owned content and required reusable musical definition copied into the portable graph, including known key, lyrics/chord associations, cues, phrases, exact pitches/register, hands/parts and musical bindings. Include each supported owned PDF's bytes and integrity reference, not a device-local path. External links remain explicit links, not promises of offline remote content. Include format/capability version and source revision/provenance. Do not implicitly export private local revision history; imported content starts independent destination history. Personal app preferences and actual hardware configuration remain local. Preserve musical reconstruction information rather than substituting runtime hardware authority. Account ownership, grants, credentials, sessions and another installation's runtime hardware authority do not transfer.

Every native import always creates independent editable local copies, even when source identities already appear in the destination. Validate the entire selected scope, preview its content and graph-wide destination identity mapping, and allow cancellation before confirmation. Consistently remap song/set/section/event/content/resource identities and all internal references, preserving shared references within the selected graph, ordered membership and every supported association. Never update, merge, overwrite or replace existing destination music. Copy required reusable musical definitions under independent destination identities; do not mutate existing independently owned resources or import app preferences or actual hardware configuration.

A deliberate new native import may create another independent copy. Retrying/reconciling the same interrupted command must reuse its committed receipt and identity mapping, never duplicate content. A complete selected song/set import is acknowledged only after one atomic local commit of its full graph and qualified publication of all required attachment bytes. Failure, cancellation, storage exhaustion, staging/publication failure or interruption cannot activate partial content or damage prior durable music. Reconcile an ambiguous result rather than assuming rollback. Preserve the original input file.

Malformed, truncated, oversized, unknown format/capability versions, duplicate source IDs/memberships, dangling references, incomplete graphs/attachments, invalid musical data and unsupported attachment/content types refuse before activation. Never silently truncate, drop fields, omit declared content or accept a broken device-local PDF path. Supported PDF transfer is a native acceptance obligation, not permission to waive it as a deferred capability. A destination unable to reconstruct the declared complete scope refuses honestly.

## Rationale

Portability must preserve musical meaning without laundering imported authority, concealing data loss or confusing independent native exchange with browser replacement or service claim.

## Examples

A private-service import containing another owner's grant does not grant access. An unknown schema remains intact and inactive. A repeated claim returns its original receipt instead of creating duplicates. A native set imported twice through two deliberate commands creates two independent sets and their copied graphs; retrying either command returns that command's existing result without another set.

## Exceptions

Operator disaster backups have separately documented retention/restore obligations and must reconcile deleted/purged identities before access. Existing browser replacement and private-service copy/claim are not implicitly enabled as native replacement/update operations.
