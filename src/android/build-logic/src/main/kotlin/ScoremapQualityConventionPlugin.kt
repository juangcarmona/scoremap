import com.diffplug.gradle.spotless.SpotlessExtension
import com.diffplug.gradle.spotless.SpotlessTask
import io.gitlab.arturbosch.detekt.Detekt
import io.gitlab.arturbosch.detekt.extensions.DetektExtension
import org.gradle.api.Plugin
import org.gradle.api.Project
import org.gradle.api.artifacts.VersionCatalogsExtension
import org.jetbrains.kotlin.gradle.dsl.JvmTarget
import org.jetbrains.kotlin.gradle.tasks.KotlinCompile
import java.io.File

public class ScoremapQualityConventionPlugin : Plugin<Project> {
    public override fun apply(target: Project): Unit =
        with(target) {
            pluginManager.apply("com.diffplug.spotless")
            pluginManager.apply("io.gitlab.arturbosch.detekt")
            val versions = extensions.getByType(VersionCatalogsExtension::class.java).named("libs")
            val kotlinFiles =
                fileTree(projectDir) { tree ->
                    tree.include("**/*.kt")
                    tree.exclude("build/**", ".gradle/**", ".runtime/**")
                }
            val scripts = files("build.gradle.kts", "settings.gradle.kts").filter { it.isFile }
            extensions.configure(SpotlessExtension::class.java) { spotless ->
                spotless.kotlin { format ->
                    format.target(kotlinFiles)
                    format.ktlint(versions.findVersion("ktlint").get().requiredVersion)
                }
                spotless.kotlinGradle { format ->
                    format.target(scripts)
                    format.ktlint(versions.findVersion("ktlint").get().requiredVersion)
                }
            }
            extensions.configure(DetektExtension::class.java) { detekt ->
                detekt.toolVersion = versions.findVersion("detekt").get().requiredVersion
                detekt.config.setFrom(rootProject.file("quality/detekt.yml"))
                detekt.buildUponDefaultConfig = true
                detekt.ignoreFailures = false
                detekt.parallel = false
            }
            val analysis = tasks.named("detekt", Detekt::class.java)
            analysis.configure { task ->
                task.setSource(kotlinFiles)
                task.jvmTarget = "17"
            }
            tasks.register("verifySourceCoverage") { task ->
                task.notCompatibleWithConfigurationCache(
                    "Verification inspects effective compiler/analyzer/formatter inputs.",
                )
                task.group = "verification"
                task.inputs.files(kotlinFiles, scripts)
                task.dependsOn(tasks.withType(KotlinCompile::class.java))
                task.doLast {
                    verifyInputs(target, kotlinFiles.files, scripts.files, analysis.get())
                }
            }
        }

    private fun verifyInputs(
        project: Project,
        kotlinFiles: Set<File>,
        scripts: Set<File>,
        detekt: Detekt,
    ) {
        val expected = kotlinFiles.map { it.canonicalFile }.toSet()
        val build =
            project.layout.buildDirectory
                .get()
                .asFile.canonicalFile
                .toPath()
        val compilers = project.tasks.withType(KotlinCompile::class.java).toList()
        check(expected.isEmpty() || compilers.isNotEmpty()) { "Kotlin sources have no compiler task: ${project.path}" }
        val compiled =
            compilers
                .flatMap { it.sources.files }
                .filter {
                    it.isFile && it.extension == "kt" && !it.canonicalFile.toPath().startsWith(build)
                }.map { it.canonicalFile }
                .toSet()
        check(compiled == expected) {
            "Kotlin source inventory differs: omitted=${expected - compiled}; unexpected=${compiled - expected}"
        }
        check(
            detekt.source.files
                .map { it.canonicalFile }
                .toSet() == expected,
        ) {
            "Detekt source inventory differs from authored Kotlin sources."
        }
        val formatted =
            project.tasks
                .named("spotlessKotlin", SpotlessTask::class.java)
                .get()
                .target.files
                .filter { it.extension == "kt" }
                .map { it.canonicalFile }
                .toSet()
        check(formatted == expected) { "Formatter source inventory differs from authored Kotlin sources." }
        val formattedScripts =
            project.tasks
                .named("spotlessKotlinGradle", SpotlessTask::class.java)
                .get()
                .target.files
                .filter { it.extension == "kts" }
                .map { it.canonicalFile }
                .toSet()
        check(formattedScripts == scripts.map { it.canonicalFile }.toSet()) {
            "Formatter input inventory differs from project Kotlin build scripts."
        }
        compilers.forEach { compiler ->
            check(compiler.compilerOptions.allWarningsAsErrors.get()) { "Kotlin warnings must fail the build." }
            check(compiler.compilerOptions.jvmTarget.get() == JvmTarget.JVM_17) { "Kotlin bytecode must target 17." }
            check("-Xexplicit-api=strict" in compiler.compilerOptions.freeCompilerArgs.get()) {
                "Kotlin compilation requires explicit API discipline."
            }
        }
        check(!detekt.ignoreFailures) { "Detekt failures cannot be ignored." }
    }
}
