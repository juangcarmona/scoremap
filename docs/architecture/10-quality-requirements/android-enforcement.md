# Android target enforcement contract

This contract belongs to the accepted [Android target](../05-building-block-view/android-target.md). No Android module, analyzer or CI gate is implemented by these documents. [Delivery tasks](../../../openspec/changes/android-native-foundation/tasks.md) own activation and executed proof.

## Toolchain and verification entry points

Use the Gradle Wrapper, Kotlin DSL, a version catalog and included convention plugins. Select a mutually supported stable JDK/Gradle/AGP/Kotlin/Compose/Room/KSP/Detekt toolchain during AND-01; record exact versions and a successful fixture build. No guessed version matrix, dynamic versions, snapshots or silently disabled analyzer to resolve incompatibility. Commit wrapper checksum, dependency locks for resolved configurations and dependency-verification metadata for libraries and plugins, including the included build. Require approved repositories in settings; project-local repositories fail.

Use one formatter: Spotless with pinned ktlint. Detekt checks Kotlin quality and coroutine mistakes; Android Lint checks Android/Compose/resource issues. Kotlin compiler warnings fail builds. Run Lint explicitly for debug and release: compilation alone does not execute all Lint checks. Keep expected diagnostics actionable and use one formatting policy for Gradle and source Kotlin, with documented generated-source handling.

### Analyzer compatibility preflight — 2026-11-21

