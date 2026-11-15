<!-- pdac-scope: cited -->

## Product dependencies

<!-- pdac:cite id="SB-PERSIST-CONFLICT" digest="sha256:3a7fdc4b47da270a63bc50bf681af96793fb46a8283af9093b01d9959f026b37" -->
<!-- pdac:cite id="SB-PERSIST-FAILURE" digest="sha256:31db2bb51e3c0495ac05dc1b53938c2de756eef9176e3ba747f6b877ee014357" -->
<!-- pdac:cite id="SB-PERSIST-RECOVER" digest="sha256:bdcc4abc19436e6b008b9d88047efe937f948e71d6c817e0c06209b3b498cd26" -->
<!-- pdac:cite id="SB-RECOVERY-INVALID" digest="sha256:0ad0f1f37ef7919e9cbdc0708cc377af07901380f00504ed86d24617bc767ec5" -->
<!-- pdac:cite id="BR-DURABILITY" digest="sha256:f6e8a52fdb28d495f07304870d8d2bfa6c6e5adce7722d919ce64efca735c57e" -->
<!-- pdac:cite id="FR-PERSIST" digest="sha256:dd2162a91bdda6f1fbded015f3964843f40041d2fb3b4f5cf54d2616586cffc8" -->
<!-- pdac:cite id="UC-PERSIST" digest="sha256:25240c400f6e45ab69524737119d2d7a7645030a148def3086f3aed73fa08c2a" -->

## ADDED Requirements

### Requirement: Realize the accepted delivery behaviour

The implementation SHALL satisfy the cited product behaviours and governing invariants for this slice. This is a consumer projection of CHG-INITIAL; the ProductShape artifacts remain canonical.

#### Scenario: SB-PERSIST-CONFLICT

- **WHEN** The other session attempts to save its older revision
- **THEN** The stale write is refused; The newer durable data is preserved; The conflict is visible and the older session can export its work

#### Scenario: SB-PERSIST-FAILURE

- **WHEN** The musician requests a save
- **THEN** A save failure is clearly shown without a success acknowledgement; The prior durable revision remains recoverable; The musician can retain or export unsaved work

#### Scenario: SB-PERSIST-RECOVER

- **WHEN** The musician reopens ScoreMap
- **THEN** The last acknowledged songs, repertoires, memberships and sketch content are recovered; Stable identities and order remain unchanged

#### Scenario: SB-RECOVERY-INVALID

- **WHEN** The musician opens ScoreMap
- **THEN** An actionable recovery error is shown; The stored data is not replaced by an empty library
