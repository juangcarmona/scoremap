package scoremap.buildlogic

import ProjectGraphPolicy
import org.gradle.testkit.runner.GradleRunner
import org.gradle.testkit.runner.TaskOutcome
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.File
import java.nio.file.Files

public class ProjectGraphContractTest {
    @Test
    public fun theSectionFiveGraphItselfIsAcyclicAndClosed() {
        assertEquals(emptyList<String>(), ProjectGraphPolicy.violations(ProjectGraphPolicy.allowedEdges))
    }

    @Test
    public fun rejectsForbiddenEdgesUnknownModulesAndCyclesInThePolicy() {
        val forbidden =
            mapOf(
                ":music" to setOf(":library"),
                ":library" to setOf(":music"),
                ":feature:library" to setOf(":feature:workspace", ":data:local"),
                ":utils" to emptySet(),
                ":ui" to setOf(":quality"),
            )
        val found = ProjectGraphPolicy.violations(forbidden).joinToString("\n")
        assertTrue(found, found.contains("Forbidden production edge :music -> :library."))
        assertTrue(found, found.contains("Forbidden production edge :feature:library -> :feature:workspace."))
        assertTrue(found, found.contains("Forbidden production edge :feature:library -> :data:local."))
        assertTrue(found, found.contains("Unknown module :utils"))
        assertTrue(found, found.contains("Forbidden production edge :ui -> :quality."))
        assertTrue(found, found.contains("Dependency cycle: :library -> :music -> :library."))
    }

    @Test
    public fun admitsTheDeclaredGraphInARealBuild() {
        val fixture = fixture(mapOf(":music" to emptyList(), ":library" to listOf(":music")))
        val result = runner(fixture).build()
        assertEquals(TaskOutcome.SUCCESS, result.task(":verifyProjectGraph")?.outcome)
    }

    @Test
    public fun rejectsAForbiddenEdgeEvenWhenNoTypeIsUsed() {
        val fixture = fixture(mapOf(":music" to listOf(":library"), ":library" to listOf(":music")))
        val result = runner(fixture).buildAndFail()
        assertEquals(TaskOutcome.FAILED, result.task(":verifyProjectGraph")?.outcome)
        assertTrue(result.output.contains("Forbidden production edge :music -> :library."))
    }

    @Test
    public fun rejectsANewModuleAndOneMissingTheQualityConvention() {
        val fixture =
            fixture(mapOf(":music" to emptyList(), ":utils" to emptyList()), withoutConvention = setOf(":music"))
        val result = runner(fixture).buildAndFail()
        assertTrue(result.output.contains("Unknown module :utils"))
        assertTrue(result.output.contains("Module :music does not apply the scoremap quality convention."))
    }

    private fun fixture(
        modules: Map<String, List<String>>,
        withoutConvention: Set<String> = emptySet(),
    ): File {
        val base = File(requireNotNull(System.getProperty("scoremap.fixtureRoot")))
        base.mkdirs()
        val root = Files.createTempDirectory(base.toPath(), "graph-").toFile()
        root.resolve("settings.gradle.kts").writeText(
            "rootProject.name = \"graph-fixture\"\n" +
                modules.keys.joinToString("\n") { "include(\"$it\")" } + "\n",
        )
        root.resolve("build.gradle.kts").writeText("plugins { id(\"scoremap.graph\") }\n")
        root.resolve("gradle.properties").writeText(
            "org.gradle.jvmargs=-Xmx768m -XX:MaxMetaspaceSize=384m\norg.gradle.workers.max=1\n" +
                "org.gradle.daemon=false\norg.gradle.parallel=false\n",
        )
        for ((path, dependencies) in modules) {
            val directory = root.resolve(path.removePrefix(":").replace(':', '/'))
            directory.mkdirs()
            val marker = if (path in withoutConvention) "" else "tasks.register(\"verifySourceCoverage\")\n"
            directory.resolve("build.gradle.kts").writeText(
                "plugins { `java-library` }\n$marker" +
                    "dependencies {\n" + dependencies.joinToString("") { "    implementation(project(\"$it\"))\n" } +
                    "}\n",
            )
        }
        return root
    }

    private fun runner(root: File): GradleRunner =
        GradleRunner
            .create()
            .withProjectDir(root)
            .withGradleInstallation(File(requireNotNull(System.getProperty("scoremap.gradleHome"))))
            .withTestKitDir(File(requireNotNull(System.getProperty("scoremap.fixtureRoot")), "test-kit"))
            .withPluginClasspath()
            .withArguments("verifyProjectGraph", "--max-workers=1", "--console=plain", "--stacktrace")
}
