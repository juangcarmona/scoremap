package scoremap.feature.library

import androidx.compose.foundation.lazy.LazyListScope
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable

internal fun LazyListScope.setsSection(holder: LibraryHolder) {
    val state = holder.sets ?: return
    item { Text("Sets", style = MaterialTheme.typography.titleMedium) }
    item {
        NameEntry("Set name", "Create set") { name ->
            holder.act { mode ->
                holder.models.sets
                    .createSet(name, mode)
                    .notice
            }
        }
    }
    items(state.sets, key = { "set-${it.id}" }) { set -> SetCard(holder, set, state.songs) }
    if (state.deleted.isNotEmpty()) item { Text("Recently deleted sets", style = MaterialTheme.typography.titleMedium) }
    items(state.deleted, key = { "deleted-set-${it.id}" }) { set ->
        NamedRow(set.name) {
            ActionButton("Restore set", "Restore set ${set.name}") {
                holder.act { mode ->
                    holder.models.sets
                        .restoreSet(set.id, mode)
                        .notice
                }
            }
        }
    }
}

@Composable
private fun SetCard(
    holder: LibraryHolder,
    set: SetItem,
    songs: List<SongItem>,
) {
    val sets = holder.models.sets
    NamedRow(set.name) {
        ActionButton("Delete set", "Delete set ${set.name}") {
            holder.act { mode ->
                sets.deleteSet(set.id, mode).notice
            }
        }
    }
    set.members.forEachIndexed { index, member ->
        NamedRow("${index + 1}. ${member.name}") {
            ActionButton("Up", "Move up ${member.name} in ${set.name}") {
                holder.act { mode -> sets.moveMember(set.id, member.id, -1, mode).notice }
            }
            ActionButton("Down", "Move down ${member.name} in ${set.name}") {
                holder.act { mode -> sets.moveMember(set.id, member.id, 1, mode).notice }
            }
            ActionButton("Remove", "Remove ${member.name} from ${set.name}") {
                holder.act { mode -> sets.removeMember(set.id, member.id, mode).notice }
            }
        }
    }
    val members = set.members.map { it.id }.toSet()
    songs.filter { it.id !in members }.forEach { song ->
        ActionButton("Add ${song.name}", "Add ${song.name} to ${set.name}") {
            holder.act { mode -> sets.addMember(set.id, song.id, mode).notice }
        }
    }
}
