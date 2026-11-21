# Architecture documentation

This directory contains the system's canonical architecture documentation in Markdown. It follows the twelve sections of [arc42](https://arc42.org/). Each section has one directory named `NN-slug`; its `README.md` is the canonical section document and any other Markdown files in that directory are supporting architecture material.

## Sections

1. [Introduction and goals](01-introduction-and-goals/README.md)
2. [Architecture constraints](02-constraints/README.md)
3. [System scope and context](03-context-and-scope/README.md)
4. [Solution strategy](04-solution-strategy/README.md)
5. [Building block view](05-building-block-view/README.md)
6. [Runtime view](06-runtime-view/README.md)
7. [Deployment view](07-deployment-view/README.md)
8. [Cross-cutting concepts](08-crosscutting-concepts/README.md)
9. [Architecture decisions](09-architecture-decisions/README.md)
10. [Quality requirements](10-quality-requirements/README.md)
11. [Risks and technical debt](11-risks-and-technical-debt/README.md)
12. [Glossary](12-glossary/README.md)

The implemented browser and private-service realizations coexist with the owner-selected [native Android target](05-building-block-view/android-target.md) under [ADR-0010](09-architecture-decisions/ADR-0010-build-a-separate-native-android-application.md). A selected technical target does not establish product-change application, implemented modules, activated checks or device acceptance.

Keep Markdown as the source of truth. Separate known implementation evidence from assumptions and open questions; do not treat an inferred decision as accepted.
