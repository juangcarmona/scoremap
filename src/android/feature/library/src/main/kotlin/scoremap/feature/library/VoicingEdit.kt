package scoremap.feature.library

import scoremap.music.KeySignature

/** What is being edited: one part's voicing for one chord, with the keyboard state. */
internal class VoicingEdit(
    val songId: String,
    val partId: String,
    val partName: String,
    val chord: ChordChoice,
    val piano: PianoEditorModel,
    val key: KeySignature? = null,
)
