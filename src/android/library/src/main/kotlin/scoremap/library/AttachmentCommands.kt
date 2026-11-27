package scoremap.library

/**
 * PDF attachments owned by a song. Attaching and detaching are content edits guarded by the edit mode;
 * remembering the page last viewed is navigation, so it is allowed in every mode and creates no revision.
 */
public object AttachmentCommands {
    public fun attach(
        library: Library,
        mode: Mode,
        songId: SongId,
        pdf: PdfAttachment,
        ids: IdSource,
    ): Outcome<Library> =
        guarded(mode) {
            val (rawName, facts) = pdf
            val song = library.songs.firstOrNull { it.id == songId } ?: return@guarded refused(Refusal.UNKNOWN_SONG)
            val name = rawName.trim().takeIf { it.isNotEmpty() } ?: return@guarded refused(Refusal.INVALID_NAME)
            val id = ids.next()
            when {
                facts.bytes > PdfLimits.MAX_BYTES -> {
                    refused(Refusal.PDF_TOO_LARGE)
                }

                facts.bytes <= 0 || facts.pages !in 1..PdfLimits.MAX_PAGES -> {
                    refused(Refusal.PDF_UNSUPPORTED)
                }

                id in library.purged -> {
                    refused(Refusal.PURGED)
                }

                library.identityInUse(id) -> {
                    refused(Refusal.DUPLICATE_ID)
                }

                else -> {
                    val attachment = Attachment(AttachmentId(id), name, facts.sha256, facts.bytes, facts.pages, 1)
                    accepted(library.revise(song.copy(attachments = song.attachments + attachment)))
                }
            }
        }

    public fun detach(
        library: Library,
        mode: Mode,
        songId: SongId,
        attachmentId: AttachmentId,
    ): Outcome<Library> =
        guarded(mode) {
            val song = library.songs.firstOrNull { it.id == songId } ?: return@guarded refused(Refusal.UNKNOWN_SONG)
            if (song.attachments.none { it.id == attachmentId }) return@guarded refused(Refusal.UNKNOWN_ATTACHMENT)
            accepted(library.revise(song.copy(attachments = song.attachments.filterNot { it.id == attachmentId })))
        }

    public fun rememberPage(
        library: Library,
        songId: SongId,
        attachmentId: AttachmentId,
        page: Int,
    ): Outcome<Library> {
        val song = library.songs.firstOrNull { it.id == songId }
        val attachment = song?.attachments?.firstOrNull { it.id == attachmentId }
        return when {
            song == null -> {
                refused(Refusal.UNKNOWN_SONG)
            }

            attachment == null -> {
                refused(Refusal.UNKNOWN_ATTACHMENT)
            }

            page !in 1..attachment.pages -> {
                refused(Refusal.INVALID_PAGE)
            }

            else -> {
                val turned = song.attachments.map { if (it.id == attachmentId) it.copy(lastPage = page) else it }
                accepted(
                    library.copy(
                        songs =
                            library.songs.map {
                                if (it.id ==
                                    songId
                                ) {
                                    song.copy(attachments = turned)
                                } else {
                                    it
                                }
                            },
                    ),
                )
            }
        }
    }

    /** Every digest an active or recoverably deleted song still needs; any other stored blob is garbage. */
    public fun referencedDigests(library: Library): Set<String> =
        (library.songs + library.deletedSongs).flatMap { song -> song.attachments.map { it.sha256 } }.toSet()
}
