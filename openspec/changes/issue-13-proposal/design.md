<!-- pdac-scope: cited -->

# Optional local PDF attachment and viewer: engineering plan

## Context

<!-- pdac:cite id="SB-PDF-ATTACH" digest="sha256:bb0ae4e82407c6d62f96564db7644e8d0d8684bc8f3e8a7166570e3ea4210ce5" -->
<!-- pdac:cite id="SB-PDF-NAVIGATE" digest="sha256:36fae57b85fc19e0eed3766456b219721211ad4dd5c7123da9e7bdc357122234" -->
<!-- pdac:cite id="SB-PDF-REJECT" digest="sha256:ad3173b24391233d5316ae7d2f1dece023d35efcf0e3f7931e521839dd41a73d" -->
<!-- pdac:cite id="BR-DURABILITY" digest="sha256:f6e8a52fdb28d495f07304870d8d2bfa6c6e5adce7722d919ce64efca735c57e" -->
<!-- pdac:cite id="BR-EDIT-GUARD" digest="sha256:20e678c4743404c64a51c01e4446026ac95811827d2f5e1c641839291ad32718" -->
<!-- pdac:cite id="BR-PDF" digest="sha256:e83f0e00285008ae9c61789b2bc7ed7ec700368aaa55dda2d7323966d5b0e8cb" -->
<!-- pdac:cite id="FR-PDF" digest="sha256:83070927beae39c02951f46b74eec2fa28a5c6530df574719a7b969c48c0e6ad" -->
<!-- pdac:cite id="UC-PDF" digest="sha256:26a5a12df99ab22eb72daa5e4fb48587a0a47942d74d8d9f717d26489b201062" -->

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
