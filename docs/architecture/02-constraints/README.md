---
title: Architecture constraints
arc42-section: "02"
description: Technical realization of fixed boundaries
---

# 2. Architecture constraints

The browser is the sole runtime for the MVP. React and strict TypeScript run in a Vite PWA. There is no server, account, external API dependency or instrument-specific domain module.

<!-- pdac:cite id="CON-LOCAL-FIRST" digest="sha256:a2cd6293106ac4e7a464b7ded96b8670d1de7480624260ba8c49a1400dbc824d" -->

PDF rendering is a separate optional capability. Native Android packaging and hardware integration remain outside this architecture.

<!-- pdac:cite id="CON-SCOPE" digest="sha256:2934fbcf8f42cd477a77c5f9fb3fecc17beca485b243c2031279056347655216" -->

## Accepted evolution, not current implementation

[ADR-0003](../09-architecture-decisions/ADR-0003-self-host-the-private-application-with-aspire.md) accepts the owner's next self-hosted architecture. [ADR-0004](../09-architecture-decisions/ADR-0004-enforce-feature-and-layer-boundaries-with-executable-checks.md) requires executable boundaries rather than conventions alone. These decisions do not bypass the browser-only accepted product baseline: issue #20 must align it through a validated Product Change before implementation. The deployment environment is a configuration choice, not a physical machine name; see [section 07](../07-deployment-view/README.md).
