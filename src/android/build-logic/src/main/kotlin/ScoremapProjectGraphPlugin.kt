import org.gradle.api.Plugin
import org.gradle.api.Project
import org.gradle.api.artifacts.ProjectDependency

/** Applies AND-G01 to the evaluated graph of every included project. Apply it to the root project only. */
public class ScoremapProjectGraphPlugin : Plugin<Project> {
    public override fun apply(target: Project) {
        check(target == target.rootProject) { "scoremap.graph belongs to the root project." }
        target.tasks.register("verifyProjectGraph") { task ->
            task.group = "verification"
            task.description = "Rejects project edges, modules and conventions outside the section 05 graph."
            task.notCompatibleWithConfigurationCache("Verification inspects every evaluated project configuration.")
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
