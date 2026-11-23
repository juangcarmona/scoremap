package scoremap.quality.fixtures.storage.shell

import scoremap.quality.fixtures.storage.data.local.FixtureDao

/** Violation: an Activity-to-DAO shortcut. */
public class DaoShortcutActivity {
    public fun open(): Boolean = FixtureDao(null).isOpen()
}
