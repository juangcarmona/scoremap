<!-- pdac-scope: cited -->

# Proposal

## Why

The accepted Android target has no native build implementation in this source tree, so a reproducible build and test entry point is needed before feature slices can qualify their code. Existing web and backend verification must remain intact while the native toolchain is introduced.

## What Changes

- Establish a pinned, isolated Android Gradle build and portable host/device verification entry points.
- Enforce module boundaries, compiler and quality checks, debug/release lint, and nonempty test results.
- Extend root verification and security/source inventories without weakening existing checks.
- Keep this slice limited to build and runner qualification; it does not claim musical feature or device acceptance.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. This is build tooling and verification infrastructure, not a change to observable product behavior.

## Impact

The intended impact is the standalone `src/android` build, root package verification scripts, source/security inventories, and Android architecture enforcement records. Current implementation is constrained by the admitted writable-path policy, which does not authorize `src/android`; that missing authorization prevents delivery of the primary native build and its qualification in this candidate.

<!-- pdac:cite id="CON-LOCAL-FIRST" digest="sha256:3dd07ade8d6c189ac4f9b29fcf0e51d7abc3a6fd1a1f6ab7093918f0c4484c0a" -->
