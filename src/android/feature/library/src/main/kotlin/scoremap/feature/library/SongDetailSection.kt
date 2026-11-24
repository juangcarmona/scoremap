package scoremap.feature.library

import androidx.compose.foundation.lazy.LazyListScope
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text

internal fun LazyListScope.songDetailSection(holder: LibraryHolder) {
    val detail = holder.detail ?: return
    val models = holder.models.detail
    item { Text("Editing: ${detail.name}", style = MaterialTheme.typography.titleMedium) }
    item {
        NameEntry("New name", "Rename") { name -> holder.act { mode -> models.rename(detail.id, name, mode)?.notice } }
    }
    item {
        NameEntry("Section name", "Add section") { name ->
            holder.act { mode -> models.addSection(detail.id, name, mode)?.notice }
        }
    }
    items(
        detail.sections,
        key = { "section-${it.id}" },
    ) { section -> Text("Section: ${section.name} x${section.repeats}") }
    // The PDFs come before the long history so they stay within reach on a small screen.
    attachmentsSection(holder)
    item { Text("History", style = MaterialTheme.typography.titleMedium) }
    items(detail.revisions.reversed(), key = { "revision-${it.number}" }) { revision ->
        NamedRow("Revision ${revision.number}: ${revision.name}, ${revision.sectionCount} sections") {
            ActionButton("Restore revision", "Restore revision ${revision.number}") {
                holder.act { mode -> models.restoreRevision(detail.id, revision.number, mode)?.notice }
            }
        }
    }
    item {
        ActionButton("Close", "Close editor") {
            holder.openSongId = null
            holder.act { null }
        }
    }
}
