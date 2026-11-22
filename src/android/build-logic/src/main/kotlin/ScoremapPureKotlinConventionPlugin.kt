import org.gradle.api.Plugin
import org.gradle.api.Project
import org.gradle.api.artifacts.component.ProjectComponentIdentifier

/** AND-G02: pure Kotlin/JVM modules whose resolved classpaths contain only allowlisted libraries. */
public class ScoremapPureKotlinConventionPlugin : Plugin<Project> {
    public override fun apply(target: Project): Unit =
        with(target) {
            pluginManager.apply("scoremap.kotlin")
            tasks.register("verifyPureClasspath") { task ->
                task.group = "verification"
                task.description = "Rejects frameworks, database, UI and codec libraries on a pure module classpath."
                task.notCompatibleWithConfigurationCache("Verification inspects resolved configurations.")
                task.doLast {
                    val problems =
                        configurations
                            .filter { it.name in PRODUCTION_CLASSPATHS }
                            .flatMap { configuration ->
                                configuration.incoming.resolutionResult.allComponents
                                    .filter { it.id !is ProjectComponentIdentifier }
                                    .mapNotNull { it.moduleVersion }
                                    .filter { PureClasspathPolicy.rejects(it.group, it.name) }
                                    .map { "${configuration.name}: ${it.group}:${it.name}" }
                            }.distinct()
                    check(problems.isEmpty()) {
                        "Pure module ${target.path} has non-allowlisted classpath entries:\n" +
                            problems.joinToString("\n") { "- $it" }
                    }
                }
            }
        }

    private companion object {
        /** Only what ships; Kotlin/Gradle tooling classpaths are not part of the module's product. */
        val PRODUCTION_CLASSPATHS = setOf("compileClasspath", "runtimeClasspath")
    }
}
