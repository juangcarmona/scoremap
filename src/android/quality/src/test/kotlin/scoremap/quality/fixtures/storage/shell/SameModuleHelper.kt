package scoremap.quality.fixtures.storage.shell

import scoremap.quality.fixtures.storage.data.local.FixtureDao

/** Violation: a same-module helper that wraps an adapter type so an Activity could hide the shortcut. */
public object SameModuleHelper {
    public fun dao(): FixtureDao = FixtureDao(null)
}
