---
name: keep-versioned-music-validation-at-domain-boundaries
description: Keep musical JSON opaque in the partial HTTP contract while validating each supported version at the existing domain boundaries.
status: Proposed
date: 2026-11-20
deciders: []
tags: [music, api, compatibility]
---

# ADR-0009: Keep versioned music validation at domain boundaries

## Context

The current private API contract is generated from registered endpoints. Its library and musical document fields are `JsonElement`; OpenAPI does not describe their internal structure. The browser and server separately validate the supported library and song versions, while product rules require complete validation, durable acknowledgement, explicit migration and preservation of unsupported or failed imports. Version 1 and identified version 2 music can coexist. Replacing these validators with a new shared schema would require reconciling their cross-resource and musical invariants and proving migration and rollback compatibility.

## Decision

We will retain the versioned musical document as an opaque value in the current HTTP contract and continue validating it at both existing domain boundaries. Generated HTTP types govern only the documented envelope and routes; `unknown` values require the existing runtime validation before musical use. We will not claim that OpenAPI generation detects changes inside musical JSON. A future authoritative shared schema requires its own explicit versioning and compatibility design, parity tests against both validators, and a migration path that retains old data and retry receipts.

## Consequences

- **Positive:** Existing versioned imports, validator behavior and atomic acknowledgement boundaries remain in place while HTTP route drift is checked.
- **Negative:** Independent frontend and server validators can diverge, and the current HTTP contract cannot detect incompatible internal music changes.
- **Neutral:** Shared cross-language validation fixtures and an authoritative schema remain follow-on engineering; generated types do not replace authorization or runtime validation.

## Alternatives considered

- **Adopt a complete shared schema immediately:** rejected for this increment because schema authority, richer invariants and cross-version migration have not been established or proved equivalent.
- **Trust generated TypeScript types alone:** rejected because network input is untrusted and static types cannot enforce the existing domain invariants at runtime.

## References

- [Issue #28](https://github.com/juangcarmona/scoremap/issues/28)
- [Musical model design](../../../openspec/changes/issue-22-musical-model/design.md)
- [Durability rule](../../product/model/business-rules/br-durability.md)
- [Executable boundary decision](ADR-0004-enforce-feature-and-layer-boundaries-with-executable-checks.md)
