---
name: self-host-the-private-application-with-aspire
description: Run the private ScoreMap application and durable database on operator-managed infrastructure, using Aspire and protected access.
status: Accepted
date: 2026-11-15
deciders:
  - Repository owner
tags:
  - self-hosting
  - aspire
  - privacy
---

# ADR-0003: Self-host the private application with Aspire

## Context

The owner has chosen a private, self-hosted deployment for the evolution tracked in issue #19. The existing React PWA remains the client. The owner does not require a public hosted service or a managed cloud database.

The accepted alpha product definition still constrains the runtime to the browser. That constraint must evolve through the validated Product Change route before the new backend behavior is implemented. ADR-0001 remains the description of the current alpha strategy until the accepted Product Change and implementation replace it; this record does not rewrite that history.

<!-- pdac:cite id="CON-LOCAL-FIRST" digest="sha256:a2cd6293106ac4e7a464b7ded96b8670d1de7480624260ba8c49a1400dbc824d" -->

Complete commits, explicit acknowledgement and recovery remain necessary regardless of who operates the database.

<!-- pdac:cite id="BR-DURABILITY" digest="sha256:6b075527861da086b9571e8d117c7844348a437e363423bca46f60cc83b02e0b" -->

## Decision

We will run the application backend and its PostgreSQL database on operator-managed infrastructure. Local deployment means self-hosted server persistence, not browser-only storage or a database embedded separately in every client.

We will retain the React PWA and add a single ASP.NET Core host for the BFF and API. Aspire will define the application composition and support development, publication and deployment to a Docker Compose target. The production artifacts require persistent storage, migrations, health checks, restart behavior, backups and tested restoration. A running development AppHost or dashboard is not production acceptance.

We will provide access over an operator-managed VPN or an authenticated HTTPS subdomain. An operator-managed TLS reverse proxy may forward the application origin and API to the private deployment. Forwarded headers are trusted only from explicitly configured proxies. Application authorization and the content edit-mode guard remain enforced independently of transport protection. The database, administration interfaces and Aspire diagnostics are not public endpoints.

We will preserve approved offline PWA behavior using device-local storage with explicit pending and acknowledged server-save states. Cross-device recovery uses the self-hosted server; it does not require a managed cloud database. Conflict, migration and failure handling remain part of the accepted persistence work.

We will publish only the generic deployment contract and parameterized examples. Real machine names, addresses, network topology, upstream mappings, private identity configuration, credentials and user arrangements stay outside Git, public issues, release artifacts and verification captures. The operator selects the physical host and protected ingress configuration privately.

This accepts an architecture direction. It does not authorize implementation, provisioning, production configuration changes, deployment or Product Change application. Issue #20 owns product alignment and the remaining production identity, storage and delivery details. The personal-use deployment does not authorize dropping the original musical requirements or the explicit permission model.

## Consequences

- **Positive:** The application uses the established Aspire and .NET approach and needs no managed cloud database subscription. The operator controls the musical library and its deployment.
- **Negative:** Availability, updates, storage, backups and recovery are operator responsibilities. Offline clients still need explicit conflict and synchronization behavior.
- **Neutral:** Production identity integration and environment-specific deployment values remain separate decisions and private configuration. Source acceptance, delivery verification and live operation remain separate facts.

## Alternatives considered

- **Managed cloud database and application backend:** not selected for this personal deployment because the owner chose self-hosting. Changing that direction requires a new decision.
- **Browser-only persistence:** insufficient for the requested acknowledged server recovery, ownership and access from multiple devices; retained only for the approved local client behavior.
- **Native-only mobile application:** unnecessary to enable mobile or tablet access to the existing PWA and does not by itself solve durable recovery.
- **Publishing the development dashboard or database:** provides no required musician workflow and violates the private deployment boundary.

## References

- [Evolution parent issue #19](https://github.com/juangcarmona/scoremap/issues/19).
- [Product and architecture alignment #20](https://github.com/juangcarmona/scoremap/issues/20).
- [ADR-0001: Current alpha browser runtime](ADR-0001-use-a-local-first-browser-runtime.md).
- [ADR-0002: Atomic library snapshots](ADR-0002-commit-validated-library-snapshots-atomically.md).
- [Deployment view](../07-deployment-view/README.md).
- [Product Change authority](../../product/README.md).
- [Aspire Docker Compose deployment](https://aspire.dev/deployment/docker-compose/).
