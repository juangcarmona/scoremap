# Proposal

<!-- pdac-scope: none reason="This proposal changes build and verification tooling only; it defines no product behavior." -->

## Why

The repository has an accepted native Android target but no isolated Gradle build or native test runners. A pinned, independently verifiable foundation is needed before later slices can add musical behavior without weakening the existing web and backend checks.

## What Changes

- Add a standalone Android Gradle build and official checksummed wrapper under `src/android`.
- Add pinned toolchain/dependency policy and host plus managed-device verification entry points.
- Connect root verification to the Android host gate while preserving every existing verifier.
- Make native source ownership explicit in security and build/source discovery.
- Establish synthetic runner coverage only; do not claim delivered musical features.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. This is build and verification tooling; it changes no product-visible behavior.

## Impact

Adds Gradle/Kotlin/Android build configuration and test sources in `src/android`, a root npm script, and narrowly scoped security/source verification updates. It does not modify canonical product artifacts or the existing application runtime.
