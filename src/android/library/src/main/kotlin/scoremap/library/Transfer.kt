package scoremap.library

/** A section as carried by a transfer package; identities are never imported. */
public data class GraphSection(
    val name: String,
    val repeats: Int,
)

/** A song as carried by a transfer package. [key] only links set members inside the package. */
public data class GraphSong(
    val key: String,
    val name: String,
    val sections: List<GraphSection>,
)

public data class GraphSet(
    val name: String,
    val songKeys: List<String>,
)

/** The complete, identity-free content of one song or one ordered set with all of its songs. */
public data class TransferGraph(
    val songs: List<GraphSong>,
    val set: GraphSet?,
) {
    public companion object {
        public fun ofSong(song: Song): TransferGraph = TransferGraph(listOf(graphSong(song)), null)

        public fun ofSet(
            library: Library,
            set: MusicSet,
        ): TransferGraph {
            val byId = library.songs.associateBy { it.id }
            return TransferGraph(
                set.songIds.map { graphSong(byId.getValue(it)) },
                GraphSet(set.name, set.songIds.map { it.value }),
            )
        }

        private fun graphSong(song: Song): GraphSong =
            GraphSong(song.id.value, song.name, song.sections.map { GraphSection(it.name, it.repeats) })
    }
}
