pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

val sharedCatalog = file("../gradle/libs.versions.toml")
check(
    sharedCatalog.isFile &&
        !java.nio.file.Files
            .isSymbolicLink(sharedCatalog.toPath()),
) {
    "The convention catalog must remain a regular local TOML file."
}
val catalogLock = file("settings-gradle.lockfile")
if (java.nio.file.Files
        .exists(catalogLock.toPath(), java.nio.file.LinkOption.NOFOLLOW_LINKS)
) {
    check(
        catalogLock.isFile &&
            !java.nio.file.Files
                .isSymbolicLink(catalogLock.toPath()),
    ) {
        "The generated local catalog record must be a regular file."
    }
    check(
        catalogLock.readLines().map { it.trim() }.filter { it.isNotEmpty() && !it.startsWith("#") } ==
            listOf("empty=incomingCatalogForLibs0"),
    ) {
        "The ignored local catalog record cannot contain module dependencies or additional state."
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
    versionCatalogs {
        create("libs") {
            from(files(sharedCatalog))
        }
    }
}

check(dependencyResolutionManagement.versionCatalogs.names == setOf("libs")) {
    "The convention build must use only the shared local libs catalog."
}

rootProject.name = "build-logic"
