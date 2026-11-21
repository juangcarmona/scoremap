<!-- pdac-scope: cited -->

## Product dependencies

<!-- pdac:cite id="SB-PERSIST-CONFLICT" digest="sha256:3a7fdc4b47da270a63bc50bf681af96793fb46a8283af9093b01d9959f026b37" -->
<!-- pdac:cite id="SB-PERSIST-FAILURE" digest="sha256:31db2bb51e3c0495ac05dc1b53938c2de756eef9176e3ba747f6b877ee014357" -->
<!-- pdac:cite id="SB-PERSIST-RECOVER" digest="sha256:3bb4bec701cf460455382daec1bd17f1e87e0a7f2f5cddc33e244a5b6287d9af" -->
<!-- pdac:cite id="SB-RECOVERY-INVALID" digest="sha256:0ad0f1f37ef7919e9cbdc0708cc377af07901380f00504ed86d24617bc767ec5" -->
<!-- pdac:cite id="BR-DURABILITY" digest="sha256:d822f18f163b8685937ae5a3137dc04ef4a2d5947ab7a9954245bd965b72fa45" -->
<!-- pdac:cite id="FR-PERSIST" digest="sha256:19c3bdee25cf34e4b6c6742a5da9a3c8905ba657d9056227fa0180474ed9b5e3" -->
<!-- pdac:cite id="UC-PERSIST" digest="sha256:ea669e891adfc7641a2cf80bd5cd198d3909ee2fd6424c505a7cf991314c602f" -->

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
