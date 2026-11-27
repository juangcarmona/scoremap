package scoremap.feature.library

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp

private const val ACTION_LIGHT = 0xFF1F6FD1
private const val SLATE_LIGHT = 0xFFDCE1EB
private const val NIGHT = 0xFF0D0F17
private const val SLATE = 0xFF26344B
private const val ICE = 0xFFF8FAFF
private const val CONTROL_OUTLINE = 0xFF647188
private const val NEGATIVE_LIGHT = 0xFF9A3434
private const val NEGATIVE_SURFACE_LIGHT = 0xFFFCE8E5
private const val ACTION_DARK = 0xFF4DA3FF
private const val TEXT_MUTED_DARK = 0xFFAAB6C9
private const val NAVY = 0xFF111B2B
private const val NEGATIVE_DARK = 0xFFFFB6AB
private const val NEGATIVE_SURFACE_DARK = 0xFF492825
private const val CAUTION_SURFACE_DARK = 0xFF473612
private const val CAUTION_DARK = 0xFFF8CF79
private const val CAUTION_SURFACE_LIGHT = 0xFFFFF2D7
private const val CAUTION_LIGHT = 0xFF765211
private const val POSITIVE_SURFACE_DARK = 0xFF173E2B
private const val POSITIVE_DARK = 0xFF96E4AD
private const val POSITIVE_SURFACE_LIGHT = 0xFFE3F3E9
private const val POSITIVE_LIGHT = 0xFF195C40

// Lighthouse UI 0.2.1 semantic palette. Keep raw theme values confined to this adapter.
private val LightColors =
    lightColorScheme(
        primary = Color(ACTION_LIGHT),
        onPrimary = Color.White,
        primaryContainer = Color(SLATE_LIGHT),
        onPrimaryContainer = Color(NIGHT),
        secondary = Color(SLATE),
        onSecondary = Color.White,
        secondaryContainer = Color(SLATE_LIGHT),
        onSecondaryContainer = Color(NIGHT),
        background = Color(ICE),
        onBackground = Color(NIGHT),
        surface = Color.White,
        onSurface = Color(NIGHT),
        surfaceVariant = Color(SLATE_LIGHT),
        onSurfaceVariant = Color(SLATE),
        surfaceContainer = Color(ICE),
        surfaceContainerHigh = Color(SLATE_LIGHT),
        surfaceContainerLow = Color.White,
        surfaceContainerLowest = Color.White,
        outline = Color(CONTROL_OUTLINE),
        outlineVariant = Color(SLATE_LIGHT),
        error = Color(NEGATIVE_LIGHT),
        onError = Color.White,
        errorContainer = Color(NEGATIVE_SURFACE_LIGHT),
        onErrorContainer = Color(NEGATIVE_LIGHT),
        surfaceTint = Color.Transparent,
        tertiary = Color(ACTION_LIGHT),
        onTertiary = Color.White,
        tertiaryContainer = Color(SLATE_LIGHT),
        onTertiaryContainer = Color(NIGHT),
        inverseSurface = Color(NIGHT),
        inverseOnSurface = Color(ICE),
        inversePrimary = Color(ACTION_DARK),
        surfaceBright = Color.White,
        surfaceDim = Color(SLATE_LIGHT),
        surfaceContainerHighest = Color(SLATE_LIGHT),
        scrim = Color.Black,
    )
private val DarkColors =
    darkColorScheme(
        primary = Color(ACTION_DARK),
        onPrimary = Color(NIGHT),
        primaryContainer = Color(SLATE),
        onPrimaryContainer = Color(ICE),
        secondary = Color(TEXT_MUTED_DARK),
        onSecondary = Color(NIGHT),
        secondaryContainer = Color(SLATE),
        onSecondaryContainer = Color(ICE),
        background = Color(NIGHT),
        onBackground = Color(ICE),
        surface = Color(NAVY),
        onSurface = Color(ICE),
        surfaceVariant = Color(SLATE),
        onSurfaceVariant = Color(TEXT_MUTED_DARK),
        surfaceContainer = Color(NAVY),
        surfaceContainerHigh = Color(SLATE),
        surfaceContainerLow = Color(NAVY),
        surfaceContainerLowest = Color(NIGHT),
        outline = Color(TEXT_MUTED_DARK),
        outlineVariant = Color(SLATE),
        error = Color(NEGATIVE_DARK),
        onError = Color(NIGHT),
        errorContainer = Color(NEGATIVE_SURFACE_DARK),
        onErrorContainer = Color(NEGATIVE_DARK),
        surfaceTint = Color.Transparent,
        tertiary = Color(ACTION_DARK),
        onTertiary = Color(NIGHT),
        tertiaryContainer = Color(SLATE),
        onTertiaryContainer = Color(ICE),
        inverseSurface = Color(ICE),
        inverseOnSurface = Color(NIGHT),
        inversePrimary = Color(ACTION_LIGHT),
        surfaceBright = Color(SLATE),
        surfaceDim = Color(NIGHT),
        surfaceContainerHighest = Color(SLATE),
        scrim = Color.Black,
    )

/** The native projection of Lighthouse roles; system appearance never replaces the ScoreMap palette. */
@Composable
public fun ScoreMapTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = if (isSystemInDarkTheme()) DarkColors else LightColors,
        typography = Typography(),
        shapes =
            Shapes(
                extraSmall = RoundedCornerShape(4.dp),
                small = RoundedCornerShape(6.dp),
                medium = RoundedCornerShape(10.dp),
                large = RoundedCornerShape(10.dp),
                extraLarge = RoundedCornerShape(10.dp),
            ),
        content = content,
    )
}

/** Semantic status pairs from Lighthouse; messages carry the result independently of color. */
@Composable
internal fun feedbackColors(notice: Notice): Pair<Color, Color> {
    val failed =
        notice in
            setOf(
                Notice.INVALID_NAME,
                Notice.CONFLICT,
                Notice.STORAGE_FAILED,
                Notice.FAILED,
                Notice.MISSING_DEPENDENCY,
                Notice.INVALID_RANGE,
                Notice.OUT_OF_DEVICE,
                Notice.EXCLUDES_NOTES,
                Notice.INVALID_DURATION,
                Notice.IN_USE,
                Notice.PDF_UNREADABLE,
                Notice.PDF_TOO_LARGE,
                Notice.INVALID_KEY,
                Notice.TEXT_TOO_LONG,
                Notice.INVALID_METER,
                Notice.INVALID_CHORD,
                Notice.NO_ROOM,
                Notice.INVALID_LINK,
                Notice.LINKED_LYRICS,
            )
    val dark = isSystemInDarkTheme()
    return when {
        failed -> {
            MaterialTheme.colorScheme.errorContainer to MaterialTheme.colorScheme.onErrorContainer
        }

        notice == Notice.EDIT_MODE_REQUIRED -> {
            if (dark) {
                Color(CAUTION_SURFACE_DARK) to Color(CAUTION_DARK)
            } else {
                Color(CAUTION_SURFACE_LIGHT) to Color(CAUTION_LIGHT)
            }
        }

        dark -> {
            Color(POSITIVE_SURFACE_DARK) to Color(POSITIVE_DARK)
        }

        else -> {
            Color(POSITIVE_SURFACE_LIGHT) to Color(POSITIVE_LIGHT)
        }
    }
}
