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

<!-- pdac:cite id="CON-LOCAL-FIRST" digest="sha256:c7143c6945173116bb26101e9f1918b6d628d271d01b058eeb6d7f64d99b1f1a" -->
<!-- pdac:cite id="CON-PLATFORM" digest="sha256:ed4f4900b26c706198a0448376f26d57d0665462c5e77ac4dbadc04bb75e6bf5" -->

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
