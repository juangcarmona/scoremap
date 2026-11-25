package scoremap.feature.library

import scoremap.library.IdSource
import scoremap.library.Library
import scoremap.library.LibraryService
import scoremap.library.Mode
import scoremap.library.Outcome
import scoremap.library.PartId
import scoremap.library.PartRef
import scoremap.library.PhraseCommands
import scoremap.library.PhraseId
import scoremap.library.PhraseItem
import scoremap.library.PhraseRef
import scoremap.library.PhraseTarget
import scoremap.library.SectionId
import scoremap.library.SongId

/** Prepared phrases of a part. Each action answers what the musician is told. */
public class PhrasesModel(
    private val service: LibraryService,
    private val ids: IdSource,
    private val commandIds: IdSource,
) {
    public fun addPhrase(
        songId: String,
        partId: String,
        name: String,
        sectionId: String?,
        mode: Mode,
    ): Notice =
        result(Notice.PHRASE_ADDED) {
            val target = PhraseTarget(part(songId, partId), name, sectionId?.let(::SectionId))
            PhraseCommands.addPhrase(it, mode, target, ids)
        }

    public fun removePhrase(
        songId: String,
        partId: String,
        phraseId: String,
        mode: Mode,
    ): Notice = result(Notice.SHEET_SAVED) { PhraseCommands.removePhrase(it, mode, ref(songId, partId, phraseId)) }

    public fun saveItems(
        songId: String,
        partId: String,
        phraseId: String,
        items: List<PhraseItem>,
        mode: Mode,
    ): Notice = result(Notice.PHRASE_SAVED) { PhraseCommands.setItems(it, mode, ref(songId, partId, phraseId), items) }

    private fun part(
        songId: String,
        partId: String,
    ) = PartRef(SongId(songId), PartId(partId))

    private fun ref(
        songId: String,
        partId: String,
        phraseId: String,
    ) = PhraseRef(part(songId, partId), PhraseId(phraseId))

    private fun result(
        success: Notice,
        command: (Library) -> Outcome<Library>,
    ): Notice = resultNotice(service.execute(commandIds.next(), command), success)
}
