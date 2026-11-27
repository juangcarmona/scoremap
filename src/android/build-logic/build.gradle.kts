import io.gitlab.arturbosch.detekt.Detekt
import org.gradle.api.artifacts.ExternalModuleDependency
import org.gradle.api.artifacts.dsl.LockMode
import org.jetbrains.kotlin.gradle.dsl.JvmTarget
import org.jetbrains.kotlin.gradle.tasks.KotlinCompile
import javax.xml.XMLConstants
import javax.xml.parsers.DocumentBuilderFactory

buildscript {
    configurations.classpath {
        resolutionStrategy.activateDependencyLocking()
    }
    dependencyLocking {
        lockMode.set(LockMode.STRICT)
        lockFile.fileValue(file("../build-logic-buildscript-gradle.lockfile"))
    }
}

plugins {
    alias(libs.plugins.kotlin.jvm)
    `java-gradle-plugin`
    id("com.diffplug.spotless") version "8.12.0"
    id("io.gitlab.arturbosch.detekt") version "1.23.8"
}

check(gradle.gradleVersion == "9.7.0") { "Use the pinned Gradle 9.7.0 wrapper." }
check(libs.versions.spotless.get() == "8.12.0" && libs.versions.detekt.get() == "1.23.8") {
    "Build-logic plugin versions must agree with the root catalog."
}

kotlin {
    jvmToolchain(21)
    explicitApi()
    compilerOptions {
        jvmTarget.set(JvmTarget.JVM_17)
        allWarningsAsErrors.set(true)
    }
}

java {
    sourceCompatibility = JavaVersion.VERSION_17
    targetCompatibility = JavaVersion.VERSION_17
}

dependencyLocking {
    lockAllConfigurations()
    lockMode.set(LockMode.STRICT)
}

configurations.configureEach {
    // Locking and Gradle's failOnDynamicVersions mode are mutually exclusive.
    resolutionStrategy.eachDependency {
        val version = requested.version.orEmpty()
        check(version.none { it in "+[]()," } && !version.startsWith("latest.", ignoreCase = true)) {
            "A fixed dependency version is required: $requested"
        }
    }
    resolutionStrategy.componentSelection.all {
        if (Regex("(?i)(?:^|[-.])(snapshot|alpha|beta|rc|dev|eap|preview|milestone|m)(?:[-.0-9]|$)")
                .containsMatchIn(candidate.version)
        ) {
            reject("A stable dependency version is required: $candidate")
        }
    }
    withDependencies {
        filterIsInstance<ExternalModuleDependency>().forEach { dependency ->
            check(!dependency.isChanging) { "Changing dependencies are forbidden: $dependency" }
        }
    }
}

dependencies {
    implementation("org.jetbrains.kotlin:kotlin-gradle-plugin:${libs.versions.kotlin.get()}")
    implementation("com.diffplug.spotless:spotless-plugin-gradle:${libs.versions.spotless.get()}")
    implementation("io.gitlab.arturbosch.detekt:detekt-gradle-plugin:${libs.versions.detekt.get()}")
    testImplementation(gradleTestKit())
    testImplementation("junit:junit:4.13.2")
}

gradlePlugin {
    plugins {
        register("scoremapAndroid") {
            id = "scoremap.android"
            implementationClass = "ScoremapAndroidConventionPlugin"
        }
        register("scoremapGraph") {
            id = "scoremap.graph"
            implementationClass = "ScoremapProjectGraphPlugin"
        }
        register("scoremapPure") {
            id = "scoremap.pure"
            implementationClass = "ScoremapPureKotlinConventionPlugin"
        }
        register("scoremapKotlin") {
            id = "scoremap.kotlin"
            implementationClass = "ScoremapKotlinConventionPlugin"
        }
        register("scoremapQuality") {
            id = "scoremap.quality"
            implementationClass = "ScoremapQualityConventionPlugin"
        }
    }
}

