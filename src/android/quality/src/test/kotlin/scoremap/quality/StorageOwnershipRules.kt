package scoremap.quality

import com.tngtech.archunit.lang.ArchRule
import com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses

/**
 * AND-G03: only local adapters touch storage. Features and Activity classes never reach adapters,
 * application ports or storage APIs, even inside the composition module.
 *
 * Namespaces follow section 05: `scoremap.data.local..` and `scoremap.exchange..` are adapters,
 * `scoremap.library.port..` holds the ports and `scoremap.feature..` the feature slices.
 */
public object StorageOwnershipRules {
    /** The package layout the rules are evaluated against; tests substitute a fixture layout. */
    public class Layout(
        public val adapters: Array<String>,
        public val ports: String,
    )

    public val product: Layout = Layout(arrayOf("scoremap.data..", "scoremap.exchange.."), "scoremap.library.port..")
    public val storageApis: Array<String> =
        arrayOf("androidx.room..", "androidx.sqlite..", "android.database..", "java.sql..", "java.nio.file..")

    private const val FILE_TYPES: String =
        "java\\.io\\.(File|FileInputStream|FileOutputStream|FileReader|FileWriter|RandomAccessFile)"

    /** Features reach neither adapters, ports nor storage APIs. */
    public fun featuresStayAboveStorage(
        layout: Layout,
        vararg featurePackages: String,
    ): ArchRule =
        noClasses()
            .that()
            .resideInAnyPackage(*featurePackages)
            .should()
            .dependOnClassesThat()
            .resideInAnyPackage(*layout.adapters, layout.ports, *storageApis)
            .orShould()
            .dependOnClassesThat()
            .haveNameMatching(FILE_TYPES)
            .because("features consume the application API and model only, never storage or ports")

    /** Activity classes may use ports for composition wiring only through the composition root, never directly. */
    public fun activitiesAvoidStorageShortcuts(
        layout: Layout,
        vararg shellPackages: String,
    ): ArchRule =
        noClasses()
            .that()
            .resideInAnyPackage(*shellPackages)
            .and()
            .haveSimpleNameEndingWith("Activity")
            .should()
            .dependOnClassesThat()
            .resideInAnyPackage(*layout.adapters, layout.ports, *storageApis)
            .orShould()
            .dependOnClassesThat()
            .haveNameMatching(FILE_TYPES)
            .because("screen and Activity behavior cannot call storage ports or reach adapters")

    /** Everything outside the adapters and the composition root is barred from storage APIs. */
    public fun onlyAdaptersUseStorage(
        allowed: Array<String>,
        vararg inspected: String,
    ): ArchRule =
        noClasses()
            .that()
            .resideInAnyPackage(*inspected)
            .and()
            .resideOutsideOfPackages(*allowed)
            .should()
            .dependOnClassesThat()
            .resideInAnyPackage(*storageApis)
            .orShould()
            .dependOnClassesThat()
            .haveNameMatching(FILE_TYPES)
            .because("only local adapters own Room, SQLite and filesystem access")
}
