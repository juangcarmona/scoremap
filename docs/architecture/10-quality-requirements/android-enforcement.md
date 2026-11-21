# Proposed Android enforcement contract

This contract belongs to the proposed [Android target](../05-building-block-view/android-target.md). No Android module, analyzer or CI gate is implemented by these documents. [Delivery tasks](../../../openspec/changes/android-native-foundation/tasks.md) own activation and executed proof.

## Toolchain and verification entry points

Use the Gradle Wrapper, Kotlin DSL, a version catalog and included convention plugins. Select a mutually supported stable JDK/Gradle/AGP/Kotlin/Compose/Room/KSP/Detekt toolchain during AND-01; record exact versions and a successful fixture build. No guessed version matrix, dynamic versions, snapshots or silently disabled analyzer to resolve incompatibility. Commit wrapper checksum, dependency locks for resolved configurations and dependency-verification metadata for libraries and plugins, including the included build. Require approved repositories in settings; project-local repositories fail.

Use one formatter: Spotless with pinned ktlint. Detekt checks Kotlin quality and coroutine mistakes; Android Lint checks Android/Compose/resource issues. Kotlin compiler warnings fail builds. Run Lint explicitly for debug and release: compilation alone does not execute all Lint checks. Keep expected diagnostics actionable and use one formatting policy for Gradle and source Kotlin, with documented generated-source handling.

The following names are the proposed task contract, to be created and fixture-tested in AND-01..AND-03:

| Entry point | Required work |
| --- | --- |
| `./gradlew verifyHost` | Source inventory, evaluated dependency/configuration policy, formatting check, Detekt, debug/release Lint, JVM tests, compiled architecture rules, deliberate-invalid-build rehearsals and debug/release compilation. No emulator needed. |
| `./gradlew verifyDevice` | Pinned Gradle Managed Device tests for real Room transactions/migrations, restart/process recreation, Compose interactions and file-intent integration. Fail if an expected suite executes zero tests. |
| `./gradlew verifyRelease` | Both preceding gates plus release-artifact integrity, manifest/API/permission inspection, synthetic library upgrade/rollback refusal and release performance measurements on the declared target. Signing uses external credentials. |
| Root `npm run verify:android` | Calls the Android host aggregate from repository root with the declared toolchain. Existing web/backend commands retain their checks. |

The CI required result must depend on Android host and device results once activated. If separate jobs are used, a final required job waits for every applicable result and fails on missing/skipped prerequisites. Path filters must include changes to product/model, selected specs, root policy, convention plugins and shared fixtures. A README-only change may use documented classification; changed Android code cannot pass through a documentation-only path. Branch protection/current required statuses are verified separately from workflow source.

## Architecture rule matrix

| Rule | Enforcer and required failure evidence |
| --- | --- |
| AND-G01: project graph | Convention-plugin verification inspects every evaluated production dependency/configuration and included module. Only section 05 edges are allowed; cycles, unknown modules, unused forbidden project references and missing convention plugins fail. Test a newly introduced module and a forbidden dependency with no type usage. |
| AND-G02: pure domain/application | Kotlin/JVM plugins and allowlisted classpaths for `:music`, `:library` and `:exchange`; ArchUnit compiled-type/member checks enforce their package responsibilities. Reject framework/database/UI/codec access from domain/application, including type aliases, fully qualified types, annotations, inheritance and generics. Allowed value objects/coroutines pass where specified. |
| AND-G03: storage ownership | Only local adapters use Room/SQLite/filesystem APIs. Features/ViewModels cannot invoke application ports or reach adapter types, even though composition can wire them. Inspect actual compiled method/type access within `:app` too; an Activity-to-DAO shortcut fails. Test an aliased DAO and a same-module forbidden helper. |
| AND-G04: public surfaces | Compiler visibility plus declaration rules require explicit reviewed exports. Recursively inspect public signatures and Kotlin visibility metadata so JVM-public `internal` declarations are not misclassified. Reject nested Room entities, adapter DTOs, mutable collections, framework types and type-alias leaks. Test extension functions, default-visibility declarations and generic/array payloads. |
| AND-G05: UI/state | Detekt/declaration checks enforce approved ViewModel/composable entry conventions; compiled checks reject Context/Activity/Room dependencies in ViewModels. Android Lint and Compose tests cover lifecycle and accessibility. Test GlobalScope, blocking UI work and a leaking ViewModel. Static rules do not prove every runtime scheduling property. |
| AND-G06: admission/durability | Encapsulated validated commands and architecture rules prevent alternate direct writes. Domain/application tests cover edit-mode and invariants; real Room tests prove conditional commit, rollback, receipt reconciliation and no false acknowledgement. An analyzer cannot prove atomic persistence by itself. |
| AND-G07: transfer boundary | DTOs remain inside codec namespaces; application code consumes validated values. Synthetic golden/negative fixtures cover supported versions and complete reference graphs. Actual Room and separate-installation round trips prove activation, not static JSON types alone. |
| AND-G08: enforcement activation | Gradle TestKit runs allowed and forbidden sample builds with the shipped plugins. Missing/downgraded checks, new-module opt-out, blanket suppressions, missing test suites and aggregate-task omissions must fail the root verifier. An unexpectedly successful forbidden build is a test failure. |

