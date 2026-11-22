import org.gradle.api.Plugin
import org.gradle.api.Project
import org.jetbrains.kotlin.gradle.dsl.JvmTarget
import org.jetbrains.kotlin.gradle.tasks.KotlinCompile

public class ScoremapAndroidConventionPlugin : Plugin<Project> {
    public override fun apply(target: Project): Unit =
        with(target) {
            pluginManager.apply("scoremap.quality")
            tasks.withType(KotlinCompile::class.java).configureEach { task ->
                task.compilerOptions.jvmTarget.set(JvmTarget.JVM_17)
                task.compilerOptions.allWarningsAsErrors.set(true)
                task.compilerOptions.freeCompilerArgs.add("-Xexplicit-api=strict")
            }
            val required =
                listOf(
                    "spotlessCheck",
                    "detekt",
                    "verifySourceCoverage",
                    "compileDebugKotlin",
                    "compileReleaseKotlin",
                    "lintDebug",
                    "lintRelease",
                )
            tasks.register("verifyAndroidConventions") { task ->
                task.group = "verification"
                task.description = "Checks the Android compiler, formatter, analyzer and both Lint variants."
                task.dependsOn(required)
            }
            afterEvaluate {
                check(
                    pluginManager.hasPlugin("com.android.application") ||
                        pluginManager.hasPlugin("com.android.library"),
                ) { "scoremap.android requires an actual Android application or library plugin." }
                required.forEach { name ->
                    check(tasks.findByName(name) != null) { "Missing Android verification task: $path:$name" }
                }
            }
        }
}
