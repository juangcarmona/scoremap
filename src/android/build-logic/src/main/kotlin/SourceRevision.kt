import java.io.File

/** The commit a receipt is bound to; CI supplies it, local runs read it from Git. */
public class SourceRevision(
    public val sha: String,
    public val dirty: Boolean,
) {
    public companion object {
        public fun of(root: File): SourceRevision {
            val sha = System.getenv("GITHUB_SHA") ?: git(root, "rev-parse", "HEAD")
            check(Regex("[0-9a-f]{40}").matches(sha)) { "A 40-character source revision is required, found '$sha'." }
            return SourceRevision(sha, git(root, "status", "--porcelain").isNotBlank())
        }

        private fun git(
            root: File,
            vararg args: String,
        ): String {
            val process = ProcessBuilder(listOf("git", *args)).directory(root).redirectErrorStream(true).start()
            val output =
                process.inputStream
                    .bufferedReader()
                    .readText()
                    .trim()
            check(process.waitFor() == 0) { "git ${args.joinToString(" ")} failed: $output" }
            return output
        }
    }
}
