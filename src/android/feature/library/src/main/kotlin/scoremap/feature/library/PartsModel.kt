package scoremap.feature.library

import scoremap.library.EventId
import scoremap.library.IdSource
import scoremap.library.Library
import scoremap.library.LibraryService
import scoremap.library.Mode
import scoremap.library.Outcome
import scoremap.library.PartCommands
import scoremap.library.PartId
import scoremap.library.PartRef
import scoremap.library.PerformedNote
import scoremap.library.SongId

/** Performed parts of one song and the exact voicing each plays for a chord. Each action answers a notice. */
public class PartsModel(
    private val service: LibraryService,
    private val ids: IdSource,
    private val commandIds: IdSource,
) {
    public fun addPart(
        songId: String,
        name: String,
        mode: Mode,
    ): Notice = result(Notice.PART_ADDED) { PartCommands.addPart(it, mode, SongId(songId), name, ids) }

    public fun renamePart(
        songId: String,
        partId: String,
        name: String,
        mode: Mode,
    ): Notice = result(Notice.SHEET_SAVED) { PartCommands.renamePart(it, mode, ref(songId, partId), name) }

    /** [confirmed] is the musician's answer to "remove its voicings too". */
    public fun removePart(
        songId: String,
        partId: String,
        confirmed: Boolean,
        mode: Mode,
    ): Notice = result(Notice.SHEET_SAVED) { PartCommands.removePart(it, mode, ref(songId, partId), confirmed) }

    public fun saveVoicing(
        songId: String,
        partId: String,
        eventId: String,
        notes: List<PerformedNote>,
        mode: Mode,
    ): Notice =
        result(Notice.VOICING_SAVED) {
            PartCommands.setVoicing(it, mode, ref(songId, partId), EventId(eventId), notes)
        }

    private fun ref(
        songId: String,
        partId: String,
    ) = PartRef(SongId(songId), PartId(partId))

    private fun result(
        success: Notice,
        command: (Library) -> Outcome<Library>,
    ): Notice = resultNotice(service.execute(commandIds.next(), command), success)
}
