<!-- pdac-scope: cited -->
<!-- pdac:cite id="BR-SESSION" digest="sha256:a8c63526b6fe52375791a737ed14280609d00938808928153d49fd2627416326" -->
<!-- pdac:cite id="BR-DURABILITY" digest="sha256:6b075527861da086b9571e8d117c7844348a437e363423bca46f60cc83b02e0b" -->

## ADDED Requirements

### Requirement: Separate guarded production composition
A separate Aspire entrypoint MUST publish the built private application image and persistent PostgreSQL/key volumes as parameterized Compose artifacts. It MUST exclude Development identity, seed users and dashboards, keep database ingress private and bind application ingress to loopback for operator TLS. Direct execution MUST refuse before starting resources.

#### Scenario: Publication and direct-run refusal
- **GIVEN** the pinned toolchain and validated production publication model
- **WHEN** publication runs and the publisher is separately invoked without publication mode
- **THEN** it generates only protected application/database services and the direct invocation refuses without deploying containers.

### Requirement: Immutable generic publication evidence
Publication MUST use a committed source archive and locked dependencies, preserve existing destination artifacts and retain revision/tool/file-digest evidence. Verification MUST detect drift of the portable Compose snapshot and render it with synthetic file selectors. No operator secret, identity configuration or music MUST enter generated public artifacts. Publication MUST NOT imply image selection, independent review, runtime qualification or actual deployment.

#### Scenario: Existing publication destination
- **GIVEN** an existing operator publication directory
- **WHEN** another immutable publication targets that nonempty directory
- **THEN** it refuses without replacing existing files; a separate empty destination can receive generic artifacts and their source receipt.
