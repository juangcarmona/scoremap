/** AND-G01: the only production project edges permitted by the section 05 module graph. */
public object ProjectGraphPolicy {
    private val domain = setOf(":library", ":music")
    private val features = domain + ":ui"

    public val allowedEdges: Map<String, Set<String>> =
        mapOf(
            ":music" to emptySet(),
            ":library" to setOf(":music"),
            ":data:local" to domain,
            ":exchange" to domain,
            ":ui" to emptySet(),
            ":feature:library" to features,
            ":feature:workspace" to features,
            ":app" to features + setOf(":data:local", ":exchange", ":feature:library", ":feature:workspace"),
            ":quality" to emptySet(),
        )

    /** Parent projects that only group children; they own no code and no edges. */
    public val containers: Set<String> = setOf(":data", ":feature")

    public fun violations(edges: Map<String, Set<String>>): List<String> {
        val found = mutableListOf<String>()
        for ((module, targets) in edges.toSortedMap()) {
            val allowed = allowedEdges[module]
            if (allowed == null) {
                if (module !in containers) found += "Unknown module $module is not in the section 05 graph."
                if (targets.isNotEmpty()) found += "Module $module may not have production project dependencies."
                continue
            }
            for (target in targets.sorted()) {
                if (target !in allowedEdges && target !in containers) {
                    found += "$module depends on unknown module $target."
                } else if (target !in allowed) {
                    found += "Forbidden production edge $module -> $target."
                }
            }
        }
        found += cycles(edges)
        return found
    }

    private fun cycles(edges: Map<String, Set<String>>): List<String> {
        val done = mutableSetOf<String>()
        val cycles = mutableListOf<String>()

        fun visit(
            node: String,
            path: List<String>,
        ) {
            if (node in path) {
                cycles += "Dependency cycle: ${(path.dropWhile { it != node } + node).joinToString(" -> ")}."
                return
            }
            if (!done.add(node)) return
            edges[node].orEmpty().sorted().forEach { visit(it, path + node) }
        }
        edges.keys.sorted().forEach { visit(it, emptyList()) }
        return cycles
    }
}
