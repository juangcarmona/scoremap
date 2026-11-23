/** The only external libraries a pure `:music`, `:library` or `:exchange` runtime classpath may contain. */
public object PureClasspathPolicy {
    private val allowed =
        setOf(
            "org.jetbrains.kotlin:kotlin-stdlib",
            "org.jetbrains:annotations",
            "org.jetbrains.kotlinx:kotlinx-coroutines-core",
            "org.jetbrains.kotlinx:kotlinx-coroutines-core-jvm",
        )

    public fun rejects(
        group: String?,
        name: String,
    ): Boolean = group == null || "$group:$name" !in allowed
}
