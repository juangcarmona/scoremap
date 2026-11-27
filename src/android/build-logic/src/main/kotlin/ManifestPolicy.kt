import org.w3c.dom.Element
import javax.xml.XMLConstants
import javax.xml.parsers.DocumentBuilderFactory

/** AND-03: refusals over the packaged Android manifest of each variant. */
public object ManifestPolicy {
    private const val ANDROID = "http://schemas.android.com/apk/res/android"

    /**
     * The initial local music workflow needs no capability. The only entry is AndroidX's app-private signature
     * permission that guards unexported dynamic receivers; it grants nothing to other apps. Add a permission here
     * only with its reviewed decision.
     */
    private const val DYNAMIC_RECEIVER_PERMISSION = ".DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION"

    public fun manifestViolations(
        variant: String,
        manifest: String,
    ): List<String> {
        val root = secureBuilder().parse(manifest.byteInputStream()).documentElement
        val application = root.getElementsByTagName("application").item(0) as? Element
        val applicationProblems =
            if (application == null) {
                listOf("$variant manifest declares no application.")
            } else {
                applicationViolations(variant, application)
            }
        // Debug manifests merge tooling components and permissions that never ship; release must be minimal.
        val distribution =
            if (variant ==
                "release"
            ) {
                permissionViolations(variant, root) + exportViolations(variant, root)
            } else {
                emptyList()
            }
        return applicationProblems + distribution
    }

    private fun attribute(
        element: Element,
        name: String,
    ): String = element.getAttributeNS(ANDROID, name)

    private fun permissionViolations(
        variant: String,
        root: Element,
    ): List<String> =
        elements(root, "uses-permission")
            .map { attribute(it, "name") }
            .filter { it != root.getAttribute("package") + DYNAMIC_RECEIVER_PERMISSION }
            .map { "$variant manifest requests unreviewed permission $it." }

    private fun applicationViolations(
        variant: String,
        application: Element,
    ): List<String> =
        buildList {
            if (attribute(application, "allowBackup") != "false") add("$variant manifest must set allowBackup=false.")
            if (attribute(application, "usesCleartextTraffic") ==
                "true"
            ) {
                add("$variant manifest allows cleartext traffic.")
            }
            if (variant == "release" &&
                attribute(application, "debuggable") == "true"
            ) {
                add("release manifest is debuggable.")
            }
            if (variant == "release" &&
                attribute(application, "testOnly") == "true"
            ) {
                add("release manifest is test-only.")
            }
        }

    private fun exportViolations(
        variant: String,
        root: Element,
    ): List<String> =
        listOf("activity", "service", "receiver")
            .flatMap { elements(root, it) }
            .filter { attribute(it, "exported") == "true" && it.getElementsByTagName("intent-filter").length == 0 }
            .map { "$variant manifest exports ${attribute(it, "name")} without an intent filter." }

    private fun elements(
        root: Element,
        tag: String,
    ): List<Element> =
        (0 until root.getElementsByTagName(tag).length).map {
            root.getElementsByTagName(tag).item(it) as Element
        }

    public fun sdkLevels(manifest: String): Pair<Int, Int> {
        val sdk =
            secureBuilder()
                .parse(
                    manifest.byteInputStream(),
                ).documentElement
                .getElementsByTagName("uses-sdk")
                .item(0) as? Element

        fun level(name: String) =
            sdk
                ?.getAttributeNS(ANDROID, name)
                .orEmpty()
                .ifEmpty { "0" }
                .toInt()
        return level("minSdkVersion") to level("targetSdkVersion")
    }

    private fun secureBuilder() =
        DocumentBuilderFactory
            .newInstance()
            .apply {
                isNamespaceAware = true
                setFeature(XMLConstants.FEATURE_SECURE_PROCESSING, true)
                setFeature("http://apache.org/xml/features/disallow-doctype-decl", true)
                setAttribute(XMLConstants.ACCESS_EXTERNAL_DTD, "")
                setAttribute(XMLConstants.ACCESS_EXTERNAL_SCHEMA, "")
            }.newDocumentBuilder()
}
