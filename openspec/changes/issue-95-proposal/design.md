# Design

## Context

See `proposal.md` for the motivation. The accepted target is a standalone Gradle build under `src/android`; section 05 defines module responsibilities, ADR-0010 selects Kotlin/Compose, and section 10 defines the required enforcement and aggregate entry points. The current checkout has no `src/android` tree, so implementation-specific versions, resolved locks, verification hashes, and test results must be produced from an actual candidate rather than inferred.

## Goals / Non-Goals

**Goals:**
- Make the Android build self-contained and reproducible with the official wrapper, exact stable pins, resolved dependency locks, and dependency verification for both root and included builds.
- Enforce accepted module boundaries and strict Kotlin/format/analyzer/Lint checks, with nonempty host and managed-device test execution.
- Make root verification invoke Android host verification without dropping existing verifier coverage; keep security scanning inclusive of `src/android`.

**Non-Goals:**
- Implement native musical editing, library persistence behavior, import/export features, or production release/signing.
- Treat prior operator-reported runs as this implementation's execution evidence or as acceptance.

## Decisions

1. **Keep Gradle isolated under `src/android`.** This matches ADR-0010 and prevents Android plugin resolution from changing the existing web/backend build. Root scripts call the native adapter explicitly; alternatives such as moving existing sources or coupling native verification into unrelated toolchains add avoidable churn.
2. **Use only qualified, exact dependency/toolchain versions and generated integrity data.** Versions and locks must come from a successful resolution/build using approved public repositories. Do not fabricate metadata or use write-lock/verification modes as a passing check. This is safer than guessing a compatible matrix.
3. **Enforce architecture through complementary evaluated-graph and compiled-code checks.** Gradle graph checks catch unused/forbidden project edges; compiled rules and bounded invalid-build fixtures exercise type/signature leaks and enforcement behavior. Import/path regexes alone are insufficient for Kotlin aliases and compiled visibility.
4. **Separate host and managed-device aggregates.** Host tests remain emulator-independent; device verification runs real instrumented suites and fails when expected suites are absent, skipped, or empty. A source inventory or successful APK build is not a substitute for executed tests.
5. **Preserve the existing root verifier and security inventory.** Add the Android invocation without conditional-success paths or source exclusions. TypeScript tooling may classify Kotlin intentionally, but credential/security scanning must continue to cover the native tree.

## Risks / Trade-offs

- [Stable plugin compatibility and cold dependency resolution may be costly] → qualify the exact pinned set and resolve against approved public repositories before committing locks or checksums.
- [Nested TestKit builds can exceed worker memory] → bound outer, test-fork, and nested JVMs independently and run nested fixtures sequentially.
- [A green host suite can miss device-only behavior] → retain a distinct real managed-device suite and report host/device outcomes separately.
- [Broad architecture rules can create false positives or loopholes] → use accepted module policy, positive and negative fixtures, and intended-diagnostic assertions.

## Migration Plan

No existing application migration is required. Add the isolated native build and root invocation while preserving current commands. Rollback consists of reverting the issue's scoped Android and root-verification changes; it must not remove existing checks or alter canonical product intent.

## Open Questions

None. Exact tool versions and dependency metadata are implementation outputs that must be established by the qualified build, not deferred product decisions.
