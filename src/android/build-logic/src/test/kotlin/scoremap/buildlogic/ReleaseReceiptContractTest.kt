package scoremap.buildlogic

import ManifestPolicy
import NativeReceiptPolicy
import SourceRevision
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.File
import java.nio.file.Files

public class ReleaseReceiptContractTest {
    private val revision = "a".repeat(40)

    @Test
    public fun admitsTheMinimalReleaseManifest() {
        val manifest =
            manifest(application = "android:allowBackup=\"false\"", extra = "<uses-sdk android:minSdkVersion=\"26\"/>")
        assertEquals(emptyList<String>(), ManifestPolicy.manifestViolations("release", manifest))
    }

    @Test
    public fun refusesDebuggableBackupPermissionAndExportedComponentDrift() {
        val manifest =
            manifest(
                application =
                    "android:debuggable=\"true\" android:testOnly=\"true\" " +
                        "android:usesCleartextTraffic=\"true\"",
                extra =
                    "<uses-permission android:name=\"android.permission.INTERNET\"/>" +
                        "<activity android:name=\".Open\" android:exported=\"true\"/>",
            )
        val found = ManifestPolicy.manifestViolations("release", manifest).joinToString("\n")
        assertTrue(found, found.contains("release manifest is debuggable."))
        assertTrue(found, found.contains("release manifest is test-only."))
        assertTrue(found, found.contains("release manifest must set allowBackup=false."))
        assertTrue(found, found.contains("release manifest allows cleartext traffic."))
        assertTrue(found, found.contains("unreviewed permission android.permission.INTERNET"))
        assertTrue(found, found.contains("exports .Open without an intent filter."))
        val debug = manifest("android:allowBackup=\"false\" android:debuggable=\"true\"", "")
        assertFalse(ManifestPolicy.manifestViolations("debug", debug).any { it.contains("debuggable") })
        val tooling =
            manifest("android:allowBackup=\"false\"", "<activity android:name=\".Preview\" android:exported=\"true\"/>")
        assertEquals(emptyList<String>(), ManifestPolicy.manifestViolations("debug", tooling))
        assertTrue(ManifestPolicy.manifestViolations("debug", manifest("", "")).isNotEmpty())
    }

    @Test
    public fun bindsAnUnsignedArtifactToItsRevisionAndDigest() {
        val directory = Files.createTempDirectory("receipt-").toFile()
        val apk = File(directory, "app-release-unsigned.apk").apply { writeText("apk") }
        val manifest =
            manifest(
                "android:allowBackup=\"false\"",
                "<uses-sdk android:minSdkVersion=\"26\" android:targetSdkVersion=\"37\"/>",
            )
        val receipt = NativeReceiptPolicy.artifactReceipt("release", apk, revision, dirty = false, manifest = manifest)
        assertTrue(receipt, receipt.contains("\"signed\": false"))
        assertTrue(receipt, receipt.contains("\"minSdk\": 26, \"targetSdk\": 37"))
        assertTrue(receipt, receipt.contains("\"sha256\": \"${NativeReceiptPolicy.sha256(apk)}\""))
        assertEquals(emptyList<String>(), NativeReceiptPolicy.receiptViolations(receipt, revision))
    }

    @Test
    public fun refusesAReceiptForAnotherRevisionADirtyTreeOrNoDigest() {
        val directory = Files.createTempDirectory("receipt-").toFile()
        val apk = File(directory, "app-debug.apk").apply { writeText("apk") }
        val dirty =
            NativeReceiptPolicy.artifactReceipt(
                "debug",
                apk,
                revision,
                dirty = true,
                manifest = manifest("", ""),
            )
        val found = NativeReceiptPolicy.receiptViolations(dirty, "b".repeat(40)).joinToString("\n")
        assertTrue(found, found.contains("Receipt is not bound to ${"b".repeat(40)}."))
        assertTrue(found, found.contains("Receipt was produced from a dirty working tree."))
        assertTrue(
            NativeReceiptPolicy.receiptViolations("{\"sourceRevision\": \"$revision\"}", revision).any {
                it.contains("no artifact digest")
            },
        )
    }

    @Test
    public fun bindsExecutedReportsByDigestAndRejectsAMalformedRevision() {
        val directory = Files.createTempDirectory("receipt-").toFile()
        File(directory, "TEST-A.xml").writeText("<testsuite tests=\"2\"/>")
        val receipt = NativeReceiptPolicy.executionReceipt("host", revision, false, mapOf("TEST-A.xml" to 2), directory)
        assertTrue(receipt, receipt.contains("\"gate\": \"host\""))
        assertTrue(receipt, receipt.contains("\"report\": \"TEST-A.xml\", \"cases\": 2"))
        assertTrue(receipt, receipt.contains(NativeReceiptPolicy.sha256(File(directory, "TEST-A.xml"))))
        val failure =
            runCatching {
                SourceRevision.of(
                    Files.createTempDirectory("not-git-").toFile(),
                )
            }.exceptionOrNull()
        assertTrue(failure.toString(), failure != null)
    }

    private fun manifest(
        application: String,
        extra: String,
    ): String =
        "<manifest xmlns:android=\"http://schemas.android.com/apk/res/android\">" +
            "${extra.takeIf { it.startsWith("<uses") }.orEmpty()}<application $application>" +
            "${extra.takeUnless { it.startsWith("<uses") }.orEmpty()}</application></manifest>"
}
