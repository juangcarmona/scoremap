package scoremap.quality.fixtures.violations

public class StorageCall {
    public fun exists(path: String): Boolean =
        java.nio.file.Files
            .exists(
                java.nio.file.Path
                    .of(path),
            )
}
