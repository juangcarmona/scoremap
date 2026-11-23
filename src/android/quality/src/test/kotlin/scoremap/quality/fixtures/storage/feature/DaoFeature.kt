package scoremap.quality.fixtures.storage.feature

import scoremap.quality.fixtures.storage.data.local.FixtureDao

/** Violation: an aliased-by-use adapter type inside a feature. */
public class DaoFeature(
    public val dao: FixtureDao,
)
