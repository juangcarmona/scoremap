package scoremap.exchange

import scoremap.library.Confirmation
import scoremap.library.IdSource
import scoremap.library.ImportCommands
import scoremap.library.Library
import scoremap.library.Mode
import scoremap.library.Outcome
import scoremap.library.Refusal

public sealed interface PreviewOutcome {
    public data class Ready(
        val songNames: List<String>,
        val sectionCount: Int,
        val setName: String?,
    ) : PreviewOutcome

    public data class Rejected(
        val reason: Rejection,
    ) : PreviewOutcome
}

public sealed interface TransferOutcome {
    public data class Imported(
        val library: Library,
    ) : TransferOutcome

    public data class Rejected(
        val reason: Rejection,
    ) : TransferOutcome

    public data class Refused(
        val refusal: Refusal,
    ) : TransferOutcome
}

/** Preview, confirm or cancel, then import; nothing changes until a confirmed import is accepted whole. */
public object TransferFlow {
    public fun preview(
        text: String,
        limits: TransferLimits = TransferLimits(),
    ): PreviewOutcome =
        when (val decoded = TransferCodec.decode(text, limits)) {
            is DecodeOutcome.Rejected -> {
                PreviewOutcome.Rejected(decoded.reason)
            }

            is DecodeOutcome.Decoded -> {
                PreviewOutcome.Ready(
                    decoded.graph.songs.map { it.name },
                    decoded.graph.songs.sumOf { it.sections.size },
                    decoded.graph.set?.name,
                )
            }
        }

    public fun importConfirmed(
        library: Library,
        mode: Mode,
        text: String,
        confirmation: Confirmation,
        ids: IdSource,
    ): TransferOutcome =
        when {
            mode != Mode.EDIT -> TransferOutcome.Refused(Refusal.PERFORMANCE_MODE)
            else -> decodeAndImport(library, text, confirmation, ids)
        }

    private fun decodeAndImport(
        library: Library,
        text: String,
        confirmation: Confirmation,
        ids: IdSource,
    ): TransferOutcome =
        when (val decoded = TransferCodec.decode(text)) {
            is DecodeOutcome.Rejected -> {
                TransferOutcome.Rejected(decoded.reason)
            }

            is DecodeOutcome.Decoded -> {
                if (confirmation == Confirmation.Cancelled) {
                    TransferOutcome.Refused(Refusal.CANCELLED)
                } else {
                    when (val outcome = ImportCommands.importGraph(library, Mode.EDIT, decoded.graph, ids)) {
                        is Outcome.Accepted -> TransferOutcome.Imported(outcome.value)
                        is Outcome.Refused -> TransferOutcome.Refused(outcome.refusal)
                    }
                }
            }
        }
}
