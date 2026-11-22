package scoremap.android

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable

public class MainActivity : ComponentActivity() {
    public override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent { ScoreMapShell() }
    }
}

@Composable
private fun ScoreMapShell() {
    MaterialTheme {
        Surface {
            Text("ScoreMap Android build shell")
        }
    }
}
