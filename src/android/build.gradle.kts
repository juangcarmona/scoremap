import org.gradle.api.artifacts.dsl.LockMode
import org.gradle.api.artifacts.ExternalModuleDependency
import NativeReceiptPolicy
import SourceRevision
import SuiteInventoryPolicy

buildscript {
    configurations.classpath {
        resolutionStrategy.activateDependencyLocking()
    }
    dependencyLocking {
        lockMode.set(LockMode.STRICT)
        lockFile.fileValue(file("buildscript-gradle.lockfile"))
    }
}

plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.jvm) apply false
    alias(libs.plugins.kotlin.compose) apply false
    alias(libs.plugins.ksp) apply false
    id("scoremap.graph")
}

val verificationStartedAt = System.currentTimeMillis()

val qualifiedAgpUtpModules = mapOf(
    "unified-test-platform-launcher" to setOf("launcher"),
    "unified-test-platform-core" to setOf("core"),
    "unified-test-platform-gradle-work-action" to setOf("core-proto", "launcher"),
    "unified-test-platform-android-device-provider-ddmlib" to setOf("core-proto", "android-device-provider-local"),
    "unified-test-platform-android-driver-instrumentation" to setOf("android-driver-instrumentation"),
    "unified-test-platform-android-test-plugin" to setOf("android-test-plugin"),
    "unified-test-platform-android-test-plugin-host-device-info" to setOf("android-device-provider-local"),
    "unified-test-platform-android-test-plugin-host-additional-test-output" to setOf("android-device-provider-local"),
    "unified-test-platform-android-test-plugin-host-apk-installer" to setOf("core-proto", "android-device-provider-local"),
    "unified-test-platform-android-test-plugin-host-coverage" to setOf("android-device-provider-local"),
    "unified-test-platform-android-test-plugin-host-logcat" to setOf("android-device-provider-local"),
    "unified-test-platform-android-test-plugin-host-emulator-control" to setOf("android-device-provider-local", "android-driver-instrumentation"),
    "unified-test-platform-android-test-plugin-result-listener-gradle" to setOf("core-proto", "android-device-provider-local"),
)

allprojects {
    val modulePath = path
    dependencyLocking {
        lockAllConfigurations()
        lockMode.set(LockMode.STRICT)
    }
    configurations.configureEach {
        val qualifiedTools = if (modulePath == ":app") qualifiedAgpUtpModules[name].orEmpty() else emptySet()
        // Gradle 9.7 forbids failOnDynamicVersions alongside dependency locking.
        // Check requested selectors and declarations, while locks/checksums bind resolution.
        resolutionStrategy.eachDependency {
            val version = requested.version.orEmpty()
            check(version.none { it in "+[]()," } && !version.startsWith("latest.", ignoreCase = true)) {
                "A fixed dependency version is required: $requested"
            }
        }
        resolutionStrategy.componentSelection.all {
            if (Regex("(?i)(?:^|[-.])(snapshot|alpha|beta|rc|dev|eap|preview|milestone|m)(?:[-.0-9]|$)")
                    .containsMatchIn(candidate.version) &&
                !(candidate.group == "com.google.testing.platform" && candidate.version == "0.0.9-alpha04" &&
                    candidate.module in qualifiedTools)) {
                reject("A stable dependency version is required: $candidate")
            }
        }
        withDependencies {
            filterIsInstance<ExternalModuleDependency>().forEach { dependency ->
                check(!dependency.isChanging) { "Changing dependencies are forbidden: $dependency" }
            }
        }
    }
}

fun verifySuites(gate: String, expected: Map<String, Int>, directories: List<String>) {
    val problems = SuiteInventoryPolicy.problems(rootDir, expected, directories, verificationStartedAt)
    check(problems.isEmpty()) { "JUnit evidence differs from the inventory:\n" + problems.joinToString("\n") { "- $it" } }
    val revision = SourceRevision.of(rootDir)
    val receipt = NativeReceiptPolicy.executionReceipt(gate, revision.sha, revision.dirty, expected, rootDir)
    file("build/receipts/$gate-execution.json").apply { parentFile.mkdirs() }.writeText(receipt + "\n")
}

