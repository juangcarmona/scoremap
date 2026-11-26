package scoremap.feature.library

import scoremap.music.KeySignature

/** What is being edited: one part's phrase, with its editor state. */
internal class PhraseEdit(
    val songId: String,
    val partId: String,
    val phrase: PhraseView,
    val model: PhraseEditorModel,
    val key: KeySignature? = null,
)
