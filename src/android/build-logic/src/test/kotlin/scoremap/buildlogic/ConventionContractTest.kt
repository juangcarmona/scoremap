package scoremap.buildlogic

import org.gradle.testkit.runner.GradleRunner
import org.gradle.testkit.runner.TaskOutcome
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.File
import java.nio.file.Files

public class ConventionContractTest {
    @Test
    public fun compilesRealKotlinToJvm17WithStrictConventions() {
        val fixture = fixture()
        val result = runner(fixture, "verifyKotlinConventions", "assertCompiledConvention").build()
        assertEquals(TaskOutcome.SUCCESS, result.task(":assertCompiledConvention")?.outcome)
        assertTrue(result.output.contains("scoremap-fixture: bytecode=61 warnings=fatal"))
    }

    @Test
    public fun rejectsActualFormattingViolations() {
        val fixture = fixture()
        fixture.resolve("src/main/kotlin/Marker.kt").writeText(
            "internal object Marker{internal fun label():String=\"ScoreMap\"}\n",
        )
        val result = runner(fixture, "spotlessCheck").buildAndFail()
        assertEquals(TaskOutcome.FAILED, result.task(":spotlessKotlinCheck")?.outcome)
        assertTrue(result.output.contains("format violations"))
    }

    @Test
    public fun rejectsAnActualCompilerWarning() {
        val fixture = fixture()
        fixture.resolve("src/main/kotlin/Marker.kt").writeText(
            """
            @Deprecated("fixture-warning")
            internal fun legacy(): String = "ScoreMap"

            internal object Marker {
                internal fun label(): String = legacy()
            }
            """.trimIndent() + "\n",
        )
        val result = runner(fixture, "compileKotlin").buildAndFail()
        assertEquals(TaskOutcome.FAILED, result.task(":compileKotlin")?.outcome)
        assertTrue(result.output.contains("fixture-warning"))
        assertTrue(result.output.contains("warnings found and -Werror specified"))
    }

    @Test
    public fun rejectsAnActualAstDiagnostic() {
        val fixture = fixture()
        fixture.resolve("src/main/kotlin/Marker.kt").appendText("// TODO: diagnostic fixture\n")
        val result = runner(fixture, "detekt").buildAndFail()
        assertEquals(TaskOutcome.FAILED, result.task(":detekt")?.outcome)
        assertTrue(result.output.contains("ForbiddenComment"))
    }

    @Test
    public fun refusesAuthoredKotlinOutsideCompilerSourceSets() {
        val fixture = fixture()
        val omitted = fixture.resolve("src/notRegistered/kotlin/Omitted.kt")
        omitted.parentFile.mkdirs()
        omitted.writeText("internal object Omitted\n")
        val result = runner(fixture, "verifySourceCoverage").buildAndFail()
        assertEquals(TaskOutcome.FAILED, result.task(":verifySourceCoverage")?.outcome)
        assertTrue(result.output.contains("Kotlin source inventory differs"))
        assertTrue(result.output.contains("Omitted.kt"))
    }

    private fun fixture(): File {
        val fixtureRoot = File(requireNotNull(System.getProperty("scoremap.fixtureRoot")))
        fixtureRoot.mkdirs()
        val root = Files.createTempDirectory(fixtureRoot.toPath(), "convention-").toFile()
        root.resolve("settings.gradle.kts").writeText(
            """
            dependencyResolutionManagement {
                repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
                repositories {
                    mavenCentral()
                    google()
                }
                versionCatalogs {
                    create("libs") {
                        version("ktlint", "1.8.0")
                        version("detekt", "1.23.8")
                    }
                }
            }
            rootProject.name = "convention-fixture"
            """.trimIndent() + "\n",
        )
        root.resolve("build.gradle.kts").writeText(buildScript())
        root.resolve("gradle.properties").writeText(
            """
            org.gradle.jvmargs=-Xmx768m -XX:MaxMetaspaceSize=384m -Dfile.encoding=UTF-8
            org.gradle.workers.max=1
            org.gradle.parallel=false
            org.gradle.daemon=false
            org.gradle.java.installations.auto-download=false
            kotlin.compiler.execution.strategy=in-process
            """.trimIndent() + "\n",
        )
        val androidRoot = File(requireNotNull(System.getProperty("scoremap.androidRoot")))
        root.resolve("quality").mkdirs()
        androidRoot.resolve("quality/detekt.yml").copyTo(root.resolve("quality/detekt.yml"))
        root.resolve("src/main/kotlin").mkdirs()
        root.resolve("src/main/kotlin/Marker.kt").writeText(
            """
            internal object Marker {
                internal fun label(value: String): String = value
            }
            """.trimIndent() + "\n",
        )
        return root
    }

    private fun buildScript(): String =
        """
        import org.jetbrains.kotlin.gradle.dsl.JvmTarget
        import org.jetbrains.kotlin.gradle.tasks.KotlinCompile
        import java.io.DataInputStream

        plugins {
            id("scoremap.kotlin")
        }

        tasks.register("assertCompiledConvention") {
            dependsOn("classes")
            doLast {
                val compiler = tasks.named<KotlinCompile>("compileKotlin").get()
                check(compiler.compilerOptions.allWarningsAsErrors.get())
                check(compiler.compilerOptions.jvmTarget.get() == JvmTarget.JVM_17)
                val bytecode =
                    layout.buildDirectory
                        .file("classes/kotlin/main/Marker.class")
                        .get()
                        .asFile
                DataInputStream(bytecode.inputStream()).use { input ->
                    check(input.readInt() == 0xCAFEBABE.toInt())
                    input.readUnsignedShort()
                    check(input.readUnsignedShort() == 61)
                }
                println("scoremap-fixture: bytecode=61 warnings=fatal")
            }
        }
        """.trimIndent() + "\n"

    private fun runner(
        root: File,
        vararg tasks: String,
    ): GradleRunner =
        GradleRunner
            .create()
            .withProjectDir(root)
            .withGradleInstallation(File(requireNotNull(System.getProperty("scoremap.gradleHome"))))
            .withTestKitDir(File(requireNotNull(System.getProperty("scoremap.gradleUserHome"))))
            .withPluginClasspath()
            .withArguments(*tasks, "--offline", "--max-workers=1", "--console=plain", "--stacktrace")
}
