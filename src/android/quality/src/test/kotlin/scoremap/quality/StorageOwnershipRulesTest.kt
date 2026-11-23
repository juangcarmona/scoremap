package scoremap.quality

import com.tngtech.archunit.core.importer.ClassFileImporter
import com.tngtech.archunit.lang.EvaluationResult
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

public class StorageOwnershipRulesTest {
    private val classes = ClassFileImporter().importPackages("scoremap")
    private val base = "scoremap.quality.fixtures.storage"
    private val layout = StorageOwnershipRules.Layout(arrayOf("$base.data.."), "$base.library.port..")

    private fun seen(pkg: String) =
        assertTrue("No compiled classes in $pkg", classes.any { it.packageName.startsWith(pkg) })

    private fun report(result: EvaluationResult) = result.failureReport.toString()

    @Test
    public fun cleanFeaturesAndActivitiesPass() {
        seen("$base.feature.clean")
        val features = StorageOwnershipRules.featuresStayAboveStorage(layout, "$base.feature.clean")
        assertFalse(report(features.evaluate(classes)), features.evaluate(classes).hasViolation())
        val activities = StorageOwnershipRules.activitiesAvoidStorageShortcuts(layout, "$base.shell.clean")
        assertFalse(report(activities.evaluate(classes)), activities.evaluate(classes).hasViolation())
    }

    @Test
    public fun featuresCannotReachAdaptersPortsOrStorageApis() {
        val result = StorageOwnershipRules.featuresStayAboveStorage(layout, "$base.feature").evaluate(classes)
        val text = report(result)
        assertTrue(text, result.hasViolation())
        assertTrue(text, text.contains("DaoFeature") && text.contains("FixtureDao"))
        assertTrue(text, text.contains("PortFeature") && text.contains("FixturePort"))
        assertTrue(text, text.contains("RoomAliasFeature") && text.contains("java.sql.Connection"))
        assertFalse(text, text.contains("CleanFeature"))
    }

    @Test
    public fun anActivityToDaoShortcutIsRefused() {
        val result = StorageOwnershipRules.activitiesAvoidStorageShortcuts(layout, "$base.shell").evaluate(classes)
        val text = report(result)
        assertTrue(text, result.hasViolation())
        assertTrue(text, text.contains("DaoShortcutActivity") && text.contains("FixtureDao"))
        assertFalse(text, text.contains("CleanActivity"))
    }

    @Test
    public fun onlyAdaptersAndTheCompositionRootMayUseStorage() {
        val inspected = arrayOf("$base.feature", "$base.shell", "$base.data.local")
        val composition = arrayOf("$base.data.local..")
        val result = StorageOwnershipRules.onlyAdaptersUseStorage(composition, *inspected).evaluate(classes)
        val text = report(result)
        assertTrue(text, result.hasViolation())
        assertTrue(text, text.contains("RoomAliasFeature"))
        assertFalse("The adapter itself may use storage: $text", text.contains("FixtureDao.<init>"))
    }
}
