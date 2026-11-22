plugins { id("scoremap.kotlin") }

dependencies {
    api(project(":music"))
    testImplementation(libs.junit)
}

tasks.test {
    useJUnit()
    maxHeapSize = "256m"
    maxParallelForks = 1
    failOnNoDiscoveredTests.set(true)
    ignoreFailures = false
    outputs.upToDateWhen { false }
    outputs.cacheIf { false }
    doFirst { delete(layout.buildDirectory.dir("test-results/test")) }
}
