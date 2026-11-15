<!-- pdac-scope: cited -->

# Installable offline PWA: engineering plan

## Context

<!-- pdac:cite id="SB-OFFLINE" digest="sha256:40eef81b2f397f73f52df9d8a0892f678edfdbaeea5a485d6a16003086a24a26" -->
<!-- pdac:cite id="BR-DURABILITY" digest="sha256:f6e8a52fdb28d495f07304870d8d2bfa6c6e5adce7722d919ce64efca735c57e" -->
<!-- pdac:cite id="CON-PLATFORM" digest="sha256:ed4f4900b26c706198a0448376f26d57d0665462c5e77ac4dbadc04bb75e6bf5" -->
<!-- pdac:cite id="FR-OFFLINE" digest="sha256:68f558e306eea39e0a533194ce6429c4c97180f94aabca6bbb6ca6a174f9cb0f" -->
<!-- pdac:cite id="UC-OFFLINE" digest="sha256:7ad9b33e0b6a86443b7536a7436832cf916d2951d055a608d76fee0dabf2cee1" -->

## Goals / Non-Goals

Realize the cited semantics within the slice. Preserve other features, product authority and existing provider/model selection.

## Decisions

Use pure invariant-checked domain transformations, a serialized application mutation boundary and atomic revision-checked storage. UI controls expose success, empty, error and performance-read-only states. Relevant architecture: docs/architecture and ADR-0001/0002.

## Verification

Derive executable tests from every relevant SB; valid lifecycle transitions use their authored covers-transition pair. Refused operations perform no transition. Exercise identity, membership, ordering, chord intervals and data-preserving failure conditions according to scope. Cross-browser-boundary outcomes need actual browser interaction. Run typecheck, unit/integration, provider citation checks, architecture/baseline checks and applicable browser tests. Retain exact tested source and command outcomes.

## Risks / Trade-offs

GitHub enforcement/App and Cloudflare credentials may block native completion or deployment independently of local correctness. Device emulation does not prove physical Android installation. Whole-library snapshots may need measured future migration for large PDFs.

## Review gates

Independent plan assessment precedes production code. Independent implementation review evaluates observable behaviour and test strength. Missing reviews remain pending. Integration requires the actual configured native gates, including current-head owner authorization; this plan grants no new permission.
