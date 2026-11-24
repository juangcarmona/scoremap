package scoremap.exchange

import scoremap.library.BlobStore
import scoremap.library.GraphAttachment
import scoremap.library.Library
import scoremap.library.MusicSet
import scoremap.library.PdfBytes
import scoremap.library.SetId
import scoremap.library.SongId
import scoremap.library.TransferGraph

public sealed interface ExportOutcome {
    public data class Exported(
        val text: String,
    ) : ExportOutcome

    /** An attached PDF's bytes are not available, so the package would be incomplete and is not produced. */
    public data class MissingBytes(
        val attachment: String,
    ) : ExportOutcome

    public data object UnknownItem : ExportOutcome
}

/** Builds a complete package, PDF bytes included, from what the library and its blob store hold. */
public object TransferExporter {
    public fun exportSong(
        library: Library,
        songId: SongId,
        blobs: BlobStore,
    ): ExportOutcome {
        val song = library.songs.firstOrNull { it.id == songId }
        return if (song == null) ExportOutcome.UnknownItem else export(library, TransferGraph.ofSong(song), blobs)
    }

    public fun exportSet(
        library: Library,
        setId: SetId,
        blobs: BlobStore,
    ): ExportOutcome {
        val set: MusicSet? = library.sets.firstOrNull { it.id == setId }
        return if (set == null) ExportOutcome.UnknownItem else export(library, TransferGraph.ofSet(library, set), blobs)
    }

    private fun export(
        library: Library,
        graph: TransferGraph,
        blobs: BlobStore,
    ): ExportOutcome {
        val attachmentsByKey =
            graph.songs.associate { song ->
                song.key to library.songs.first { it.id.value == song.key }.attachments
            }
        val missing = attachmentsByKey.values.flatten().firstOrNull { blobs.read(it.sha256) == null }
        return if (missing != null) {
            ExportOutcome.MissingBytes(missing.name)
        } else {
            val songs =
                graph.songs.map { song ->
                    song.copy(
                        attachments =
                            attachmentsByKey.getValue(song.key).map {
                                GraphAttachment(it.name, PdfBytes(blobs.read(it.sha256) ?: ByteArray(0)))
                            },
                    )
                }
            ExportOutcome.Exported(TransferCodec.encode(graph.copy(songs = songs)))
        }
    }
}
