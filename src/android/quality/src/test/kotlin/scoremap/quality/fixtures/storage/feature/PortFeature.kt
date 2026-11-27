package scoremap.quality.fixtures.storage.feature

import scoremap.quality.fixtures.storage.library.port.FixturePort

/** Violation: a feature invoking an application port. */
public class PortFeature(
    private val port: FixturePort,
) {
    public fun persist(): Unit = port.save("song")
}
