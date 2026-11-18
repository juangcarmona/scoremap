---
name: use-a-local-first-browser-runtime
description: Use a local-first browser runtime.
status: Accepted
date: 2026-11-15
deciders:
  - Repository owner (explicit product constraints)
tags:
  - pwa
  - local-first
---

# ADR-0001: Use a local-first browser runtime

## Context

The owner requires an installable Android tablet PWA with no backend, accounts or cloud synchronization.

<!-- pdac:cite id="CON-LOCAL-FIRST" digest="sha256:a2cd6293106ac4e7a464b7ded96b8670d1de7480624260ba8c49a1400dbc824d" -->
<!-- pdac:cite id="CON-PLATFORM" digest="sha256:635e50e18ab13a558ff7fb34323fb9c54c651858935b841272e22ce860067fbb" -->

## Decision

We will run React and TypeScript in a static HTTPS PWA, retain personal data in IndexedDB and isolate musical logic from UI code.

## Consequences

- Positive: Offline work needs no service availability.
- Negative: Browser storage and device installation require explicit recovery and qualification.
- Neutral: Google Play and MIDI remain future product opportunities.

## Alternatives considered

- Backend service: violates the initial no-backend constraint.
- Native-only Android app: delays the required PWA distribution.

## References

- [Architecture strategy](../04-solution-strategy/README.md)
- [Canonical model](../../product/model/)
