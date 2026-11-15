---
title: Solution strategy
arc42-section: "04"
description: Small feature slices with a pure domain boundary
---

# 4. Solution strategy

The planned source boundary is `src/features/library/`: pure domain types and commands, a local persistence adapter and feature UI. `src/app/` composes the application shell; `src/features/sketch/` owns the chord geometry and piano presentation. Domain functions import no React or browser persistence. Application mutation entrypoints enforce interaction mode before any content change.

<!-- pdac:cite id="BR-EDIT-GUARD" digest="sha256:20e678c4743404c64a51c01e4446026ac95811827d2f5e1c641839291ad32718" -->

The architecture needs no server-state query layer. Native local React state represents transient selections and mode. See [ADR-0001](../09-architecture-decisions/ADR-0001-use-a-local-first-browser-runtime.md).
