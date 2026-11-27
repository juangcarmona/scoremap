package scoremap.quality

import com.tngtech.archunit.lang.ArchRule
import com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses

/** AND-G02: compiled-type rules for the pure musical domain and application modules. */
public object PureLayerRules {
    /** Framework, database, filesystem, UI and codec packages that pure modules must never reach. */
    public val forbiddenPackages: Array<String> =
        arrayOf(
            "android..",
            "androidx..",
            "java.sql..",
            "javax.sql..",
            "java.awt..",
            "javax.swing..",
            "java.beans..",
            "java.nio.file..",
            "kotlinx.serialization..",
            "org.json..",
            "com.google.gson..",
            "com.fasterxml..",
        )

    private const val FILE_TYPES: String =
        "java\\.io\\.(File|FileInputStream|FileOutputStream|FileReader|FileWriter|RandomAccessFile)"

    public fun noForbiddenAccess(vararg packages: String): ArchRule =
        noClasses()
            .that()
            .resideInAnyPackage(*packages)
            .should()
            .dependOnClassesThat()
            .resideInAnyPackage(*forbiddenPackages)
            .orShould()
            .dependOnClassesThat()
            .haveNameMatching(FILE_TYPES)
            .because("pure domain and application code cannot depend on frameworks, storage, UI or codecs")
}
