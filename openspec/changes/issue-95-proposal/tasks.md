# Tasks

<!-- pdac-scope: none reason="These tasks establish build and test infrastructure without changing product behavior." -->

## 1. Isolated build foundation

- [ ] 1.1 Add ignored Android build/cache outputs and the official pinned wrapper; verify wrapper checksum and executable wrapper startup.
- [ ] 1.2 Add the isolated Gradle settings, version catalog, minimal compiling Compose shell, and pinned dependency verification; verify clean configuration/build and resolved dependency integrity.
- [ ] 1.3 Add nonempty host and managed-device test runners that refuse absent/zero expected suites; verify host tests without an emulator and execute device suite on declared managed device.

## 2. Root integration and inventory

- [ ] 2.1 Add `verify:android` and append it to root `verify` without removing/changing existing checks; verify root command executes host aggregate and propagates failures.
- [ ] 2.2 Extend security scanning to Kotlin/Gradle/build artifacts while retaining legacy inventory and rejection rules; verify synthetic credential refusal and safe fixture acceptance.
- [ ] 2.3 Add genuine source-ownership and build-policy regression tests; verify expected source inventory, host/device test counts, and deliberate failure behavior.

## 3. Candidate verification

- [ ] 3.1 Run clean npm install, full existing `npm run verify`, browser E2E, and strict implementation-plan validation; retain exact completed results and report unavailable native device qualification.
