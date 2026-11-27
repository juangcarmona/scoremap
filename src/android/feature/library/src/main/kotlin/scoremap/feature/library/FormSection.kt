package scoremap.feature.library

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

/** The measures of one section: the chords in time order, each with its lyric link, and the entries to edit them. */
@Composable
internal fun formSheet(
    holder: LibraryHolder,
    songId: String,
    section: SectionItem,
) {
    val form = holder.models.editors.form
    Column(Modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(4.dp)) {
        section.measures.forEachIndexed { index, measure ->
            val where = "measure ${index + 1} of ${section.name}"
            val chords = measure.events.joinToString(", ") { "${it.symbol} at ${it.start}" }.ifEmpty { "empty" }
            Text("Measure ${index + 1} (${measure.meter}): $chords")
            NameEntry("Chord for $where", "Add chord") { text ->
                holder.act { mode -> form.addChord(songId, section.id, measure.id, text, mode) }
            }
            DestructiveButton("Remove measure", "Remove $where") {
                holder.act { mode -> form.removeMeasure(songId, section.id, measure.id, mode) }
            }
            if (measure.events.any { it.voiced }) {
                DestructiveButton("Remove measure and voicings", "Remove $where and its voicings") {
                    holder.act { mode -> form.removeMeasure(songId, section.id, measure.id, mode, reconcile = true) }
                }
            }
            measure.events.forEach { event ->
                val label = "${event.symbol} in $where"
                NamedRow("${event.symbol}: ${event.duration} beats, lyric ${event.lyricIndex ?: "not linked"}") {
                    DestructiveButton("Remove chord", "Remove chord $label") {
                        holder.act { mode -> form.removeChord(songId, section.id, event.id, mode) }
                    }
                    if (event.voiced) {
                        DestructiveButton("Remove chord and voicings", "Remove chord $label and its voicings") {
                            holder.act { mode ->
                                form.removeChord(songId, section.id, event.id, mode, reconcile = true)
                            }
                        }
                    }
                }
                SheetEntry(
                    "Lyric position of $label",
                    event.lyricIndex?.toString().orEmpty(),
                    "Save link",
                    false,
                ) { text ->
                    holder.act { mode -> form.linkLyric(songId, section.id, event.id, text, mode) }
                }
            }
        }
        NameEntry("Meter for a new measure of ${section.name}", "Add measure") { text ->
            holder.act { mode -> form.addMeasure(songId, section.id, text, mode) }
        }
    }
}
