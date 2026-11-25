package scoremap.feature.library

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.lazy.LazyListScope
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp
import scoremap.library.Hand
import scoremap.library.PerformedNote

internal fun LazyListScope.partsSection(holder: LibraryHolder) {
    val detail = holder.detail ?: return
    val parts = holder.models.editors.parts
    devicesSection(holder)
    item { Text("Parts", style = MaterialTheme.typography.titleMedium) }
    item {
        NameEntry("Part name", "Add part") { name -> holder.act { mode -> parts.addPart(detail.id, name, mode) } }
    }
    items(detail.parts, key = { "part-${it.id}" }) { part ->
        val removeLabel =
            if (part.voicings.isEmpty() && part.phrases.isEmpty()) "Remove part" else "Remove part and its content"
        NamedRow("Part: ${part.name}") {
            ActionButton(removeLabel, "$removeLabel ${part.name}") {
                holder.act { mode -> parts.removePart(detail.id, part.id, true, mode) }
            }
        }
        detail.chords.forEach { chord ->
            val voicing = part.voicings.firstOrNull { it.eventId == chord.eventId }
            val notes = voicing?.notes?.joinToString(", ") { "${it.label} (${handName(it.hand)})" } ?: "not played"
            NamedRow("${chord.label}: $notes") {
                ActionButton("Edit voicing", "Edit voicing of ${chord.label} in ${part.name}") {
                    val initial = voicing?.notes?.map { PerformedNote(it.midi, it.hand) }.orEmpty()
                    holder.editing = VoicingEdit(detail.id, part.id, part.name, chord, PianoEditorModel(initial))
                }
            }
        }
        phraseRows(holder, detail.id, part)
        partArrangement(holder, detail.id, part)
    }
}

@Composable
private fun phraseRows(
    holder: LibraryHolder,
    songId: String,
    part: PartItem,
) {
    val phrases = holder.models.editors.phrases
    NameEntry("Phrase name for ${part.name}", "Add phrase") { name ->
        holder.act { mode -> phrases.addPhrase(songId, part.id, name, null, mode) }
    }
    part.phrases.forEach { phrase ->
        Text("Phrase ${phrase.name}: " + phrase.lines.joinToString("; ").ifEmpty { "no steps yet" })
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            ActionButton("Edit phrase", "Edit phrase ${phrase.name} of ${part.name}") {
                holder.composing = PhraseEdit(songId, part.id, phrase, PhraseEditorModel(phrase.items))
            }
            ActionButton("Remove phrase", "Remove phrase ${phrase.name} of ${part.name}") {
                holder.act { mode -> phrases.removePhrase(songId, part.id, phrase.id, mode) }
            }
        }
    }
}

internal fun handName(hand: Hand): String = if (hand == Hand.LEFT) "left hand" else "right hand"
