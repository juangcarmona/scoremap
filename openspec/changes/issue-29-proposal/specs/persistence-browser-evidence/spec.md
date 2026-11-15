<!-- pdac-scope: cited -->

## ADDED Requirements

### Requirement: Verify stale-tab refusal

Browser verification SHALL reject stale writes.

<!-- pdac:cite id="SB-PERSIST-CONFLICT" digest="sha256:3a7fdc4b47da270a63bc50bf681af96793fb46a8283af9093b01d9959f026b37" -->
<!-- pdac:cite id="BR-DURABILITY" digest="sha256:f6e8a52fdb28d495f07304870d8d2bfa6c6e5adce7722d919ce64efca735c57e" -->
<!-- pdac:cite id="QR-INTEGRITY" digest="sha256:568e58e96aee82ee0d0e86d08db59659b9e6d9f182ef20c40e94fdd36e263180" -->

#### Scenario: Stale tab cannot overwrite the winner

- **GIVEN** Two real tabs have opened the same complete local revision
- **WHEN** One saves a note and the other attempts a different note edit
- **THEN** The stale tab shows conflict and unsaved status while its draft remains editable and complete durable data exactly matches the acknowledged winner

### Requirement: Verify failed-write preservation

Browser verification SHALL prove an injected failed write preserves acknowledged data and its unsaved draft.

<!-- pdac:cite id="SB-PERSIST-FAILURE" digest="sha256:31db2bb51e3c0495ac05dc1b53938c2de756eef9176e3ba747f6b877ee014357" -->
<!-- pdac:cite id="BR-DURABILITY" digest="sha256:f6e8a52fdb28d495f07304870d8d2bfa6c6e5adce7722d919ce64efca735c57e" -->

#### Scenario: Failed write preserves the complete durable revision until explicit retry

- **GIVEN** A complete acknowledged fixture and a one-shot native IndexedDB put fault
- **WHEN** A note edit encounters the injected QuotaExceededError
- **THEN** Failure and unsaved status are visible, the draft remains editable/exportable, the complete prior durable revision is unchanged, and explicit retry saves exactly the next revision which survives reload

### Requirement: Verify complete draft export

Browser verification SHALL compare actual downloaded draft backups against complete expected envelopes.

<!-- pdac:cite id="SB-BACKUP-EXPORT" digest="sha256:4dc53a109e0e344b95c117d7a429c92b3b54d4ce8856cf00104b501d13f86237" -->
<!-- pdac:cite id="BR-BACKUP" digest="sha256:4344f228dbb32818f9dfdce278ec73ac6acd8dc4689069ac6c79d12c1571b917" -->

#### Scenario: Unsaved work remains portable

- **WHEN** The musician exports work after either refusal
- **THEN** The actual downloaded versioned envelope contains the complete draft and exporting does not modify durable data

### Requirement: Verify acknowledged recovery

Browser verification SHALL prove reload reconstructs the complete last acknowledged revision.

<!-- pdac:cite id="SB-PERSIST-RECOVER" digest="sha256:bdcc4abc19436e6b008b9d88047efe937f948e71d6c817e0c06209b3b498cd26" -->
<!-- pdac:cite id="FR-PERSIST" digest="sha256:dd2162a91bdda6f1fbded015f3964843f40041d2fb3b4f5cf54d2616586cffc8" -->

#### Scenario: Reopen after refusal or retry

- **WHEN** The musician reloads the stale tab or a successfully retried draft
- **THEN** The winner or acknowledged retry is reconstructed with exact identities, content, order and revision
