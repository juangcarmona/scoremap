package scoremap.quality.fixtures.storage.feature.clean

import scoremap.music.MusicModule

/** Allowed: consumes only the musical model. */
public class CleanFeature {
    public fun title(): String = MusicModule.NAME
}
