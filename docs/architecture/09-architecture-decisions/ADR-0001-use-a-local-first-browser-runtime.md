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

<!-- pdac:cite id="CON-LOCAL-FIRST" digest="sha256:3dd07ade8d6c189ac4f9b29fcf0e51d7abc3a6fd1a1f6ab7093918f0c4484c0a" -->
<!-- pdac:cite id="CON-PLATFORM" digest="sha256:276120bdea8e88293e6843367e84966dacdad452cd568a124f64f73a24b529d5" -->

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
