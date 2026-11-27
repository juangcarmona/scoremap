package scoremap.quality.fixtures.storage.feature

import java.sql.Connection as Database

/** Violation: a storage API reached through an import alias. */
public class RoomAliasFeature(
    public val database: Database?,
)
