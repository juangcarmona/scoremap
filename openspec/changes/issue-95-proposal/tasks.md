# Tasks

## 1. Isolated build and dependency integrity

- [ ] 1.1 Add the standalone Android wrapper, settings, version catalog, and module scaffolding using the accepted architecture; verify wrapper distribution checksum and a clean-checkout configuration/build.
- [ ] 1.2 Pin the mutually qualified stable toolchain and dependencies; resolve and commit strict locks and separately scoped root/included-build verification metadata; verify ordinary locked resolution succeeds without metadata-generation flags.

## 2. Convention and architecture enforcement

- [ ] 2.1 Implement Android and pure-Kotlin convention plugins with strict compiler, formatter, Detekt, Compose/Lint and task/source inventories; verify every expected task/input is present and failures propagate.
- [ ] 2.2 Implement evaluated graph and compiled architecture policies for accepted module edges and public surfaces; verify positive fixtures pass and forbidden graph/type/signature fixtures fail for the intended diagnostic.
- [ ] 2.3 Wire quality and TestKit suites into `verifyHost`; verify nonzero unskipped results, bounded nested builds, release/debug Lint, and refusal of missing or newly unclassified modules.

## 3. Root integration and runtime suites

- [ ] 3.1 Add a strict root Android verification adapter and preserve existing root checks; verify root `verify` invokes Android `verifyHost` and fails on Android failure.
- [ ] 3.2 Add a real managed-device synthetic-shell suite and `verifyDevice` aggregate; verify the expected Room/Compose suite executes with nonzero unskipped tests on the declared device runner.
- [ ] 3.3 Audit source discovery and credential/security scanning for native paths; verify Android sources are intentionally classified by language tooling and remain included in security inventory.

## 4. Integrated qualification

- [ ] 4.1 Demonstrate meaningful assertion-level red/green evidence for a foundation contract and retain exact source, command, exit status, and outcomes; verify setup/compiler failures are not counted as assertion-red evidence.
- [ ] 4.2 Run the complete declared root install, verification, E2E, and strict implementation-plan checks on the final candidate; record all completed results and outstanding independent review/device acceptance separately.
