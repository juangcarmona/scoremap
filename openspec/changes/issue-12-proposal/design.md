<!-- pdac-scope: cited -->

# Validated backup export and import: engineering plan

## Context

<!-- pdac:cite id="SB-BACKUP-CANCEL" digest="sha256:a1b39939e1798f96a3d4d4a6d0eea6f09ba4156293d49b05ae692953a1975806" -->
<!-- pdac:cite id="SB-BACKUP-EXPORT" digest="sha256:4dc53a109e0e344b95c117d7a429c92b3b54d4ce8856cf00104b501d13f86237" -->
<!-- pdac:cite id="SB-BACKUP-IMPORT-EMPTY" digest="sha256:94feeffb023102ad9861da55203c10d9df2f94ffe120ab962c346aa331908c6d" -->
<!-- pdac:cite id="SB-BACKUP-IMPORT" digest="sha256:a91c468115f1a66e2222f71eb936d54052e1959dfe93867da92c93476ac28d3e" -->
<!-- pdac:cite id="SB-BACKUP-REJECT" digest="sha256:f6b3ca347fe8d7d709509474f84ae9b7d4ecfc01ac4a66c3af5de77c20784e5d" -->
<!-- pdac:cite id="BR-BACKUP" digest="sha256:6e01f0285df7783f48eb0c482fa31f490f09e97e0f67a3a5fb3261dc1d1ed29c" -->
<!-- pdac:cite id="BR-DURABILITY" digest="sha256:d822f18f163b8685937ae5a3137dc04ef4a2d5947ab7a9954245bd965b72fa45" -->
<!-- pdac:cite id="BR-EDIT-GUARD" digest="sha256:20e678c4743404c64a51c01e4446026ac95811827d2f5e1c641839291ad32718" -->
<!-- pdac:cite id="LC-LIBRARY" digest="sha256:87592e7d48ad80b922f219f370fee009668a74146f83cbb2f159e16752fbdda5" -->
<!-- pdac:cite id="FR-BACKUP" digest="sha256:57286bb21b4c895afe8d7831630bec01797580be96efa5fb5a321e9822dca7e1" -->
<!-- pdac:cite id="UC-BACKUP" digest="sha256:ce5f43fc20dbe7e1482447d0334509c00460c28f84e33b3e8aacfcc2e4cbeb9a" -->

## Goals / Non-Goals

Realize the cited semantics within the slice. Preserve other features, product authority and existing provider/model selection.

## Decisions

Use pure invariant-checked domain transformations, a serialized application mutation boundary and atomic revision-checked storage. UI controls expose success, empty, error and performance-read-only states. Relevant architecture: docs/architecture and ADR-0001/0002.

## Verification

Derive executable tests from every relevant SB; valid lifecycle transitions use their authored covers-transition pair. Refused operations perform no transition. Exercise identity, membership, ordering, chord intervals and data-preserving failure conditions according to scope. Cross-browser-boundary outcomes need actual browser interaction. Run typecheck, unit/integration, provider citation checks, architecture/baseline checks and applicable browser tests. Retain exact tested source and command outcomes.

## Risks / Trade-offs

GitHub enforcement/App and owner-managed publication may block native completion or deployment independently of local correctness. Device emulation does not prove physical Android installation. Whole-library snapshots may need measured future migration for large PDFs.

## Review gates

Independent plan assessment precedes production code. Independent implementation review evaluates observable behaviour and test strength. Missing reviews remain pending. Integration requires the actual configured native gates, including current-head owner authorization; this plan grants no new permission.

## Backup application boundary and browser round trip

The bounded paths additionally include src/features/library/Library.tsx, src/features/library/useLibrary.ts, src/features/library/domain.ts and tests/e2e/backup.spec.ts. This slice owns export download, file selection, readable validation feedback and explicit replacement confirmation/cancellation. A real-browser test downloads a populated library, creates different current content, selects the downloaded file, cancels once and verifies no change, then confirms replacement and reloads. Compare every song/repertoire/section identity, membership, chord, repeat, annotation and reference. Invalid-version, duplicate-ID, dangling-membership and malformed files must fail before storage writes. Failed replacement must preserve durable data.

When issue #13 supplies PDF UI, its acceptance extends this same browser round trip to exact PDF bytes, attachment ownership and remembered page. PDF support cannot bypass complete backup validation.
