package scoremap.feature.library

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import scoremap.library.Mode

/** The models one screen uses. */
public class LibraryModels(
    public val songs: LibraryScreenModel,
    public val sets: SetsScreenModel,
    public val detail: SongDetailModel,
    public val attachments: AttachmentsModel,
    public val editors: EditorModels,
)

/** The models of the musical editors: form, performed parts and prepared phrases. */
public class EditorModels(
    public val form: FormModel,
    public val parts: PartsModel,
    public val phrases: PhrasesModel,
    public val arrangement: ArrangementModel,
    public val sheet: SheetModel,
)

/**
 * Screen-level state. Every action runs off the main thread through the models and is followed by a reload of
 * everything shown, so the screen only ever displays what the store acknowledged.
 */
internal class LibraryHolder(
    val models: LibraryModels,
    private val scope: CoroutineScope,
) {
    var workspaceTab by mutableStateOf("Music")
    var editMode by mutableStateOf(true)
    var songs by mutableStateOf<LibraryScreenState?>(null)
    var sets by mutableStateOf<SetsScreenState?>(null)
    var detail by mutableStateOf<SongDetailState?>(null)
    var openSongId by mutableStateOf<String?>(null)
    var viewing by mutableStateOf<AttachmentItem?>(null)
    var sheetSongId by mutableStateOf<String?>(null)
    internal var editing by mutableStateOf<VoicingEdit?>(null)
    internal var composing by mutableStateOf<PhraseEdit?>(null)
    var busy by mutableStateOf(false)
    var notice by mutableStateOf<Notice?>(null)

    val mode: Mode get() = if (editMode) Mode.EDIT else Mode.PERFORMANCE

    private val order = Mutex()

    /**
     * Runs [action] with the current mode, then reloads the screen; the action returns what to tell the musician.
     * Actions run one at a time in the order they were requested, so a slow earlier reload can never overwrite
     * the result of a later action.
     */
    fun act(action: (Mode) -> Notice?) {
        val current = mode
        scope.launch {
            order.withLock {
                busy = true
                notice = null
                try {
                    val open = openSongId
                    val loaded =
                        withContext(Dispatchers.IO) {
                            val result = action(current)
                            Loaded(
                                result,
                                models.songs.load(current),
                                models.sets.load(),
                                open?.let { models.detail.load(it) },
                            )
                        }
                    notice = loaded.notice
                    songs = loaded.songs
                    sets = loaded.sets
                    detail = loaded.detail
                    if (loaded.detail == null) openSongId = null
                } finally {
                    busy = false
                }
            }
        }
    }

    private class Loaded(
        val notice: Notice?,
        val songs: LibraryScreenState,
        val sets: SetsScreenState,
        val detail: SongDetailState?,
    )
}
