import org.gradle.api.JavaVersion
import org.gradle.api.Plugin
import org.gradle.api.Project
import org.gradle.api.plugins.JavaPluginExtension
import org.gradle.api.tasks.compile.JavaCompile
import org.jetbrains.kotlin.gradle.dsl.JvmTarget
import org.jetbrains.kotlin.gradle.dsl.KotlinJvmProjectExtension
import org.jetbrains.kotlin.gradle.tasks.KotlinCompile

public class ScoremapKotlinConventionPlugin : Plugin<Project> {
    public override fun apply(target: Project): Unit =
        with(target) {
            pluginManager.apply("org.jetbrains.kotlin.jvm")
            pluginManager.apply("scoremap.quality")
            extensions.configure(KotlinJvmProjectExtension::class.java) { kotlin ->
                kotlin.jvmToolchain(JavaVersion.VERSION_21.majorVersion.toInt())
                kotlin.compilerOptions.jvmTarget.set(JvmTarget.JVM_17)
                kotlin.compilerOptions.allWarningsAsErrors.set(true)
            }
            tasks.withType(KotlinCompile::class.java).configureEach { task ->
                task.compilerOptions.freeCompilerArgs.add("-Xexplicit-api=strict")
            }
            extensions.configure(JavaPluginExtension::class.java) { java ->
                java.sourceCompatibility = JavaVersion.VERSION_17
                java.targetCompatibility = JavaVersion.VERSION_17
            }
            tasks.withType(JavaCompile::class.java).configureEach { task ->
                task.options.release.set(JavaVersion.VERSION_17.majorVersion.toInt())
            }
            tasks.register("verifyKotlinConventions") { task ->
                task.group = "verification"
                task.dependsOn("classes", "spotlessCheck", "detekt", "verifySourceCoverage")
            }
        }
}