Temporary fixtures exercised Spotless 8.12.0 with ktlint 1.8.0, Detekt 1.23.8,
ArchUnit 1.5.1, Kotlin metadata 2.4.21 and Gradle TestKit 9.7.0 alongside the
[qualified compiler/build set](../../evidence/bootstrap/infrastructure.md#android-build-environment-qualification--2026-11-21).
These are stable implementation candidates; AND-01/AND-02 still own their
integration, locks and the complete production/fixture source inventory.
Quality dependencies were resolved into the temporary fixture cache, not the
immutable worker seed. Provision approved-repository access or a separately
prepared public dependency cache before the first real quality build.

Use stable Detekt for demonstrated AST, style and declaration checks. Do not
treat its older compiler as complete Kotlin 2.4.21 type-resolution evidence:
the controlled typed probe detected `System.gc`, `GlobalScope.launch` and
`Thread.sleep` in a suspend function, but missed a configured forbidden
`kotlin.io.println`. A preview comparison detected that additional call; no
preview analyzer or compiler-dependency override is selected. The prescribed
compiler, evaluated Gradle graph, compiled ArchUnit and Kotlin metadata checks
remain responsible for resolved architecture semantics. They must exercise
every applicable AND-G rule and its aliases/signatures, rather than relying on
the older typed analysis to fill an untested gap.

With AGP 9.3.1 built-in Kotlin, the stable Detekt plugin did not create
`detektDebug`. An explicitly wired generic `detekt` task did reject an implicit
export in compiled Android Kotlin. Convention plugins must therefore register
the actual required tasks and enumerate each module/source set, including newly
added modules. Fail on absent tasks, omitted inputs, unparsed permitted syntax
or missing expected diagnostics; missing automatic variants are not a passing
analysis. Keep failures fatal and prove both the corrected and violating cases.

Bound fixture JVMs separately from the main build. The tested TestKit setup used
a 768 MiB outer heap, a 256 MiB single test fork and sequential nested builds
with a 768 MiB heap and one worker. It executed a real valid Java compilation
and an expected rejected build. This proves that bounded mechanism; it does not
qualify large nested Android/Kotlin builds or the complete `verifyHost` graph.
The worker helper already supplies its worker limit, so do not append a
duplicate `--max-workers` argument; nested runners must declare their own limits.
A later `-Dorg.gradle.jvmargs` property does override the helper's heap: a
separate corrected fixture run verified a 768 MiB outer heap with its fixed two
workers. That warm run passed 21 tasks and three tests in 44 seconds with a
2,116,780,032-byte peak; it remains bounded tooling evidence.

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

### AND-01 bounded tooling rules — 2026-11-22

Owner: `juangcarmona`, under the delegated Android MVP implementation decision.
These rules affect build tooling; the architecture matrix above remains binding.

- Project dependencies reject nonfixed selectors, changing declarations and selected prerelease versions. Check selected candidates after BOM constraints; a historical prerelease request overridden by a stable candidate does not select a prerelease.
- **AGP UTP exception:** pinned AGP 9.3.1 itself requires `com.google.testing.platform` internal test tools at exactly `0.0.9-alpha04`. Permit only the module/configuration pairs below in `:app`; every CSV configuration in a resolved lock entry must match. No application/runtime configuration or other module/version/group is exempt. The shipped `ReleaseContractTest.refusesUnqualifiedPreviewLocksWhileAdmittingThePinnedAgpTestRunner` exercises allowed tooling and refused runtime, mixed, wrong-owner, unknown-module/configuration and changed-version entries. The real `OfflineRecreationTest` remains the device execution witness; its availability is not inferred from lock generation.

| Configuration | Permitted modules |
| --- | --- |
| `unified-test-platform-launcher` | `launcher` |
| `unified-test-platform-core` | `core` |
| `unified-test-platform-android-driver-instrumentation` | `android-driver-instrumentation` |
| `unified-test-platform-android-test-plugin` | `android-test-plugin` |
| `unified-test-platform-gradle-work-action` | `core-proto`, `launcher` |
| `unified-test-platform-android-device-provider-ddmlib` | `android-device-provider-local`, `core-proto` |
| `unified-test-platform-android-test-plugin-host-device-info` | `android-device-provider-local` |
| `unified-test-platform-android-test-plugin-host-additional-test-output` | `android-device-provider-local` |
| `unified-test-platform-android-test-plugin-host-apk-installer` | `android-device-provider-local`, `core-proto` |
| `unified-test-platform-android-test-plugin-host-coverage` | `android-device-provider-local` |
| `unified-test-platform-android-test-plugin-host-logcat` | `android-device-provider-local` |
| `unified-test-platform-android-test-plugin-host-emulator-control` | `android-device-provider-local`, `android-driver-instrumentation` |
| `unified-test-platform-android-test-plugin-result-listener-gradle` | `android-device-provider-local`, `core-proto` |


The mapping was inspected in the pinned AGP UTP bytecode and POMs; the [Android upstream UTP update](https://android.googlesource.com/platform/tools/base/+/194884d1def8c3b372bcb46ca34f3e6d6dfdfae7) corroborates the internal pin. Plugin classpaths are a separate scope: stable AGP includes Jetifier beta internals. Their resolved graphs remain locked and checksummed; this does not exempt Jetifier from project/runtime stability checks.

- Buildscript classpath locking is explicit before `plugins`. Root `buildscript-gradle.lockfile` and included-build `../build-logic-buildscript-gradle.lockfile` are distinct tracked inputs under the Android root. They do not replace the included/app/quality project locks or either verification metadata file. Generate them through real resolution and require ordinary strict replay; never share a lock file between providers or edit its entries manually.
- The sole ignored catalog record is `/build-logic/settings-gradle.lockfile`, generated by Gradle for the fixed local TOML import. Settings require the sole local `libs` catalog and reject symlinks or any record other than `empty=incomingCatalogForLibs0`. The root adapter repeats that check after Gradle returns. `ReleaseContractTest.portableAdapterSelectsHelperWithoutDuplicatingItsWorkerArguments` covers absent/empty records and refuses external coordinates, additional state and symlinks. All actual nonempty project/plugin dependency locks remain tracked.
- Kotlin and Gradle Kotlin use one four-space, 120-character formatting policy. `@Composable` functions follow Compose naming; ordinary function naming remains enabled. No analyzer baseline or global diagnostic suppression is introduced.
- The 4 GiB worker uses a 768 MiB outer heap and 768 MiB maximum metaspace, a 256 MiB test fork, and sequential 768 MiB/384 MiB nested TestKit builds. The earlier 512 MiB outer metaspace actually exhausted during combined Android/Lint work; preserve that failed run. Complete-graph execution and device qualification must be reported separately from temporary preflight results.

Keep permission use minimal and intentional. The initial local music workflow requires no network service or microphone/MIDI permissions. Future adapters request their capabilities explicitly. Commit no signing keys, passwords or real arrangements. Keep synthetic fixtures and sanitized artifacts separate from musician data.

<!-- pdac:cite id="CON-CONTENT" digest="sha256:5c08415cc8047dfc3161440d4a427675c191cd7bfecef5d3c7bb139fe0a9752e" -->

## TDD and evidence

For each delivery slice, derive tests from selected ProductShape SB/LC/FR/BR statements. First capture an expected failing behavior with a meaningful assertion, then implement the smallest change, then refactor under green checks. A compiler/setup error is not the intended red stage. Record exact source, command, expected failure and passing execution; test creation order alone is not proof that a test ran red.

Use JVM tests for musical rules/application decisions, coroutine tests for scheduling and state, instrumented Room tests for transactions/migrations, and Compose/device tests for the musician flow. Use independently specified expected music; agreement between two copies of the same algorithm is insufficient. Cover refusal and preservation as well as successful edits. No blanket coverage percentage substitutes for the accepted behavior matrix.

<!-- pdac:cite id="BR-EDIT-GUARD" digest="sha256:20e678c4743404c64a51c01e4446026ac95811827d2f5e1c641839291ad32718" -->
<!-- pdac:cite id="BR-DURABILITY" digest="sha256:d822f18f163b8685937ae5a3137dc04ef4a2d5947ab7a9954245bd965b72fa45" -->
<!-- pdac:cite id="BR-IDENTITY" digest="sha256:d9c6607eb0cc984270a900d1889980f7515f3c1648f31efe56ceb9f3818e0352" -->
<!-- pdac:cite id="BR-STRUCTURE" digest="sha256:db3410bd8a3fe7f3da94e63ee8804b1c75f03b8f7dd1e7858cfd05aed03a0686" -->
<!-- pdac:cite id="LC-STRUCTURE" digest="sha256:31caaa7320486ab3a837e8b0f3ac2b14f6e5623b664f131cb85af1ce030a24ef" -->
<!-- pdac:cite id="QR-INTEGRITY" digest="sha256:efafc9b7b32a7ff39fdb822f04ef46def7c7534b84b2e48a606fce99bea603e6" -->

Release acceptance includes an actual install/update on the target tablet, create/edit/save/reopen, performance-mode refusal, export/import into an independent installation, preservation of unrelated destination content, failed/unsupported import and readable touch operation at landscape/narrow widths and enlarged text. Hardware acceptance is not inferred from emulator screenshots. MIDI/audio remains separately scoped.

<!-- pdac:cite id="FR-BACKUP" digest="sha256:57286bb21b4c895afe8d7831630bec01797580be96efa5fb5a321e9822dca7e1" -->
<!-- pdac:cite id="QR-READABILITY" digest="sha256:7139af1523273cf318b98b0f01da8688627c1a747f656b10017dcd3f0424c4af" -->

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
