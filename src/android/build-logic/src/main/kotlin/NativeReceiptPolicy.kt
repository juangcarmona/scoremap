import java.io.File
import java.security.MessageDigest

/** AND-03: manifest refusals and source-bound receipts for native artifacts and executed suites. */
public object NativeReceiptPolicy {
    public fun sha256(file: File): String =
        MessageDigest.getInstance("SHA-256").digest(file.readBytes()).joinToString("") { "%02x".format(it) }

    public fun artifactReceipt(
        variant: String,
        artifact: File,
        sourceRevision: String,
        dirty: Boolean,
        manifest: String,
    ): String {
        val (minSdk, targetSdk) = ManifestPolicy.sdkLevels(manifest)
        return json(
            "kind" to "native-artifact",
            "sourceRevision" to sourceRevision,
            "dirtyWorkingTree" to dirty,
            "variant" to variant,
            "artifact" to artifact.name,
            "signed" to (!artifact.name.contains("unsigned") && variant == "release"),
            "sha256" to sha256(artifact),
            "bytes" to artifact.length(),
            "minSdk" to minSdk,
            "targetSdk" to targetSdk,
        )
    }

    /** Binds each executed JUnit report, by digest and count, to the revision that produced it. */
    public fun executionReceipt(
        gate: String,
        sourceRevision: String,
        dirty: Boolean,
        suites: Map<String, Int>,
        root: File,
    ): String =
        json(
            "kind" to "native-execution",
            "gate" to gate,
            "sourceRevision" to sourceRevision,
            "dirtyWorkingTree" to dirty,
            "suites" to
                suites.entries
                    .sortedBy { it.key }
                    .joinToString(prefix = "[", postfix = "]") { (path, count) ->
                        json("report" to path, "cases" to count, "sha256" to sha256(root.resolve(path)))
                    },
        )

    /** Reports problems in an artifact receipt a reviewer is about to rely on. */
    public fun receiptViolations(
        receipt: String,
        expectedRevision: String,
    ): List<String> =
        buildList {
            if (!receipt.contains(
                    "\"sourceRevision\": \"$expectedRevision\"",
                )
            ) {
                add("Receipt is not bound to $expectedRevision.")
            }
            if (receipt.contains("\"dirtyWorkingTree\": true")) add("Receipt was produced from a dirty working tree.")
            if (!Regex(
                    "\"sha256\": \"[0-9a-f]{64}\"",
                ).containsMatchIn(receipt)
            ) {
                add("Receipt carries no artifact digest.")
            }
        }

    private fun json(vararg fields: Pair<String, Any>): String =
        fields.joinToString(prefix = "{", postfix = "}", separator = ", ") { (name, value) ->
            val rendered =
                when (value) {
                    is String -> if (value.startsWith("[") || value.startsWith("{")) value else "\"${escape(value)}\""
                    else -> value.toString()
                }
            "\"$name\": $rendered"
        }

    private fun escape(value: String) = value.replace("\\", "\\\\").replace("\"", "\\\"")
}
