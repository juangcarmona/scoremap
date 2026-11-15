---
title: Architecture constraints
arc42-section: "02"
description: Technical realization of fixed boundaries
---

# 2. Architecture constraints

The browser is the sole runtime for the MVP. React and strict TypeScript run in a Vite PWA. There is no server, account, external API dependency or instrument-specific domain module.

<!-- pdac:cite id="CON-LOCAL-FIRST" digest="sha256:c7143c6945173116bb26101e9f1918b6d628d271d01b058eeb6d7f64d99b1f1a" -->

PDF rendering is a separate optional capability. Native Android packaging and hardware integration remain outside this architecture.

<!-- pdac:cite id="CON-SCOPE" digest="sha256:aba4e66b4ace64df292deac32e97539e4ed2c3183669274ca1bc59d4c84ffd4c" -->
