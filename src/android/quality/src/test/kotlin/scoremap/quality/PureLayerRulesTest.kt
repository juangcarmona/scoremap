package scoremap.quality

import com.tngtech.archunit.core.importer.ClassFileImporter
import com.tngtech.archunit.lang.EvaluationResult
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

public class PureLayerRulesTest {
    private val classes = ClassFileImporter().importPackages("scoremap")

    /** A rule that matches no compiled class would pass vacuously, so every evaluation proves it saw classes. */
    private fun evaluate(vararg packages: String): EvaluationResult {
        val matched = classes.filter { type -> packages.any { type.packageName.matchesPackage(it) } }
        assertTrue("No compiled classes matched ${packages.toList()}", matched.isNotEmpty())
        return PureLayerRules.noForbiddenAccess(*packages).evaluate(classes)
    }

    private fun String.matchesPackage(pattern: String): Boolean =
        if (pattern.endsWith("..")) {
            this == pattern.dropLast(2) || startsWith(pattern.dropLast(1))
        } else {
            this == pattern.substringBeforeLast('.')
        }

    @Test
    public fun theRealPureModulesAreCompiledAndClean() {
        val result = evaluate("scoremap.music..", "scoremap.library..")
        assertFalse(result.failureReport.toString(), result.hasViolation())
    }

    @Test
    public fun allowedValueObjectsPass() {
        val result = evaluate("scoremap.quality.fixtures.clean..")
        assertFalse(result.failureReport.toString(), result.hasViolation())
    }

    @Test
    public fun everyForbiddenShapeIsRefusedFromCompiledTypes() {
        val shapes =
            mapOf(
                "FullyQualifiedField" to "java.sql.Connection",
                "AliasedImport" to "java.sql.Connection",
                "TypeAliasLeak" to "java.io.File",
                "AnnotatedDeclaration" to "java.beans.ConstructorProperties",
                "InheritedForbiddenType" to "java.sql.Wrapper",
                "GenericPayload" to "java.awt.Point",
                "StorageCall" to "java.nio.file.Files",
            )
        for ((fixture, forbidden) in shapes) {
            val result = PureLayerRules.noForbiddenAccess("scoremap.quality.fixtures.violations").evaluate(classes)
            assertTrue(
                "$fixture must be refused",
                result.failureReport.toString().contains("fixtures.violations.$fixture"),
            )
            assertTrue("$fixture must name $forbidden", result.failureReport.toString().contains(forbidden))
        }
    }
}
