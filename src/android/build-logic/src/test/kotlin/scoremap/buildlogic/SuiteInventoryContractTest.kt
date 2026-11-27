package scoremap.buildlogic

import SuiteInventoryPolicy
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.File
import java.nio.file.Files

public class SuiteInventoryContractTest {
    private val dirs = listOf("results")

    @Test
    public fun admitsExactlyTheDeclaredExecutedInventory() {
        val root = root()
        suite(root, "A", tests = 2)
        assertEquals(emptyList<String>(), problems(root, mapOf(path("A") to 2)))
    }

    @Test
    public fun rejectsMissingAndUndeclaredSuites() {
        val root = root()
        suite(root, "A", tests = 1)
        suite(root, "Extra", tests = 1)
        val found = problems(root, mapOf(path("A") to 1, path("B") to 1)).joinToString("\n")
        assertTrue(found, found.contains("Missing JUnit suite: ${path("B")}"))
        assertTrue(found, found.contains("Undeclared JUnit suite: ${path("Extra")}"))
    }

    @Test
    public fun rejectsZeroTestSuitesWhetherExecutedOrDeclared() {
        val root = root()
        suite(root, "Empty", tests = 0)
        val executed = problems(root, mapOf(path("Empty") to 1)).joinToString("\n")
        assertTrue(executed, executed.contains("Expected 1 actual cases in ${path("Empty")}"))
        val declared = problems(root, mapOf(path("Empty") to 0)).joinToString("\n")
        assertTrue(declared, declared.contains("Declared zero-test suite: ${path("Empty")}"))
    }

    @Test
    public fun rejectsSkippedFailedAndStaleReports() {
        val root = root()
        suite(root, "Skipped", tests = 1, body = "<testcase name=\"a\"><skipped/></testcase>", outcome = 1 to 0)
        suite(root, "Failed", tests = 1, body = "<testcase name=\"a\"><failure/></testcase>", outcome = 0 to 1)
        suite(root, "Stale", tests = 1)
        root.resolve(path("Stale")).setLastModified(1_000L)
        val expected = listOf("Skipped", "Failed", "Stale").associate { path(it) to 1 }
        val found = problems(root, expected).joinToString("\n")
        assertTrue(found, found.contains("Skipped JUnit case: ${path("Skipped")}"))
        assertTrue(found, found.contains("JUnit failures must be zero: ${path("Failed")}"))
        assertTrue(found, found.contains("Failed JUnit case: ${path("Failed")}"))
        assertTrue(found, found.contains("Stale JUnit report: ${path("Stale")}"))
    }

    private fun problems(
        root: File,
        expected: Map<String, Int>,
    ): List<String> = SuiteInventoryPolicy.problems(root, expected, dirs, startedAt = 10_000L)

    private fun path(name: String) = "results/TEST-$name.xml"

    private fun root(): File {
        val base = File(requireNotNull(System.getProperty("scoremap.fixtureRoot")))
        base.mkdirs()
        return Files.createTempDirectory(base.toPath(), "suites-").toFile().also { it.resolve("results").mkdirs() }
    }

    private fun suite(
        root: File,
        name: String,
        tests: Int,
        body: String = "",
        outcome: Pair<Int, Int> = 0 to 0,
    ) {
        val cases = body.ifEmpty { (1..tests).joinToString("") { "<testcase name=\"c$it\"/>" } }
        root.resolve(path(name)).writeText(
            "<testsuite name=\"$name\" tests=\"$tests\" skipped=\"${outcome.first}\" " +
                "failures=\"${outcome.second}\" errors=\"0\">$cases</testsuite>",
        )
    }
}
