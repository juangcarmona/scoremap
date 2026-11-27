import org.jetbrains.kotlin.gradle.dsl.JvmTarget

plugins { id("scoremap.pure") }

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

dependencies {
    api(project(":library"))
    testImplementation(libs.junit)
}

tasks.test {
    useJUnit()
    maxHeapSize = "256m"
    failOnNoDiscoveredTests.set(true)
    outputs.upToDateWhen { false }
    outputs.cacheIf { false }
    doFirst { delete(layout.buildDirectory.dir("test-results/test")) }
}
