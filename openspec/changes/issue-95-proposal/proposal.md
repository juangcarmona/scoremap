# Proposal

## Why

The repository has an accepted standalone Android architecture but no Android build foundation in this checkout. A reproducible build and test entry point is needed so native work can be checked without weakening or bypassing existing web and backend verification.

## What Changes

- Establish a self-contained `src/android` Gradle build using the accepted module boundaries and pinned, integrity-checked toolchain/dependencies.
- Add strict convention and quality checks plus meaningful host and managed-device test entry points.
- Integrate Android host verification into the existing root verification chain while retaining all existing checks and security/source-discovery coverage.
- Keep this slice limited to foundation and synthetic shell behavior; it does not claim musical functionality or device/product acceptance.

## Capabilities

### New Capabilities

None. This is build, verification, and architecture-enforcement infrastructure; it introduces no new product behavior.

### Modified Capabilities

None.

## Impact

The intended implementation affects `src/android`, root verification/security inventory, package scripts and tests, and the Android architecture enforcement documentation. Existing web/backend commands, product authorities, and their security checks remain in force.
