<!-- pdac-scope: cited -->

# Domain commands and invariant enforcement: engineering plan

## Context

<!-- pdac:cite id="SB-BLANK-NAME" digest="sha256:df469f85a539ac9aabbc71658c59485c3a0232a88349ce62b0ac126d6897f04c" -->
<!-- pdac:cite id="SB-MISSING-IDENTITY" digest="sha256:fff8b2ea2df48cf8b63bb2b5ed2ea1f834b2b24389ed9e300fba67bb6d78c66d" -->
<!-- pdac:cite id="SB-SECTION-FIRST" digest="sha256:142013b9449dc02eff8f99b7752661694163795e29a55ef00daafc6f63e7ac4c" -->
<!-- pdac:cite id="SB-SECTION-INSERT" digest="sha256:419cab857698e48ddda21d1b82e507163f407c0d6459f16785fb096c9324427a" -->
<!-- pdac:cite id="SB-SECTION-INVALID-ORDER" digest="sha256:b504ff2ff04dee9f4f02842b169ef787cff8f53943404f0323b0f946bda08944" -->
<!-- pdac:cite id="SB-SECTION-MODIFY" digest="sha256:d39296e86c35c16c859c4f1c4294a2df9b5edcd9304a505d7b4d5b985274a95b" -->
<!-- pdac:cite id="SB-SECTION-REMOVE-LAST" digest="sha256:4857e323f1014f93ab8b8e8e72e692809d2597c653a7cea01de470132b094e66" -->
<!-- pdac:cite id="SB-SECTION-REMOVE" digest="sha256:a9ebfc7be7dad88eaca3e230d20e904c697d133790d193f4cb46dcf495708e77" -->
<!-- pdac:cite id="SB-SECTION-REORDER" digest="sha256:610413c7eae977e5760aa413f58ec499375fdafe0952dca8cbc7591cbda639e5" -->
<!-- pdac:cite id="SB-SECTION-REPEAT-BOUNDARY" digest="sha256:8290678c017a749dd78b1b1d6ef192b85a7ec141d1cc1f0a1926c91c957217c7" -->
<!-- pdac:cite id="SB-SONG-ADD" digest="sha256:3c802dc04e6f6ee9f01574e60c2a55f3c74c1614762f929575dffdf87b78efe9" -->
<!-- pdac:cite id="SB-SONG-CREATE" digest="sha256:d95b74331bb7efbb0806b44d35f116106618a1460ddc58b6a0fe7ec9183decba" -->
<!-- pdac:cite id="SB-SONG-DELETE-LAST" digest="sha256:1724d18f797def4fe5ef173c474d969c94270aefbc67eb6574e415cbb95b5ac7" -->
<!-- pdac:cite id="SB-SONG-DELETE" digest="sha256:f876d4fa7184eeae5904d228229273eef9984a965c2477204204744d8262a280" -->
<!-- pdac:cite id="SB-SONG-EDIT" digest="sha256:1e27a22da49c7b805dcc4023c563afa4b2ec78936ca42473957617aecb9fa33a" -->
<!-- pdac:cite id="BR-EDIT-GUARD" digest="sha256:20e678c4743404c64a51c01e4446026ac95811827d2f5e1c641839291ad32718" -->
<!-- pdac:cite id="BR-IDENTITY" digest="sha256:170ef1aff15cc46041fca58b4bdda33db26b4ba91b44de4fe2aeded7a9dede67" -->
<!-- pdac:cite id="BR-STRUCTURE" digest="sha256:bae8c2932ecf49f6d3c71e3042b5bee18ff82a1abc06bed90b731c02479772d4" -->
<!-- pdac:cite id="LC-LIBRARY" digest="sha256:b1df9b0635c42d7a335d0aa1ba95c23b41b6d22d6380a98027c6ddc52a9ebe49" -->
<!-- pdac:cite id="LC-STRUCTURE" digest="sha256:31caaa7320486ab3a837e8b0f3ac2b14f6e5623b664f131cb85af1ce030a24ef" -->
<!-- pdac:cite id="FR-SECTIONS" digest="sha256:82754b46d99da6500dc9adeefe583ed54fda178dac5ce005cc48171e441cae45" -->
<!-- pdac:cite id="FR-SONGS" digest="sha256:dd856e603c0ecdeb35ba2c072e5c5bff358bd6867e652ba8efe7c1093db88531" -->
<!-- pdac:cite id="UC-SECTIONS" digest="sha256:80f9b239becb5c08f4df621992fbcf260ad02e5e84368b04ef97d96f5792d1dc" -->
<!-- pdac:cite id="UC-SONGS" digest="sha256:3453d5023b656ce3625be2a8e239e7687730ccf356ac2b8d27873273a114a2f5" -->

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
