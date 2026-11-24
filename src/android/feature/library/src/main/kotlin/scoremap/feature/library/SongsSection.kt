package scoremap.feature.library

import androidx.compose.foundation.lazy.LazyListScope
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.getValue

internal fun LazyListScope.songsSection(holder: LibraryHolder) {
    val state = holder.songs
    item {
        NameEntry("Song name", "Create song") { name ->
            holder.act { mode ->
                holder.models.songs
                    .createSong(name, mode)
                    .notice
            }
        }
    }
    if (state != null && state.songs.isEmpty()) item { Text("No songs yet. Create the first one above.") }
    items(state?.songs.orEmpty(), key = { it.id }) { song ->
        NamedRow(song.name) {
            ActionButton("Open", "Open ${song.name}") {
                holder.openSongId = song.id
                holder.act { null }
            }
            ActionButton("Delete", "Delete ${song.name}") {
                holder.act { mode ->
                    holder.models.songs
                        .deleteSong(song.id, mode)
                        .notice
                }
            }
        }
    }
    val deleted = state?.deleted.orEmpty()
    if (deleted.isNotEmpty()) item { Text("Recently deleted", style = MaterialTheme.typography.titleMedium) }
    items(deleted, key = { "deleted-${it.id}" }) { song ->
        NamedRow(song.name) {
            ActionButton("Restore", "Restore ${song.name}") {
                holder.act { mode ->
                    holder.models.songs
                        .restoreSong(song.id, mode)
                        .notice
                }
            }
        }
    }
}
