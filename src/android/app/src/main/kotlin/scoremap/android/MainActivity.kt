package scoremap.android

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import scoremap.data.local.AndroidPdfInspector
import scoremap.data.local.FileBlobStore
import scoremap.feature.library.AttachmentsModel
import scoremap.feature.library.EditorModels
import scoremap.feature.library.FormModel
import scoremap.feature.library.LibraryModels
import scoremap.feature.library.LibraryScreen
import scoremap.feature.library.LibraryScreenModel
import scoremap.feature.library.PartsModel
import scoremap.feature.library.PhrasesModel
import scoremap.feature.library.SetsScreenModel
import scoremap.feature.library.SongDetailModel
import scoremap.library.AttachmentService
import scoremap.library.IdSource
import scoremap.library.LibraryService
import java.util.UUID

/** Composition root: it wires the local Room store and the library service into the screen. */
public class MainActivity : ComponentActivity() {
    /** The models behind the screen; instrumented tests use them to act below the system document picker. */
    public lateinit var models: LibraryModels
        private set

    public override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        val databaseName = intent.getStringExtra(EXTRA_DATABASE) ?: DEFAULT_DATABASE
        val opened = ScoreMapStores.open(this, databaseName)
        val random = IdSource { UUID.randomUUID().toString() }
        val service = LibraryService(opened)
        val blobs = FileBlobStore(java.io.File(filesDir, "attachments-$databaseName"))
        val attachments =
            AttachmentService(service, AndroidPdfInspector(java.io.File(cacheDir, "inspect")), blobs, random)
        models =
            LibraryModels(
                LibraryScreenModel(service, random, random),
                SetsScreenModel(service, random, random),
                SongDetailModel(service, random, random),
                AttachmentsModel(attachments, service, random),
                EditorModels(
                    FormModel(service, random, random),
                    PartsModel(service, random, random),
                    PhrasesModel(service, random, random),
                ),
            )
        setContent {
            MaterialTheme {
                Surface { LibraryScreen(models, Modifier.safeDrawingPadding()) }
            }
        }
    }

    public companion object {
        /** Lets instrumented tests use their own database instead of the musician's. */
        public const val EXTRA_DATABASE: String = "scoremap.database"
        private const val DEFAULT_DATABASE = "scoremap-library.db"
    }
}
