---
title: Architecture constraints
arc42-section: "02"
description: Technical realization of fixed boundaries
---

# 2. Architecture constraints

The existing web realization runs React and strict TypeScript in a Vite PWA. The anonymous mode uses browser-origin storage. The private mode additionally requires the ASP.NET Core BFF/API, an OIDC provider and PostgreSQL; browser-supplied IDs, role labels and cached state never establish authorization.

<!-- pdac:cite id="CON-LOCAL-FIRST" digest="sha256:3dd07ade8d6c189ac4f9b29fcf0e51d7abc3a6fd1a1f6ab7093918f0c4484c0a" -->

PDF rendering remains a separate capability of the existing browser realization. [ADR-0010](../09-architecture-decisions/ADR-0010-build-a-separate-native-android-application.md) selects a separate Kotlin/Jetpack Compose Android target under `src/android`, with local persistence and file exchange described in [Android target](../05-building-block-view/android-target.md). The native target must preserve complete required owned PDF bytes and integrity through local recovery and transfer; browser attachment limitations do not waive that target. Android implementation and device qualification remain pending. MIDI/audio hardware integration remains follow-up scope.

<!-- pdac:cite id="CON-SCOPE" digest="sha256:a69dd93c94d43ee6fe15eee09c94b68a5ac6f96cdd6f435627c3f790b707f664" -->

## Implemented private application

[ADR-0003](../09-architecture-decisions/ADR-0003-self-host-the-private-application-with-aspire.md) accepts the owner's next self-hosted architecture. [ADR-0004](../09-architecture-decisions/ADR-0004-enforce-feature-and-layer-boundaries-with-executable-checks.md) requires executable boundaries rather than conventions alone. The validated ProductShape apply in `docs/product/changes/completed/chg-arrangement-evolution` and merged PR37 establish the private implementation baseline. Executable architecture checks, native Android qualification and explicit operator deployment remain separate boundaries. The deployment environment is a configuration choice, not a physical machine name; see [section 07](../07-deployment-view/README.md).
