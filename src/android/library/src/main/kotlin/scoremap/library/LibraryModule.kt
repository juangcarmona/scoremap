package scoremap.library

import scoremap.music.MusicModule

/** Identifies the pure application module that builds on the musical domain. */
public object LibraryModule {
    public const val NAME: String = "library"
    public const val DOMAIN: String = MusicModule.NAME
}
