/** AND-G08: findings that would let a gate pass without actually enforcing anything. */
public object GateIntegrityPolicy {
    private val sourceSuppressions =
        listOf(
            Regex("""@(?:file:)?Suppress(?:Warnings)?\b"""),
            Regex("""@(?:file:)?SuppressLint\b"""),
            Regex("""ktlint[-:]disable"""),
            Regex("""@Suppress\b"""),
            Regex("""tools:ignore"""),
        )
    private val downgrades =
        listOf(
            Regex("""ignoreFailures\s*(?:=|\.set\()\s*true""") to "analysis failures are ignored",
            Regex("""allWarningsAsErrors\s*(?:=|\.set\()\s*false""") to "compiler warnings are no longer errors",
            Regex("""warningsAsErrors\s*(?:=|\.set\()\s*false""") to "warnings are no longer errors",
            Regex("""-Xsuppress-warnings|-nowarn""") to "the compiler suppresses warnings",
            Regex("""abortOnError\s*=\s*false""") to "lint no longer aborts",
            Regex("""checkReleaseBuilds\s*=\s*false""") to "release builds skip lint",
            Regex("""(?m)^\s*active:\s*false\b""") to "a rule is switched off",
            Regex("""(?m)^\s*severity:\s*(?:info|warning)\b""") to "a rule severity is downgraded",
            Regex("""(?m)^\s*(?:excludes|baseline)\s*:""") to "a rule or finding is excluded",
        )

    /** Reports blanket suppression of compiler, formatter, analyzer or lint findings in authored source. */
    public fun suppressionViolations(
        name: String,
        text: String,
    ): List<String> =
        sourceSuppressions
            .filter { it.containsMatchIn(text) }
            .map { "$name suppresses findings (${it.pattern})." }
            .distinct()
            .take(1)

    /** Reports build or analyzer configuration that downgrades or disables an enforced check. */
    public fun downgradeViolations(
        name: String,
        text: String,
    ): List<String> =
        downgrades
            .filter { (pattern, _) -> pattern.containsMatchIn(text) }
            .map { (_, reason) -> "$name downgrades a gate: $reason." }

    /** Reports required aggregate dependencies that the root verifier no longer reaches. */
    public fun missingAggregateTasks(
        required: Set<String>,
        actual: Set<String>,
    ): List<String> = required.filterNot { it in actual }.sorted().map { "verifyHost omits required task $it." }
}