tasks.register("verifyHost") {
    notCompatibleWithConfigurationCache("Fresh verification inspects the effective task graph and JUnit reports.")
    group = "verification"
    description = "Builds the synthetic shell and checks its bootstrap contract without an emulator."
    dependsOn(
        "verifyProjectGraph", ":quality:test", ":quality:verifyKotlinConventions",
        ":music:verifyKotlinConventions", ":library:verifyKotlinConventions",
        ":music:verifyPureClasspath", ":library:verifyPureClasspath", ":music:test", ":library:test", ":app:verifyAndroidConventions",
        ":app:testDebugUnitTest", ":app:assembleDebug", ":app:assembleRelease", ":app:assembleDebugAndroidTest",
        ":app:lintDebug", ":app:lintRelease", ":app:verifyReleaseArtifact",
        gradle.includedBuild("build-logic").task(":verifyConventions"),
    )
    doLast {
        check(fileTree("app/src/test") { include("**/*.kt", "**/*.java") }.isEmpty) {
            "Declare new app JVM suites in the expected inventory before acceptance."
        }
        verifySuites(
            "host",
            mapOf(
                "quality/build/test-results/test/TEST-scoremap.quality.ReleaseContractTest.xml" to 8,
                "quality/build/test-results/test/TEST-scoremap.quality.PureLayerRulesTest.xml" to 3,
                "quality/build/test-results/test/TEST-scoremap.quality.StorageOwnershipRulesTest.xml" to 4,
                "music/build/test-results/test/TEST-scoremap.music.HarmonyFixtureTest.xml" to 2,
                "music/build/test-results/test/TEST-scoremap.music.HarmonyRulesTest.xml" to 4,
                "music/build/test-results/test/TEST-scoremap.music.PerformedPitchTest.xml" to 3,
                "library/build/test-results/test/TEST-scoremap.library.LibraryRulesTest.xml" to 9,
                "library/build/test-results/test/TEST-scoremap.library.LibraryLifecycleTest.xml" to 8,
                "build-logic/build/test-results/test/TEST-scoremap.buildlogic.ConventionContractTest.xml" to 5,
                "build-logic/build/test-results/test/TEST-scoremap.buildlogic.ProjectGraphContractTest.xml" to 5,
                "build-logic/build/test-results/test/TEST-scoremap.buildlogic.ReleaseReceiptContractTest.xml" to 5,
                "build-logic/build/test-results/test/TEST-scoremap.buildlogic.GateIntegrityContractTest.xml" to 5,
                "build-logic/build/test-results/test/TEST-scoremap.buildlogic.SuiteInventoryContractTest.xml" to 4,
            ),
            listOf(
                "quality/build/test-results/test", "build-logic/build/test-results/test", "app/build/test-results",
                "music/build/test-results/test", "library/build/test-results/test",
            ),
        )
    }
}

tasks.register("verifyDevice") {
    notCompatibleWithConfigurationCache("Device verification requires fresh executed JUnit reports.")
    group = "verification"
    description = "Runs the real Room/Compose synthetic bootstrap witness on the pinned managed tablet."
    dependsOn(":app:pixelTabletApi37DebugAndroidTest")
    doLast {
        val directory = "app/build/outputs/androidTest-results/managedDevice/debug/pixelTabletApi37"
        val reports = fileTree(directory) { include("**/TEST-*.xml") }.files
        check(reports.size == 1) { "Expected one actual bootstrap device suite." }
        verifySuites("device", mapOf(reports.single().relativeTo(rootDir).invariantSeparatorsPath to 1), listOf(directory))
    }
}

project(":app").tasks.configureEach {
    if (name == "pixelTabletApi37DebugAndroidTest") {
        outputs.upToDateWhen { false }
        outputs.cacheIf { false }
    }
}

tasks.register("verifyRelease") {
    notCompatibleWithConfigurationCache("Release verification compares the receipts of this very run.")
    group = "verification"
    description = "Host and device gates plus source-bound artifact receipts. Upgrade/rollback refusal and release " +
        "performance measurements are not implemented yet and remain pending."
    dependsOn("verifyHost", "verifyDevice")
    doLast {
        val revision = SourceRevision.of(rootDir)
        val receipts = listOf(
            "build/receipts/host-execution.json", "build/receipts/device-execution.json",
            "app/build/receipts/debug.json", "app/build/receipts/release.json",
        )
        val problems = receipts.flatMap { path ->
            val receipt = file(path)
            if (!receipt.isFile || receipt.lastModified() < verificationStartedAt) listOf("Missing or stale receipt: $path")
            else NativeReceiptPolicy.receiptViolations(receipt.readText(), revision.sha).map { "$path: $it" }
        }
        check(problems.isEmpty()) { "Release receipts are not acceptable:\n" + problems.joinToString("\n") { "- $it" } }
    }
}

tasks.register("resolveLockedDependencies") {
    notCompatibleWithConfigurationCache("Explicit dependency bootstrap inspects every resolvable configuration.")
    doLast {
        allprojects.forEach { module ->
            module.configurations.filter { it.isCanBeResolved }.forEach { configuration ->
                // Android selects artifact variants in task-specific views; resolve the lock graph here.
                val unresolved = configuration.incoming.resolutionResult.allDependencies
                    .filterIsInstance<org.gradle.api.artifacts.result.UnresolvedDependencyResult>()
                check(unresolved.isEmpty()) {
                    "Unresolved ${module.path}:${configuration.name}: ${unresolved.map { it.failure.message }}"
                }
                if (module.path == ":app" && configuration.name in qualifiedAgpUtpModules) {
                    // Resolve real UTP tool artifacts/checksums without launching a device on the host worker.
                    configuration.resolve()
                }
            }
        }
    }
}
