import org.gradle.api.Project

/** Registers the artifact inspection that `verifyHost` and `verifyRelease` rely on. */
public object ReleaseArtifactTask {
    private const val PACKAGED = "intermediates/packaged_manifests"
    private val variants = listOf("debug", "release")

    public fun register(project: Project) {
        project.tasks.register("verifyReleaseArtifact") { task ->
            task.group = "verification"
            task.description = "Inspects the packaged manifests and writes source-bound artifact receipts."
            task.notCompatibleWithConfigurationCache("Receipts bind the built artifacts to the checked-out revision.")
            task.dependsOn("assembleDebug", "assembleRelease")
            task.doLast {
                val problems = variants.flatMap { inspect(project, it) }
                check(problems.isEmpty()) { "Release artifact violations:\n" + problems.joinToString("\n") { "- $it" } }
            }
        }
    }

    private fun inspect(
        project: Project,
        variant: String,
    ): List<String> {
        val revision = SourceRevision.of(project.rootProject.rootDir)
        val capitalized = variant.replaceFirstChar { it.uppercase() }
        val build = project.layout.buildDirectory
        val manifest =
            build
                .file("$PACKAGED/$variant/process${capitalized}ManifestForPackage/AndroidManifest.xml")
                .get()
                .asFile
        val apks =
            build
                .dir("outputs/apk/$variant")
                .get()
                .asFile
                .listFiles { file ->
                    file.extension == "apk"
                }.orEmpty()
        check(manifest.isFile && apks.size == 1) { "Expected one packaged manifest and one APK for $variant." }
        val receipt =
            NativeReceiptPolicy.artifactReceipt(
                variant,
                apks.single(),
                revision.sha,
                revision.dirty,
                manifest.readText(),
            )
        build
            .file("receipts/$variant.json")
            .get()
            .asFile
            .apply { parentFile.mkdirs() }
            .writeText(receipt + "\n")
        return ManifestPolicy.manifestViolations(variant, manifest.readText())
    }
}
