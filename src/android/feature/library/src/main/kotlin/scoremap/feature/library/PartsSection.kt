package scoremap.feature.library

import androidx.compose.foundation.lazy.LazyListScope
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import scoremap.library.Hand
import scoremap.library.PerformedNote

internal fun LazyListScope.partsSection(holder: LibraryHolder) {
    val detail = holder.detail ?: return
    val parts = holder.models.parts
    item { Text("Parts", style = MaterialTheme.typography.titleMedium) }
    item {
        NameEntry("Part name", "Add part") { name -> holder.act { mode -> parts.addPart(detail.id, name, mode) } }
    }
    items(detail.parts, key = { "part-${it.id}" }) { part ->
        val removeLabel = if (part.voicings.isEmpty()) "Remove part" else "Remove part and its voicings"
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
    }
}

internal fun handName(hand: Hand): String = if (hand == Hand.LEFT) "left hand" else "right hand"
