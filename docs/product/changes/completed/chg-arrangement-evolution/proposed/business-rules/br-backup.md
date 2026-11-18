---
id: BR-BACKUP
type: business-rule
title: Complete portable data and non-destructive claim
status: draft
applies-to: [BC-RECOVERY]
uses-terms: [TERM-BACKUP, TERM-LIBRARY]
---

## Rule

Export uses a versioned portable ScoreMap envelope covering its declared authorized scope. Include every song/section/measure/event identity/order/time/repeat, spelled harmony, exact pitches/voicings, arrangement/part/hand/device/range/layer/sound binding, repertoire/membership, reminder/reference and supported attachment, plus explicitly scoped owned preferences/presets/configuration. Preserve schema and source-revision provenance without treating it as destination authority. Never include credentials, usable session/provider material or authority-conferring grants.

Anonymous import remains explicit confirmed complete replacement after whole-envelope validation. Duplicate IDs/memberships, dangling associations, invalid values/timing/pitches, unsupported versions, incomplete attachments and unsupported capabilities refuse before any activation; cancellation/failure preserves the current durable library. v1 import explicitly migrates with recovery copy and deterministic generated-ID receipt, preserving existing identities and triad meaning. Unsupported PDF-bearing transfer remains refused until the independent capability is qualified.

Anonymous-to-account claim and private import require current online authorization, explicit selection, preview and confirmation. Destination owner derives from the session, never imported ACLs or owner IDs. Identity collisions refuse before mutation with an explicit copy-as-new option that remaps all selected internal identities consistently; never silently overwrite or merge. The user confirms collision mapping. A stable claim/import receipt makes retries idempotent. Declared song boundaries are complete; separately owned preferences/resources are acknowledged separately and are not silently assigned to collaborators. Source anonymous work is retained until verified authorized remote reconstruction, with explicit user choice before source removal. Session cleanup cannot erase it. Origin changes require explicit export from the old origin; another origin cannot read that stored library.

## Rationale

Portability must preserve musical meaning without laundering imported authority or concealing data loss.

## Examples

A private import containing another owner's grant does not grant access. An unknown schema remains intact and inactive. A repeated claim returns its original receipt instead of creating duplicates.

## Exceptions

Operator disaster backups have separately documented retention/restore obligations and must reconcile deleted/purged identities before access.
