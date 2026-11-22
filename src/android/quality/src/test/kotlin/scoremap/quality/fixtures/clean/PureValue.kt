package scoremap.quality.fixtures.clean

/** Allowed: immutable value objects and Kotlin collections only. */
public data class PureValue(
    public val name: String,
    public val parts: List<String>,
) {
    public fun renamed(next: String): PureValue = copy(name = next)
}
