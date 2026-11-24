import org.gradle.api.Plugin
import org.gradle.api.Project
import org.gradle.api.artifacts.ProjectDependency

/** Applies AND-G01 to the evaluated graph of every included project. Apply it to the root project only. */
public class ScoremapProjectGraphPlugin : Plugin<Project> {
    public override fun apply(target: Project) {
        check(target == target.rootProject) { "scoremap.graph belongs to the root project." }
        registerGateIntegrity(target)
        target.tasks.register("verifyProjectGraph") { task ->
            task.group = "verification"
            task.description = "Rejects project edges, modules and conventions outside the section 05 graph."
            task.notCompatibleWithConfigurationCache("Verification inspects every evaluated project configuration.")
            // Anything that reaches the graph check also reaches the integrity check.
            task.dependsOn("verifyGateIntegrity")
            task.doLast {
                val modules = target.allprojects.filter { it != target }
                val edges = modules.associate { it.path to productionEdges(it) }
                val problems =
                    ProjectGraphPolicy.violations(edges) +
                        modules
                            .filter { it.path !in ProjectGraphPolicy.containers }
                            .filter { it.tasks.findByName(CONVENTION_MARKER) == null }
                            .map { "Module ${it.path} does not apply the scoremap quality convention." }
                check(problems.isEmpty()) { "Project graph violations:\n" + problems.joinToString("\n") { "- $it" } }
            }
        }
    }

    private fun registerGateIntegrity(root: Project) {
        root.tasks.register("verifyGateIntegrity") { task ->
            task.group = "verification"
            task.description = "Rejects suppressions, downgraded checks and aggregate-task omissions."
            task.notCompatibleWithConfigurationCache("Verification inspects the evaluated root aggregate.")
            task.doLast {
                val problems = mutableListOf<String>()
                for (module in root.allprojects) {
                    val files =
                        module.fileTree(module.projectDir) { tree ->
                            tree.include("**/*.kt", "**/*.kts", "**/*.yml", "**/*.xml")
                            tree.exclude("build/**", ".gradle/**", ".runtime/**", "src/main/res/**", "**/src/*/res/**")
                            tree.exclude("**/build/**", "build-logic/**")
                        }
                    for (file in files.files) {
                        val name = file.relativeTo(root.rootDir).invariantSeparatorsPath
                        if (file.name.contains("baseline") || file.name == "lint.xml") {
                            problems += "$name is a baseline that hides findings."
                        } else if (file.extension == "kt") {
                            problems += GateIntegrityPolicy.suppressionViolations(name, file.readText())
                        } else if (file.extension != "xml") {
                            problems += GateIntegrityPolicy.downgradeViolations(name, file.readText())
                        }
                    }
                }
                root.tasks.findByName("verifyHost")?.let { host ->
                    val actual = host.dependsOn.filterIsInstance<String>().toSet()
                    problems += GateIntegrityPolicy.missingAggregateTasks(requiredHostTasks(root), actual)
                }
                check(problems.isEmpty()) { "Gate integrity violations:\n" + problems.joinToString("\n") { "- $it" } }
            }
        }
    }

    /** Every module that applies a convention must stay reachable from the root verifier. */
    private fun requiredHostTasks(root: Project): Set<String> {
        val perModule =
            root.subprojects.flatMap { module ->
                listOf("verifyKotlinConventions", "verifyPureClasspath", "verifyAndroidConventions")
                    .filter { module.tasks.findByName(it) != null }
                    .map { "${module.path}:$it" } +
                    // A pure module's own domain tests are part of the host gate.
                    if (module.tasks.findByName("verifyPureClasspath") !=
                        null
                    ) {
                        listOf("${module.path}:test")
                    } else {
                        emptyList()
                    }
            }
        val app = root.findProject(":app")
        val appTasks =
            if (app == null) {
                emptyList()
            } else {
                listOf("testDebugUnitTest", "assembleDebug", "assembleRelease", "assembleDebugAndroidTest")
                    .plus(listOf("lintDebug", "lintRelease", "verifyReleaseArtifact"))
                    .map { ":app:$it" }
            }
        val quality = if (root.findProject(":quality") == null) emptyList() else listOf(":quality:test")
        return (listOf("verifyProjectGraph") + perModule + appTasks + quality).toSet()
    }

    private fun productionEdges(project: Project): Set<String> =
        project.configurations
            .filterNot { configuration -> NON_PRODUCTION.any { configuration.name.contains(it, ignoreCase = true) } }
            .flatMap { it.dependencies.withType(ProjectDependency::class.java) }
            .map { it.path }
            .toSet()

    private companion object {
        /** Registered by scoremap.quality, which every module convention applies. */
        const val CONVENTION_MARKER = "verifySourceCoverage"
        val NON_PRODUCTION =
            listOf("test", "lint", "detekt", "spotless", "ktlint", "ksp", "kapt", "coverage", "compilerPlugin")
    }
}
