---
name: enforce-feature-and-layer-boundaries-with-executable-checks
description: Require a domain-centric modular monolith with executable dependency, layer, analyzer and environment boundaries for the self-hosted evolution.
status: Accepted
date: 2026-11-15
deciders:
  - Repository owner
tags:
  - architecture
  - dotnet
  - roslyn
  - verification
---

# ADR-0004: Enforce feature and layer boundaries with executable checks

## Context

The owner requires the architectural discipline used in Raccord and DomusMind, including layers, Roslyn analysis and rules that fail builds rather than relying on prose. ADR-0003 accepts an Aspire-composed, self-hosted ASP.NET Core backend and PostgreSQL alongside the existing PWA. ScoreMap has no .NET solution today; its accepted alpha product definition still needs the validated Product Change in #20 before backend implementation.

The inspected Raccord source has dependency tests, warnings-as-errors, Roslynator/Meziantou and bespoke Roslyn diagnostics. DomusMind separates a pure domain from application/contracts/infrastructure/API and has distinct development and production Aspire compositions; its ADR also records limits of a shared DbContext. The installed Lighthouse 0.13.11 .NET profile supplies semantic LH1001/LH1002, evaluated module activation checks and deliberate failing-build rehearsals. It explicitly does not yet automate all domain-purity/controller/public-payload rules. None of those checks is activated in ScoreMap by referencing them here.

## Decision

We will implement one domain-centric modular monolith with feature-oriented vertical slices and enforced logical domain, application, contracts, infrastructure and HTTP/composition boundaries. We will use the installed Lighthouse .NET module contract and Minimal API composition, adapting Raccord's executable rule discipline and DomusMind's domain purity rather than copying every project or convention. Section 05 owns the dependency graph; section 10 owns its required verification matrix.

We will keep musical meaning and invariants independent of frameworks, rendering and persistence. Application use cases coordinate explicit ports; infrastructure owns EF Core/provider mapping and transactions; HTTP endpoints do not query persistence directly. Modules expose deliberate composition/contract surfaces, not their handlers or entities. Cross-module references terminate at actual contracts, and owned storage cannot be accessed through another module's implementation. Physical projects follow real boundaries, not a five-project scaffold for every noun.

We will reuse Lighthouse's typed handler interfaces, internal sealed implementations, analyzer-only references and evaluated `LighthouseModule` activation. LH1001/LH1002 remain identified by their actual supported semantics. Product-specific semantic and architecture tests must close the remaining layer, controller, endpoint-persistence and recursive public-payload gaps. Every rule has passing and refusing fixtures; compilation rules additionally require an observed broken-build rehearsal. Disabling, omitting or downgrading enforcement is itself a verification failure unless covered by a narrow reviewed exception.

We will require reproducible pinned .NET/analyzer dependencies, locked restore, nullable and warnings-as-errors, SDK analyzers, Roslynator and Meziantou, one C# formatter, dependency/security auditing and existing frontend checks. Verification must cover source/evaluated project references as well as compiled symbols; assembly-reference tests alone miss unused references and same-assembly violations. Existing ProductShape/OpenSpec/ArcShape and exact-head review gates remain in force.

We will keep development and production explicit without tying either to a particular machine. Development uses Aspire's development graph. Production uses separately qualified Aspire publication/deployment artifacts with private operator configuration, persistent data/keys, migrations and recovery. Development identity, seeds and storage shortcuts must be rejected in Production. Section 07 owns the generic environment contract; actual infrastructure stays private.

We will prefer explicit DI, typed use cases, explicit mapping and direct EF Core inside infrastructure. No mandatory third-party mediator, generic repository, cache, bus, outbox or identity platform is introduced by this decision. Authorization and data integrity require real HTTP/PostgreSQL tests, not an analyzer claim. Accepting this direction authorizes documentation/backlog refinement only, not implementation, Product Change apply, CI activation or deployment.

## Consequences

- **Positive:** Autonomous implementation receives a concrete dependency contract, observable rejection cases and a bounded route to reuse existing tooling. Musical rules remain testable, and production cannot be equated with a development machine or dashboard.
- **Negative:** Additional semantic rules, fixtures and CI integration have a maintenance cost. Namespace-level boundaries inside a module require analysis beyond project references; the baseline cannot honestly claim enforcement until these checks execute.
- **Neutral:** Product Change #20 chooses actual aggregate/module boundaries and closes semantic decisions. Operator identity integration, storage retention, recovery targets and deployment values remain separate choices. Authored checks, executed checks, required merge statuses, independent review and deployment are separate evidence.

## Alternatives considered

- **Architecture conventions and review alone:** insufficient for the owner's explicit requirement to reject dependency/layer drift automatically.
- **Copy all of Raccord or DomusMind:** imports unrelated domain/infrastructure and conflicting conventions. ScoreMap adopts Minimal APIs and Lighthouse module rules rather than DomusMind's controller layout or Raccord's bespoke diagnostic semantics unchanged.
- **One technical layer project or service per candidate musical concept:** increases deployment/scaffolding cost without establishing genuine bounded contexts. Logical layers and feature slices remain mandatory without that project explosion.
- **Only LH1001/LH1002 or only compiled dependency tests:** neither catches all domain pollution, nested entity leaks, missing activation or runtime authorization failures; complementary gates are required.
- **A new generic architecture enforcement framework:** unnecessary while the installed Lighthouse verifier and small product-specific checks can cover the actual boundaries.

## References

- [ADR-0003: Self-host with Aspire](ADR-0003-self-host-the-private-application-with-aspire.md).
- [Product/architecture foundation #20](https://github.com/juangcarmona/scoremap/issues/20).
- [Executable architecture baseline #28](https://github.com/juangcarmona/scoremap/issues/28).
- [Integrated qualification #27](https://github.com/juangcarmona/scoremap/issues/27).
- [Building block view](../05-building-block-view/README.md), [deployment view](../07-deployment-view/README.md), [quality gates](../10-quality-requirements/README.md).
- Installed Lighthouse 0.13.11: `assets/profiles/dotnet/architecture.md`, `guardrails.md`, `assets/dotnet-template/Lighthouse.Analyzers/BackendContractAnalyzer.cs` and `src/verify-dotnet.mjs` inside `node_modules/@juangcarmona/lighthouse/`; refresh paths when adopting a new version.
- [Raccord architecture rules](https://github.com/juangcarmona/raccord/blob/38366dc88bccffe5dfa4797cb4d976c423b56733/docs/architecture/architecture-rules.md), [dependency tests](https://github.com/juangcarmona/raccord/blob/38366dc88bccffe5dfa4797cb4d976c423b56733/tests/Raccord.Architecture.Tests/DependencyRulesTests.cs), [analyzer source](https://github.com/juangcarmona/raccord/blob/38366dc88bccffe5dfa4797cb4d976c423b56733/src/shared/Raccord.ArchitectureAnalyzers/ModuleBoundaryAnalyzer.cs).
- [DomusMind modular-monolith decision](https://github.com/juangcarmona/domusmind/blob/c7894d548eebd313e579c09cf9e2bcd0f22453fd/docs/adr/0004-build-a-domain-centric-modular-monolith.md), [development composition](https://github.com/juangcarmona/domusmind/blob/c7894d548eebd313e579c09cf9e2bcd0f22453fd/src/backend/DomusMind.AppHost/AppHost.cs), [production publication composition](https://github.com/juangcarmona/domusmind/blob/c7894d548eebd313e579c09cf9e2bcd0f22453fd/src/backend/DomusMind.Deployment/AppHost.cs).
