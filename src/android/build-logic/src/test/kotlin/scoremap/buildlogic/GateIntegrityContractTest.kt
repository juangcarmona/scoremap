package scoremap.buildlogic

import GateIntegrityPolicy
import org.gradle.testkit.runner.GradleRunner
import org.gradle.testkit.runner.TaskOutcome
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.File
import java.nio.file.Files

public class GateIntegrityContractTest {
    private val suppress = "@" + "Suppress"

    @Test
    public fun rejectsBlanketSuppressionsInEveryForm() {
        val forms =
            listOf(
                "$suppress(\"unused\")\nfun a() = Unit",
                "@file:" + "Suppress(\"detekt\")\npackage x",
                "@" + "SuppressWarnings(\"all\")\nclass A",
                "@" + "SuppressLint(\"x\")\nclass A",
                "// " + "ktlint-disable no-wildcard-imports",
            )
        for (form in forms) {
            assertEquals(form, 1, GateIntegrityPolicy.suppressionViolations("A.kt", form).size)
        }
        assertEquals(emptyList<String>(), GateIntegrityPolicy.suppressionViolations("A.kt", "fun a() = Unit"))
    }

    @Test
    public fun rejectsDowngradedSeverityAndSwitchedOffChecks() {
        val downgrades =
            listOf(
                "ignoreFailures = true",
                "allWarningsAsErrors.set(false)",
                "freeCompilerArgs.add(\"-nowarn\")",
                "abortOnError = false",
                "style:\n  ForbiddenComment:\n    active: false",
                "style:\n  MagicNumber:\n    severity: info",
                "build:\n  baseline: baseline.xml",
            )
        for (text in downgrades) {
            assertEquals(text, 1, GateIntegrityPolicy.downgradeViolations("build.gradle.kts", text).size)
        }
        assertEquals(
            emptyList<String>(),
            GateIntegrityPolicy.downgradeViolations(
                "quality/detekt.yml",
                "style:\n  ForbiddenComment:\n    active: true",
            ),
        )
    }

    @Test
    public fun rejectsAnOmittedAggregateTask() {
        val found =
            GateIntegrityPolicy.missingAggregateTasks(
                setOf("verifyProjectGraph", ":music:verifyKotlinConventions"),
                setOf("verifyProjectGraph"),
            )
        assertEquals(listOf("verifyHost omits required task :music:verifyKotlinConventions."), found)
    }

    @Test
    public fun admitsAComplianceBuildAndRefusesAnOmissionInARealBuild() {
        val admitted =
            runner(
                fixture(hostDependsOn = "\"verifyProjectGraph\", \":music:verifyKotlinConventions\""),
            ).build()
        assertEquals(TaskOutcome.SUCCESS, admitted.task(":verifyGateIntegrity")?.outcome)
        val omitted = runner(fixture(hostDependsOn = "\"verifyProjectGraph\"")).buildAndFail()
        assertTrue(
            omitted.output,
            omitted.output.contains("verifyHost omits required task :music:verifyKotlinConventions."),
        )
    }

    @Test
    public fun refusesASuppressionAndABaselineInARealBuild() {
        val root = fixture(hostDependsOn = "\"verifyProjectGraph\"")
        root.resolve("music/src/main/kotlin").mkdirs()
        root.resolve("music/src/main/kotlin/A.kt").writeText("$suppress(\"unused\")\nclass A\n")
        root.resolve("music/detekt-baseline.xml").writeText("<SmellBaseline/>")
        val result = runner(root).buildAndFail()
        assertTrue(result.output, result.output.contains("music/src/main/kotlin/A.kt suppresses findings"))
        assertTrue(
            result.output,
            result.output.contains("music/detekt-baseline.xml is a baseline that hides findings."),
        )
    }

    private fun fixture(hostDependsOn: String): File {
        val base = File(requireNotNull(System.getProperty("scoremap.fixtureRoot")))
        base.mkdirs()
        val root = Files.createTempDirectory(base.toPath(), "integrity-").toFile()
        root.resolve("settings.gradle.kts").writeText("rootProject.name = \"integrity-fixture\"\ninclude(\":music\")\n")
        root.resolve("build.gradle.kts").writeText(
            "plugins { id(\"scoremap.graph\") }\ntasks.register(\"verifyHost\") { dependsOn($hostDependsOn) }\n",
        )
        root.resolve("gradle.properties").writeText(
            "org.gradle.jvmargs=-Xmx768m -XX:MaxMetaspaceSize=384m\norg.gradle.workers.max=1\n" +
                "org.gradle.daemon=false\norg.gradle.parallel=false\n",
        )
        root.resolve("music").mkdirs()
        root
            .resolve(
                "music/build.gradle.kts",
            ).writeText("tasks.register(\"verifySourceCoverage\")\ntasks.register(\"verifyKotlinConventions\")\n")
        return root
    }

    private fun runner(root: File): GradleRunner =
        GradleRunner
            .create()
            .withProjectDir(root)
            .withGradleInstallation(File(requireNotNull(System.getProperty("scoremap.gradleHome"))))
            .withTestKitDir(File(requireNotNull(System.getProperty("scoremap.fixtureRoot")), "test-kit"))
            .withPluginClasspath()
            .withArguments("verifyHost", "--max-workers=1", "--console=plain", "--stacktrace")
}
