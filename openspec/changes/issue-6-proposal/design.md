<!-- pdac-scope: cited -->

# Repertoire and song interaction: engineering plan

## Context

<!-- pdac:cite id="SB-BLANK-NAME" digest="sha256:df469f85a539ac9aabbc71658c59485c3a0232a88349ce62b0ac126d6897f04c" -->
<!-- pdac:cite id="SB-MEMBERSHIP-ADD" digest="sha256:f0cc7537b2efb9033a66e7f95e4d2ba68c92037edd808c571fa4b9f3c3eddbbe" -->
<!-- pdac:cite id="SB-MEMBERSHIP-DUPLICATE" digest="sha256:cf13783a3af08774e6216bb726af792566480d5ba2d3a236983ae749f241366b" -->
<!-- pdac:cite id="SB-MEMBERSHIP-REMOVE" digest="sha256:76ff8dfb68346d6bcaa2716da66062cd284902f6bdf5003a77538132041bd71c" -->
<!-- pdac:cite id="SB-MISSING-IDENTITY" digest="sha256:fff8b2ea2df48cf8b63bb2b5ed2ea1f834b2b24389ed9e300fba67bb6d78c66d" -->
<!-- pdac:cite id="SB-REPERTOIRE-CREATE" digest="sha256:37922d0d79d173763965250a8b5fa744c0f62775ba78c6c3ae7e4e0db182d86a" -->
<!-- pdac:cite id="SB-REPERTOIRE-DELETE" digest="sha256:3203bf7d104b07abed94f2f2beb00b92f33eead1e90981e88f123fe3aeda62c6" -->
<!-- pdac:cite id="SB-REPERTOIRE-RENAME" digest="sha256:96865538af194f8c287f62e4dc44e4341fab5700fb7f306801b1411f2e9a27ba" -->
<!-- pdac:cite id="SB-SONG-ADD" digest="sha256:3c802dc04e6f6ee9f01574e60c2a55f3c74c1614762f929575dffdf87b78efe9" -->
<!-- pdac:cite id="SB-SONG-CREATE" digest="sha256:d95b74331bb7efbb0806b44d35f116106618a1460ddc58b6a0fe7ec9183decba" -->
<!-- pdac:cite id="SB-SONG-DELETE-LAST" digest="sha256:1724d18f797def4fe5ef173c474d969c94270aefbc67eb6574e415cbb95b5ac7" -->
<!-- pdac:cite id="SB-SONG-DELETE" digest="sha256:f876d4fa7184eeae5904d228229273eef9984a965c2477204204744d8262a280" -->
<!-- pdac:cite id="SB-SONG-EDIT" digest="sha256:1e27a22da49c7b805dcc4023c563afa4b2ec78936ca42473957617aecb9fa33a" -->
<!-- pdac:cite id="BR-EDIT-GUARD" digest="sha256:20e678c4743404c64a51c01e4446026ac95811827d2f5e1c641839291ad32718" -->
<!-- pdac:cite id="BR-IDENTITY" digest="sha256:170ef1aff15cc46041fca58b4bdda33db26b4ba91b44de4fe2aeded7a9dede67" -->
<!-- pdac:cite id="LC-LIBRARY" digest="sha256:b1df9b0635c42d7a335d0aa1ba95c23b41b6d22d6380a98027c6ddc52a9ebe49" -->
<!-- pdac:cite id="FR-MEMBERSHIP" digest="sha256:5616e543703cb1206e49a200d319d27a6bd55c401c3374b9ed3564583aab6b3e" -->
<!-- pdac:cite id="FR-REPERTOIRES" digest="sha256:0aee3aeb1d99cd55e0c9a52b1e4d95b11fca2a94dea44975e27a62afb581a927" -->
<!-- pdac:cite id="FR-SONGS" digest="sha256:dd856e603c0ecdeb35ba2c072e5c5bff358bd6867e652ba8efe7c1093db88531" -->
<!-- pdac:cite id="UC-MEMBERSHIP" digest="sha256:e3f170c1793e24b326a5fe28a985095a50ed7757cfd75d028c9cac9a6f4d8447" -->
<!-- pdac:cite id="UC-REPERTOIRES" digest="sha256:282d54489055a7d95fc9eb2ee5516b7872e304e9a5171d8643e22c350c358049" -->
<!-- pdac:cite id="UC-SONGS" digest="sha256:3453d5023b656ce3625be2a8e239e7687730ccf356ac2b8d27873273a114a2f5" -->

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

## Shared mutation paths

The bounded paths additionally include src/features/library/domain.ts, src/features/library/useLibrary.ts, tests/library/domain.test.ts and tests/library/application.test.ts. The UI delegates repertoire/song/membership commands through these boundaries. Direct-command tests cover every refused identity and membership operation even when its UI control is unavailable. Deletion confirmation is owned by the UI; domain cascade semantics remain pure.
