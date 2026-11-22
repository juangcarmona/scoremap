package scoremap.quality.fixtures.storage.data.local

import java.sql.Connection

/** Stands in for a Room DAO owned by the local adapter. */
public class FixtureDao(
    private val connection: Connection?,
) {
    public fun isOpen(): Boolean = connection != null
}
