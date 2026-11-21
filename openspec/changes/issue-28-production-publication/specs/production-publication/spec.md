<!-- pdac-scope: cited -->
<!-- pdac:cite id="BR-SESSION" digest="sha256:ef810362632ea22983eed6cfcdb6adfafb1d37497623582d64c0bc7c349e7bc2" -->
<!-- pdac:cite id="BR-DURABILITY" digest="sha256:d822f18f163b8685937ae5a3137dc04ef4a2d5947ab7a9954245bd965b72fa45" -->

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
