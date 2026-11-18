# ScoreMap .NET profile adoption

The source snapshot is the installed `@juangcarmona/lighthouse@0.13.19` distribution. ScoreMap owns its copied CQRS/analyzer sources, build policy and tests. The copied LH1001/LH1002 implementation is unchanged; its project adds release tracking. ScoreMap's separate SM1001–SM1004 analyzer adds semantic domain/application purity, recursive contract payload, MVC and endpoint-to-infrastructure refusals. No diagnostic is disabled.

The solution uses one Library module and a separate API/BFF. Root solution/build files are an intentional adaptation supported by the installed verifier. Domain/application/contracts/infrastructure responsibilities remain namespaces in the same module, with additional semantic rules rather than sibling layer assemblies. The module references the analyzer only as an analyzer, exposes `LighthouseModule` and uses the supplied typed handler interfaces. No mediator, generic repository, outbox or cache is introduced.

`npm run verify:backend` runs locked restore, Release compilation and tests, formatting, evaluated module activation, actual invalid LH1001/LH1002 builds and separate invalid SM1001–SM1004 builds. Browser identity/authorization, actual PostgreSQL behavior and production qualification have separate execution evidence. The current tests do not attest full issue28 acceptance or branch-rule configuration.
