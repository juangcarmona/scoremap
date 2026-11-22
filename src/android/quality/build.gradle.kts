import org.jetbrains.kotlin.gradle.dsl.JvmTarget

plugins { id("scoremap.kotlin") }

kotlin {
    jvmToolchain(21)
    compilerOptions {
        jvmTarget = JvmTarget.JVM_17
        allWarningsAsErrors = true
    }
}

java {
    sourceCompatibility = JavaVersion.VERSION_17
    targetCompatibility = JavaVersion.VERSION_17
}

dependencies { testImplementation(libs.junit) }

tasks.test {
    useJUnit()
    maxHeapSize = "256m"
    maxParallelForks = 1
    failOnNoDiscoveredTests.set(true)
    ignoreFailures = false
    outputs.upToDateWhen { false }
    outputs.cacheIf { false }
    systemProperty("scoremap.android.root", rootProject.projectDir.absolutePath)
    inputs.files(
        rootProject.file("gradlew"),
        rootProject.file("gradle/wrapper/gradle-wrapper.jar"),
        rootProject.file("gradle/wrapper/gradle-wrapper.properties"),
        rootProject.file("app/src/main/AndroidManifest.xml"),
        rootProject.file("scripts/verify-android.mjs"),
        rootProject.file("../../scripts/verify-security.mjs"),
        rootProject.file("app/gradle.lockfile"),
        rootProject.file("quality/gradle.lockfile"),
        rootProject.file("build-logic/gradle.lockfile"),
    )
    doFirst { delete(layout.buildDirectory.dir("test-results/test")) }
}