spotless {
    kotlin {
        target("src/**/*.kt")
        ktlint(libs.versions.ktlint.get())
    }
    kotlinGradle {
        target("*.gradle.kts", "../build.gradle.kts", "../settings.gradle.kts")
        ktlint(libs.versions.ktlint.get())
    }
}

detekt {
    toolVersion = libs.versions.detekt.get()
    config.setFrom(files("../quality/detekt.yml"))
    buildUponDefaultConfig = true
    ignoreFailures = false
    parallel = false
}

val authoredKotlin = fileTree("src") { include("**/*.kt") }
tasks.named<Detekt>("detekt") {
    setSource(authoredKotlin)
    jvmTarget = "17"
}

val verifyBuildLogicSources =
    tasks.register("verifyBuildLogicSources") {
        notCompatibleWithConfigurationCache("Verification inspects actual compiler and analyzer inputs.")
        inputs.files(authoredKotlin)
        mustRunAfter(tasks.withType<KotlinCompile>())
        doLast {
            val expected = authoredKotlin.files.map { it.canonicalFile }.toSet()
            val compiled =
                tasks
                    .withType<KotlinCompile>()
                    .flatMap { it.sources.files }
                    .filter { it.isFile && it.extension == "kt" }
                    .map { it.canonicalFile }
                    .toSet()
            check(expected.isNotEmpty() && expected == compiled) { "Build-logic compiler source inventory differs." }
            val analyzed =
                tasks
                    .named<Detekt>("detekt")
                    .get()
                    .source.files
                    .map { it.canonicalFile }
                    .toSet()
            check(analyzed == expected) { "Build-logic Detekt source inventory differs." }
        }
    }

tasks.test {
    // TestKit reuses these verified tool dependencies and must not redownload them from an empty cache.
    dependsOn("spotlessCheck", "detekt")
    useJUnit()
    maxHeapSize = "256m"
    maxParallelForks = 1
    failOnNoDiscoveredTests.set(true)
    ignoreFailures = false
    outputs.upToDateWhen { false }
    outputs.cacheIf { false }
    systemProperty("scoremap.gradleHome", requireNotNull(gradle.gradleHomeDir).absolutePath)
    systemProperty("scoremap.gradleUserHome", gradle.gradleUserHomeDir.absolutePath)
    systemProperty("scoremap.androidRoot", rootDir.parentFile.absolutePath)
    systemProperty(
        "scoremap.fixtureRoot",
        layout.buildDirectory
            .dir("convention-fixtures")
            .get()
            .asFile.absolutePath,
    )
    doFirst {
        delete(layout.buildDirectory.dir("test-results/test"))
    }
}

tasks.register("verifyConventions") {
    notCompatibleWithConfigurationCache("Verification requires a fresh non-skipped canonical JUnit suite.")
    group = "verification"
    dependsOn("spotlessCheck", "detekt", "test", verifyBuildLogicSources)
    doLast {
        val report =
            layout.buildDirectory
                .file(
                    "test-results/test/TEST-scoremap.buildlogic.ConventionContractTest.xml",
                ).get()
                .asFile
        check(report.isFile) { "Missing ConventionContractTest JUnit report." }
        val factory = DocumentBuilderFactory.newInstance()
        factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true)
        factory.setAttribute(XMLConstants.ACCESS_EXTERNAL_DTD, "")
        factory.setAttribute(XMLConstants.ACCESS_EXTERNAL_SCHEMA, "")
        val suite = factory.newDocumentBuilder().parse(report).documentElement
        check(suite.getAttribute("tests").toInt() == 5) { "Expected five convention contract cases." }
        for (attribute in listOf("failures", "errors", "skipped")) {
            check(suite.getAttribute(attribute).toInt() == 0) { "Convention cases contain $attribute." }
        }
    }
}

tasks.register("resolveLockedDependencies") {
    notCompatibleWithConfigurationCache("Explicit bootstrap resolves the effective configuration inventory.")
    doLast {
        configurations.filter { it.isCanBeResolved }.forEach { it.resolve() }
    }
}
