<!-- pdac-scope: cited -->

# Validated backup export and import: engineering plan

## Context

<!-- pdac:cite id="SB-BACKUP-CANCEL" digest="sha256:a1b39939e1798f96a3d4d4a6d0eea6f09ba4156293d49b05ae692953a1975806" -->
<!-- pdac:cite id="SB-BACKUP-EXPORT" digest="sha256:4dc53a109e0e344b95c117d7a429c92b3b54d4ce8856cf00104b501d13f86237" -->
<!-- pdac:cite id="SB-BACKUP-IMPORT-EMPTY" digest="sha256:94feeffb023102ad9861da55203c10d9df2f94ffe120ab962c346aa331908c6d" -->
<!-- pdac:cite id="SB-BACKUP-IMPORT" digest="sha256:a91c468115f1a66e2222f71eb936d54052e1959dfe93867da92c93476ac28d3e" -->
<!-- pdac:cite id="SB-BACKUP-REJECT" digest="sha256:f6b3ca347fe8d7d709509474f84ae9b7d4ecfc01ac4a66c3af5de77c20784e5d" -->
<!-- pdac:cite id="BR-BACKUP" digest="sha256:4344f228dbb32818f9dfdce278ec73ac6acd8dc4689069ac6c79d12c1571b917" -->
<!-- pdac:cite id="BR-DURABILITY" digest="sha256:f6e8a52fdb28d495f07304870d8d2bfa6c6e5adce7722d919ce64efca735c57e" -->
<!-- pdac:cite id="BR-EDIT-GUARD" digest="sha256:20e678c4743404c64a51c01e4446026ac95811827d2f5e1c641839291ad32718" -->
<!-- pdac:cite id="LC-LIBRARY" digest="sha256:b1df9b0635c42d7a335d0aa1ba95c23b41b6d22d6380a98027c6ddc52a9ebe49" -->
<!-- pdac:cite id="FR-BACKUP" digest="sha256:5241b06d0c1813ecb8289067643f5eda97e41786e949b83a0fa18208f2bb5b1f" -->
<!-- pdac:cite id="UC-BACKUP" digest="sha256:d8af4df96fe863209df6f1481ab18941abeb08a1c8808c40b599a32311000e86" -->

## Goals / Non-Goals

Realize the cited semantics within the slice. Preserve other features, product authority and existing provider/model selection.

## Decisions

Use pure invariant-checked domain transformations, a serialized application mutation boundary and atomic revision-checked storage. UI controls expose success, empty, error and performance-read-only states. Relevant architecture: docs/architecture and ADR-0001/0002.

## Verification

Derive executable tests from every relevant SB; valid lifecycle transitions use their authored covers-transition pair. Refused operations perform no transition. Exercise identity, membership, ordering, chord intervals and data-preserving failure conditions according to scope. Cross-browser-boundary outcomes need actual browser interaction. Run typecheck, unit/integration, provider citation checks, architecture/baseline checks and applicable browser tests. Retain exact tested source and command outcomes.

## Risks / Trade-offs

GitHub enforcement/App and the unselected deployment target may block native completion or deployment independently of local correctness. Device emulation does not prove physical Android installation. Whole-library snapshots may need measured future migration for large PDFs.

## Review gates

Independent plan assessment precedes production code. Independent implementation review evaluates observable behaviour and test strength. Missing reviews remain pending. Integration requires the actual configured native gates, including current-head owner authorization; this plan grants no new permission.