Use ArchUnit for compiled dependency semantics and small Detekt rules for Kotlin declaration policy where standard checks are insufficient. Keep Gradle graph inspection for unused references that compiled checks cannot see. Fixture compilation establishes alias/type-resolution behavior instead of claiming that import regexes enforce semantics. Do not introduce an additional general-purpose architecture framework.

## Exceptions and reproducibility

Use narrow reviewed exceptions naming rule, symbol/path, reason, owner, review date and compensating fixture. No global Detekt/Lint baseline, broad package exclusion, fake generated-code label, severity downgrade or ignore-failures flag can authorize architectural drift. Build-policy tests verify effective settings, not only checked-in configuration strings. Policy changes themselves are reviewable; no local verifier can prevent an authorized maintainer from changing the policy.

Keep permission use minimal and intentional. The initial local music workflow requires no network service or microphone/MIDI permissions. Future adapters request their capabilities explicitly. Commit no signing keys, passwords or real arrangements. Keep synthetic fixtures and sanitized artifacts separate from musician data.

<!-- pdac:cite id="CON-CONTENT" digest="sha256:5c08415cc8047dfc3161440d4a427675c191cd7bfecef5d3c7bb139fe0a9752e" -->

## TDD and evidence

For each delivery slice, derive tests from selected ProductShape SB/LC/FR/BR statements. First capture an expected failing behavior with a meaningful assertion, then implement the smallest change, then refactor under green checks. A compiler/setup error is not the intended red stage. Record exact source, command, expected failure and passing execution; test creation order alone is not proof that a test ran red.

Use JVM tests for musical rules/application decisions, coroutine tests for scheduling and state, instrumented Room tests for transactions/migrations, and Compose/device tests for the musician flow. Use independently specified expected music; agreement between two copies of the same algorithm is insufficient. Cover refusal and preservation as well as successful edits. No blanket coverage percentage substitutes for the accepted behavior matrix.

<!-- pdac:cite id="BR-EDIT-GUARD" digest="sha256:20e678c4743404c64a51c01e4446026ac95811827d2f5e1c641839291ad32718" -->
<!-- pdac:cite id="BR-DURABILITY" digest="sha256:6b075527861da086b9571e8d117c7844348a437e363423bca46f60cc83b02e0b" -->
<!-- pdac:cite id="BR-IDENTITY" digest="sha256:6b3d38400ae82fdc926ae2b7a9eee5d02e684c50502545f323adc41cea150768" -->
<!-- pdac:cite id="BR-STRUCTURE" digest="sha256:db3410bd8a3fe7f3da94e63ee8804b1c75f03b8f7dd1e7858cfd05aed03a0686" -->
<!-- pdac:cite id="LC-STRUCTURE" digest="sha256:31caaa7320486ab3a837e8b0f3ac2b14f6e5623b664f131cb85af1ce030a24ef" -->
<!-- pdac:cite id="QR-INTEGRITY" digest="sha256:ab546fccd5704db577b5005460adc8c643dc6adb9173cf2ee750e7f1e6e0ae3e" -->

Release acceptance includes an actual install/update on the target tablet, create/edit/save/reopen, performance-mode refusal, export/import into an independent installation, preservation of unrelated destination content, failed/unsupported import and readable touch operation at landscape/narrow widths and enlarged text. Hardware acceptance is not inferred from emulator screenshots. MIDI/audio remains separately scoped.

<!-- pdac:cite id="FR-BACKUP" digest="sha256:26a789dde39b92764b10fe30b3840c614626a63d96a933bae0a87322cac9f066" -->
<!-- pdac:cite id="QR-READABILITY" digest="sha256:fd18e2b171a6c15b68dc256acc88c7cf32f0376d723faf7a662a374ce49a9f5f" -->

Retain reports for authored behavior coverage, actual host/device execution, deliberate rule violations, independent review, merged revision, distributed artifact and physical musician acceptance as separate observations. A green aggregate does not attest a review or physical installation.

## Primary references

- [Android architecture recommendations](https://developer.android.com/topic/architecture/recommendations)
- [Android Lint command-line execution](https://developer.android.com/studio/write/lint)
- [Room](https://developer.android.com/training/data-storage/room)
- [Gradle convention plugins](https://docs.gradle.org/current/userguide/implementing_gradle_plugins_convention.html)
- [Gradle locking](https://docs.gradle.org/current/userguide/dependency_locking.html)
- [Gradle dependency verification](https://docs.gradle.org/current/userguide/dependency_verification.html)
- [Detekt custom rules and rule testing](https://detekt.dev/docs/introduction/extensions/)
- [ArchUnit](https://www.archunit.org/userguide/html/000_Index.html)
