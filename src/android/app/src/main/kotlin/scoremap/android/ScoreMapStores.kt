package scoremap.android

import android.content.Context
import scoremap.data.local.RoomLibraryStore

/**
 * One open store per database for the life of the process. Screens come and go with configuration changes, but a
 * query still running when one is destroyed must never find its database closed.
 */
public object ScoreMapStores {
    private val open = mutableMapOf<String, RoomLibraryStore>()

    @Synchronized
    public fun open(
        context: Context,
        name: String,
    ): RoomLibraryStore = open.getOrPut(name) { RoomLibraryStore.open(context.applicationContext, name) }

    /** Closes one database so the next open reads it from disk again; used to model a restart in tests. */
    @Synchronized
    public fun close(name: String) {
        open.remove(name)?.close()
    }
}
