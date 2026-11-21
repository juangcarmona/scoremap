---
title: Deployment view
arc42-section: "07"
description: Anonymous static delivery and integrated private development and production deployment contracts
---

# 7. Deployment view

## Original anonymous alpha

The alpha deployment contract is a static HTTPS origin with Vite-built assets, a manifest, icons and a service worker. Its original static hosting choice does not constrain the next self-hosted deployment. The project has no Wrangler deployment dependency. Build: `npm ci --ignore-scripts && npm run build`; output: `dist`; Node 24. Deployment status is recorded in delivery evidence, not inferred from source integration.

<!-- pdac:cite id="CON-PLATFORM" digest="sha256:276120bdea8e88293e6843367e84966dacdad452cd568a124f64f73a24b529d5" -->

The origin is part of data ownership: moving domains does not migrate IndexedDB. Export/import provides explicit transfer. Android-compatible browser testing can verify the web runtime; physical tablet installation remains a separate acceptance step.

## Private development and production

[ADR-0003](../09-architecture-decisions/ADR-0003-self-host-the-private-application-with-aspire.md) selects self-hosting with Aspire. The merged private application implements the API/BFF, Development graph and a separate production publication entrypoint. Its source, publication, runtime qualification and actual deployment remain separately evidenced. The physical destination does not define the environment: an operator-managed machine can host a production deployment regardless of its location or name.

| Environment | Building blocks and operating contract |
| --- | --- |
| Development | Aspire AppHost composes the API/BFF serving separately built private PWA assets, the selected real identity fixture and PostgreSQL. Development-only identity/test data and diagnostics are isolated, labeled and gated by Development. Local volume persistence is explicit; reset never targets production data. |
| Automated integration | Isolated Aspire/application stack, real PostgreSQL and synthetic principals/content. Deterministic seed/reset and resource cleanup affect only execution-owned test resources. No dependency on personal production credentials or arrangements. |
| Production | Versioned built PWA and API/BFF artifacts plus PostgreSQL, published through an Aspire Docker Compose deployment composition. Operator supplies private target/ingress/identity/secrets. Production startup fails closed for missing required configuration, development identity, seeded users or in-memory persistence fallbacks. |

Production does not mean running Vite, a developer login bypass or a publicly exposed dashboard. Conversely, Aspire is not restricted to development: its production composition publishes the operator-deployable artifacts. Use explicit development and deployment entrypoints or equivalently isolated profiles, with executable tests that prevent development settings entering a Production artifact.

```mermaid
flowchart LR
  Browser[Installed PWA or browser] --> Access[VPN or protected HTTPS ingress]
  Access --> App[Private application origin and BFF/API]
  App --> DB[(Private PostgreSQL)]
```

The generic ingress may use an operator-managed TLS reverse proxy. Application and API preferably share an origin; trust only configured proxies/hosts when deriving scheme, redirects and client information. Neither VPN nor proxy authentication replaces application resource authorization. Database, administration and Aspire diagnostics are not public ingress targets. No physical route, host, address or network inventory belongs in this view.

The production contract requires persistent database storage and session data-protection keys, private secret injection, migration sequencing, readiness/health, restart behavior, redacted telemetry, backup and observed restoration, and a release/rollback procedure compatible with the stored schema. Database volumes are not backups. Keep deployment-specific values and restore receipts in private operator configuration/evidence; publish only parameterized examples and synthetic verification results.

Production qualification runs against a disposable deployment of the production artifacts/configuration contract, not only the development AppHost. Actual operator deployment and live/device acceptance remain separately authorized gates. See [section 10](../10-quality-requirements/README.md) for required evidence.


## Portable application composition

The [Development AppHost](../../../src/root/ScoreMap.AppHost/Program.cs) starts isolated provider and PostgreSQL resources before the API is ready. A pinned local Aspire CLI matches the AppHost SDK. The [two-file bootstrap and deployment runbook](../../../deployment/README.md) owns selection, private generated files, restart behavior and operator procedures; those values are not an infrastructure inventory here.

The application has separate anonymous and private web build outputs so browser verification cannot replace a running private application with the anonymous shell. Production artifacts use the private output, the BFF and a separately configured established OIDC provider. [Compose](../../../deployment/compose.yaml) keeps the database private and binds application ingress to loopback for an operator TLS proxy. A local execution is not a production build, restore rehearsal or Internet deployment.

<!-- pdac:cite id="BR-SESSION" digest="sha256:ef810362632ea22983eed6cfcdb6adfafb1d37497623582d64c0bc7c349e7bc2" -->


## Separate production publication

The [production AppHost](../../../src/root/ScoreMap.Deployment/Program.cs) contains only the prebuilt private application image and persistent PostgreSQL/key volumes. It refuses direct execution, disables dashboard publication and emits no development provider or seeded users. Its generated [portable Compose snapshot](../../../deployment/compose.yaml) binds application ingress to loopback, exposes no database host port, mounts private configuration read-only and receives the database password through an operator-selected secret file. Database readiness precedes application startup. The established external OIDC provider and TLS proxy remain operator integration inputs.

`npm run verify:deployment` restores locked dependencies, generates the model in an isolated temporary directory, compares the snapshot, renders synthetic file selectors and observes direct-run refusal. It starts no containers. `npm run publish:production -- <empty-output-directory>` publishes from a committed Git archive and writes revision/tool/generated-file digests; it preserves nonempty destinations. Publication has no operator credentials or musical data and does not select or qualify an application image. Disposable Production identity/TLS/restart/restore qualification and the actual operator deployment remain separate.

## Native Android delivery target

[ADR-0010](../09-architecture-decisions/ADR-0010-build-a-separate-native-android-application.md) selects a separate installable Android artifact from the build under `src/android`. The target stores music in installation-local persistence and uses explicit portable files to exchange complete songs/sets; it does not require the self-hosted service deployment above. [Android target](../05-building-block-view/android-target.md) owns its runtime components. Build qualification, an installable APK, actual cable installation, tablet behavior and independent-installation transfer remain separately evidenced delivery steps. Toolchain/operator prerequisites belong to the [infrastructure runbook](../../evidence/bootstrap/infrastructure.md), not private machine details in this view.
