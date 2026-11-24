package scoremap.android

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import scoremap.data.local.RoomLibraryStore
import scoremap.feature.library.LibraryScreen
import scoremap.feature.library.LibraryScreenModel
import scoremap.library.IdSource
import scoremap.library.LibraryService
import java.util.UUID

/** Composition root: it wires the local Room store and the library service into the screen. */
public class MainActivity : ComponentActivity() {
    private var store: RoomLibraryStore? = null

    public override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        val opened =
            RoomLibraryStore.open(
                applicationContext,
                intent.getStringExtra(EXTRA_DATABASE) ?: DEFAULT_DATABASE,
            )
        store = opened
        val random = IdSource { UUID.randomUUID().toString() }
        val model = LibraryScreenModel(LibraryService(opened), random, random)
        setContent {
            MaterialTheme {
                Surface { LibraryScreen(model, Modifier.safeDrawingPadding()) }
            }
        }
    }

    public override fun onDestroy() {
        store?.close()
        super.onDestroy()
    }

    public companion object {
        /** Lets instrumented tests use their own database instead of the musician's. */
        public const val EXTRA_DATABASE: String = "scoremap.database"
        private const val DEFAULT_DATABASE = "scoremap-library.db"
    }
}
