package scoremap.quality.fixtures.storage.shell.clean

import scoremap.music.MusicModule

/** Allowed: an Activity that only uses the musical model. */
public class CleanActivity {
    public fun title(): String = MusicModule.NAME
}
