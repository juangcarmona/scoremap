<!-- pdac-scope: cited -->

# Section editing, repeats and ordering

## Why

Realize the already supplied ScoreMap product intent for [issue #7](https://github.com/juangcarmona/scoremap/issues/7). The applied CHG-INITIAL is the only source of product semantics; this delivery change supplies implementation and verification.

## What Changes

Implement the accepted behaviours cited below in the bounded paths `src/features/library/Sketch.tsx`, `tests/e2e/sketch.spec.ts`. Dependencies: #6.

## Capabilities

### New Capabilities

- delivery: Observable implementation of the cited slice.

### Modified Capabilities

None.

## Impact

<!-- pdac:cite id="SB-SECTION-FIRST" digest="sha256:142013b9449dc02eff8f99b7752661694163795e29a55ef00daafc6f63e7ac4c" -->
<!-- pdac:cite id="SB-SECTION-INSERT" digest="sha256:419cab857698e48ddda21d1b82e507163f407c0d6459f16785fb096c9324427a" -->
<!-- pdac:cite id="SB-SECTION-INVALID-ORDER" digest="sha256:b504ff2ff04dee9f4f02842b169ef787cff8f53943404f0323b0f946bda08944" -->
<!-- pdac:cite id="SB-SECTION-MODIFY" digest="sha256:d39296e86c35c16c859c4f1c4294a2df9b5edcd9304a505d7b4d5b985274a95b" -->
<!-- pdac:cite id="SB-SECTION-REMOVE-LAST" digest="sha256:4857e323f1014f93ab8b8e8e72e692809d2597c653a7cea01de470132b094e66" -->
<!-- pdac:cite id="SB-SECTION-REMOVE" digest="sha256:a9ebfc7be7dad88eaca3e230d20e904c697d133790d193f4cb46dcf495708e77" -->
<!-- pdac:cite id="SB-SECTION-REORDER" digest="sha256:610413c7eae977e5760aa413f58ec499375fdafe0952dca8cbc7591cbda639e5" -->
<!-- pdac:cite id="SB-SECTION-REPEAT-BOUNDARY" digest="sha256:8290678c017a749dd78b1b1d6ef192b85a7ec141d1cc1f0a1926c91c957217c7" -->
<!-- pdac:cite id="BR-EDIT-GUARD" digest="sha256:20e678c4743404c64a51c01e4446026ac95811827d2f5e1c641839291ad32718" -->
<!-- pdac:cite id="BR-IDENTITY" digest="sha256:170ef1aff15cc46041fca58b4bdda33db26b4ba91b44de4fe2aeded7a9dede67" -->
<!-- pdac:cite id="BR-STRUCTURE" digest="sha256:bae8c2932ecf49f6d3c71e3042b5bee18ff82a1abc06bed90b731c02479772d4" -->
<!-- pdac:cite id="LC-STRUCTURE" digest="sha256:31caaa7320486ab3a837e8b0f3ac2b14f6e5623b664f131cb85af1ce030a24ef" -->
<!-- pdac:cite id="FR-SECTIONS" digest="sha256:82754b46d99da6500dc9adeefe583ed54fda178dac5ce005cc48171e441cae45" -->
<!-- pdac:cite id="UC-SECTIONS" digest="sha256:80f9b239becb5c08f4df621992fbcf260ad02e5e84368b04ef97d96f5792d1dc" -->

The complete model was examined for shared identity, mode and durability rules. MIDI, accounts and cloud features were excluded because they are outside CON-SCOPE. Read applicable lifecycle transitions and refusal behaviours before authoring tests.
