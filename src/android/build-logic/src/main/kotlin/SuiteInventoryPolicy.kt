import org.w3c.dom.Element
import java.io.File
import javax.xml.XMLConstants
import javax.xml.parsers.DocumentBuilderFactory

/** AND-G08: the executed JUnit evidence must be exactly the declared inventory. */
public object SuiteInventoryPolicy {
    public fun problems(
        root: File,
        expected: Map<String, Int>,
        directories: List<String>,
        startedAt: Long,
    ): List<String> {
        val found =
            directories
                .flatMap { directory ->
                    root
                        .resolve(directory)
                        .walkTopDown()
                        .filter { it.isFile && it.name.startsWith("TEST-") && it.extension == "xml" }
                        .toList()
                }.map { it.relativeTo(root).invariantSeparatorsPath }
                .toSet()
        val inventory =
            buildList {
                (expected.keys - found).sorted().forEach { add("Missing JUnit suite: $it") }
                (found - expected.keys).sorted().forEach { add("Undeclared JUnit suite: $it") }
                expected
                    .filterValues { it < 1 }
                    .keys
                    .sorted()
                    .forEach { add("Declared zero-test suite: $it") }
            }
        return inventory +
            expected.filterKeys { it in found }.flatMap { (path, count) ->
                report(root.resolve(path), path, count, startedAt)
            }
    }

    private fun report(
        file: File,
        path: String,
        count: Int,
        startedAt: Long,
    ): List<String> {
        val suite = if (file.lastModified() < startedAt) null else secureBuilder().parse(file).documentElement
        return when {
            suite == null -> listOf("Stale JUnit report: $path")
            suite.tagName !in setOf("testsuite", "testsuites") -> listOf("Expected JUnit suites: $path")
            else -> caseProblems(suite, path, count)
        }
    }

    private fun caseProblems(
        suite: Element,
        path: String,
        count: Int,
    ): List<String> {
        val cases = suite.getElementsByTagName("testcase")
        val problems = mutableListOf<String>()
        if (suite.getAttribute("tests").toIntOrNull() != count || cases.length != count) {
            problems += "Expected $count actual cases in $path"
        }
        for (attribute in listOf("failures", "errors", "skipped")) {
            if (suite.getAttribute(attribute).toIntOrNull() != 0) problems += "JUnit $attribute must be zero: $path"
        }
        if (suite.getElementsByTagName("skipped").length > 0) problems += "Skipped JUnit case: $path"
        for (index in 0 until cases.length) {
            val case = cases.item(index) as Element
            if (case.getElementsByTagName("failure").length + case.getElementsByTagName("error").length > 0) {
                problems += "Failed JUnit case: $path"
            }
        }
        return problems
    }

    private fun secureBuilder() =
        DocumentBuilderFactory
            .newInstance()
            .apply {
                setFeature(XMLConstants.FEATURE_SECURE_PROCESSING, true)
                setFeature("http://apache.org/xml/features/disallow-doctype-decl", true)
                setAttribute(XMLConstants.ACCESS_EXTERNAL_DTD, "")
                setAttribute(XMLConstants.ACCESS_EXTERNAL_SCHEMA, "")
            }.newDocumentBuilder()
}
