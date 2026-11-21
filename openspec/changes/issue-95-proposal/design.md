<!-- pdac-scope: cited -->

# Design

## Context

See [proposal.md](proposal.md). The accepted Android target and enforcement contract are documented in ADR-0010, section 05, and section 10. There is no `src/android` implementation in the admitted source tree. Root verification currently retains separate product, architecture, frontend, backend, security and application checks.

## Goals / Non-Goals

**Goals:** Define a standalone pinned Gradle build, validated module boundaries, explicit host/device runners, and additive root verification while preserving existing gates.

**Non-Goals:** Implement musical behavior, claim Android execution, replace browser/backend checks, or treat temporary toolchain experiments as native qualification.

## Decisions

- Keep Android as a separate Gradle build under `src/android`, consistent with ADR-0010; alternatives that merge it into the existing TypeScript or .NET build would blur ownership.
- Make root Android verification an additive command and preserve all existing `verify` commands; replacing or conditionally skipping current gates is not acceptable.
- Pin stable, mutually qualified tool versions and verify resolved dependencies with wrapper checksums, locks, and verification metadata. Do not infer qualification from candidate versions alone.
- Separate host tests from managed-device tests and fail on absent or zero-test expected suites. A setup failure is not a meaningful negative fixture.
- Treat the current writable-path omission of `src/android` as an operational blocker, not permission to write there or claim the acceptance evidence.

## Risks / Trade-offs

- [The current allowlist prevents authoring the central deliverable] → Request an authorized implementation scope that includes the Android build and test paths; do not simulate the build in another directory.
- [Toolchain and emulator resource compatibility remain unqualified] → Record exact successful clean-checkout receipts after authorized implementation; preserve failures and skipped checks.
- [Root verifier edits could weaken established ownership] → Add only explicit Android routing and retain the complete existing command chain.

## Migration Plan

No runtime migration. Add the native build as an isolated target, then activate its root/CI gates only with successful host and declared device-runner evidence. Roll back by removing only the additive native routing and target files; retain existing application and verification paths.

## Open Questions

None that alter the design. The path authorization is a delivery blocker to be resolved by the workflow/policy owner.

<!-- pdac:cite id="CON-LOCAL-FIRST" digest="sha256:3dd07ade8d6c189ac4f9b29fcf0e51d7abc3a6fd1a1f6ab7093918f0c4484c0a" -->
