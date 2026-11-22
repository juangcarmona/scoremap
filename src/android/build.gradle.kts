import org.gradle.api.artifacts.dsl.LockMode
import org.gradle.api.artifacts.ExternalModuleDependency
import javax.xml.XMLConstants
import javax.xml.parsers.DocumentBuilderFactory

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

fun verifySuites(expected: Map<String, Int>, directories: List<String>) {
    val found = directories.flatMap { directory ->
        fileTree(directory) { include("**/TEST-*.xml") }.files
    }.map { it.relativeTo(rootDir).invariantSeparatorsPath }.toSet()
    check(found == expected.keys) { "JUnit suite inventory differs: expected=${expected.keys}, actual=$found" }
    val factory = DocumentBuilderFactory.newInstance().apply {
        setFeature(XMLConstants.FEATURE_SECURE_PROCESSING, true)
        setFeature("http://apache.org/xml/features/disallow-doctype-decl", true)
        setAttribute(XMLConstants.ACCESS_EXTERNAL_DTD, "")
        setAttribute(XMLConstants.ACCESS_EXTERNAL_SCHEMA, "")
    }
    for ((path, count) in expected) {
        val report = file(path)
        check(report.lastModified() >= verificationStartedAt) { "Stale JUnit report: $path" }
        val suite = factory.newDocumentBuilder().parse(report).documentElement
        check(suite.tagName in setOf("testsuite", "testsuites")) { "Expected JUnit suites: $path" }
        check(suite.getAttribute("tests").toInt() == count && suite.getElementsByTagName("testcase").length == count) {
            "Expected $count actual cases in $path"
        }
        for (attribute in listOf("failures", "errors", "skipped")) {
            check(suite.getAttribute(attribute).toInt() == 0) { "JUnit $attribute must be zero: $path" }
        }
        check(suite.getElementsByTagName("skipped").length == 0) { "Skipped JUnit case: $path" }
        val cases = suite.getElementsByTagName("testcase")
        for (index in 0 until cases.length) {
            val case = cases.item(index) as org.w3c.dom.Element
            check(case.getElementsByTagName("failure").length == 0 && case.getElementsByTagName("error").length == 0) {
                "Failed JUnit case: $path"
            }
        }
    }
}

tasks.register("verifyHost") {
    notCompatibleWithConfigurationCache("Fresh verification inspects the effective task graph and JUnit reports.")
    group = "verification"
    description = "Builds the synthetic shell and checks its bootstrap contract without an emulator."
    dependsOn(
        "verifyProjectGraph", ":quality:test", ":quality:verifyKotlinConventions", ":app:verifyAndroidConventions",
        ":app:testDebugUnitTest", ":app:assembleDebug", ":app:assembleRelease", ":app:assembleDebugAndroidTest",
        ":app:lintDebug", ":app:lintRelease",
        gradle.includedBuild("build-logic").task(":verifyConventions"),
    )
    doLast {
        check(fileTree("app/src/test") { include("**/*.kt", "**/*.java") }.isEmpty) {
            "Declare new app JVM suites in the expected inventory before acceptance."
        }
        verifySuites(
            mapOf(
                "quality/build/test-results/test/TEST-scoremap.quality.ReleaseContractTest.xml" to 8,
                "build-logic/build/test-results/test/TEST-scoremap.buildlogic.ConventionContractTest.xml" to 5,
                "build-logic/build/test-results/test/TEST-scoremap.buildlogic.ProjectGraphContractTest.xml" to 5,
            ),
            listOf("quality/build/test-results/test", "build-logic/build/test-results/test", "app/build/test-results"),
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
        verifySuites(mapOf(reports.single().relativeTo(rootDir).invariantSeparatorsPath to 1), listOf(directory))
    }
}

project(":app").tasks.configureEach {
    if (name == "pixelTabletApi37DebugAndroidTest") {
        outputs.upToDateWhen { false }
        outputs.cacheIf { false }
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
