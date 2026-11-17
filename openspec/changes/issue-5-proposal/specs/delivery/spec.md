<!-- pdac-scope: cited -->

## Product dependencies

<!-- pdac:cite id="SB-PERSIST-CONFLICT" digest="sha256:3a7fdc4b47da270a63bc50bf681af96793fb46a8283af9093b01d9959f026b37" -->
<!-- pdac:cite id="SB-PERSIST-FAILURE" digest="sha256:31db2bb51e3c0495ac05dc1b53938c2de756eef9176e3ba747f6b877ee014357" -->
<!-- pdac:cite id="SB-PERSIST-RECOVER" digest="sha256:3bb4bec701cf460455382daec1bd17f1e87e0a7f2f5cddc33e244a5b6287d9af" -->
<!-- pdac:cite id="SB-RECOVERY-INVALID" digest="sha256:0ad0f1f37ef7919e9cbdc0708cc377af07901380f00504ed86d24617bc767ec5" -->
<!-- pdac:cite id="BR-DURABILITY" digest="sha256:6b075527861da086b9571e8d117c7844348a437e363423bca46f60cc83b02e0b" -->
<!-- pdac:cite id="FR-PERSIST" digest="sha256:5f901e669e39923921cd1d28302b3f308460a72bda3bce53d83ffa7255934cd4" -->
<!-- pdac:cite id="UC-PERSIST" digest="sha256:11f7381952aca132adad468fc62c648341ccc68c29bdc3b805020ee0997c3d0b" -->

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
