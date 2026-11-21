<!-- pdac-scope: cited -->

# Tasks

## 1. Establish the pinned Android build

- [ ] 1.1 Add the official pinned Gradle wrapper, stable version catalog, dependency verification metadata and actual lockfiles under `src/android`; verify checksum and clean-checkout dependency resolution.
- [ ] 1.2 Add convention build and module configuration for the accepted architecture; verify a clean build of all declared modules and Compose shell.
- [ ] 1.3 Add executable architecture, source/task inventory and valid/invalid build fixtures; verify the forbidden fixture fails for its intended diagnostic and the allowed fixture succeeds.

## 2. Qualify quality and test runners

- [ ] 2.1 Add strict Kotlin, formatter, Detekt, and debug/release Lint checks; verify all required tasks run and fail on diagnostics.
- [ ] 2.2 Add host and managed-device aggregates with explicit expected suites; verify nonempty, unskipped JUnit reports and host execution without an emulator.
- [ ] 2.3 Add the declared emulator shell test and runner red/green regression; verify a meaningful behavioral failure followed by a passing correction.

## 3. Preserve repository verification and security ownership

- [ ] 3.1 Route root `verify` to Android host checks without removing existing gates; verify the complete prior command chain still executes.
- [ ] 3.2 Audit credential scanning and source discovery across native build artifacts while preserving legacy paths; verify synthetic credential rejection and generated/build-output handling.
- [ ] 3.3 Run the required root verification and strict implementation-plan check; retain completed receipts and report native/device evidence separately from future independent review.

<!-- pdac:cite id="CON-LOCAL-FIRST" digest="sha256:3dd07ade8d6c189ac4f9b29fcf0e51d7abc3a6fd1a1f6ab7093918f0c4484c0a" -->
