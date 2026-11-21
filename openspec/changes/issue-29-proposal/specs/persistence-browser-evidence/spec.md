<!-- pdac-scope: cited -->

## ADDED Requirements

### Requirement: Verify stale-tab refusal

Browser verification SHALL reject stale writes.

<!-- pdac:cite id="SB-PERSIST-CONFLICT" digest="sha256:3a7fdc4b47da270a63bc50bf681af96793fb46a8283af9093b01d9959f026b37" -->
<!-- pdac:cite id="BR-DURABILITY" digest="sha256:d822f18f163b8685937ae5a3137dc04ef4a2d5947ab7a9954245bd965b72fa45" -->
<!-- pdac:cite id="QR-INTEGRITY" digest="sha256:efafc9b7b32a7ff39fdb822f04ef46def7c7534b84b2e48a606fce99bea603e6" -->

#### Scenario: Stale tab cannot overwrite the winner

- **GIVEN** Two real tabs have opened the same complete local revision
- **WHEN** One saves a note and the other attempts a different note edit
- **THEN** The stale tab shows conflict and unsaved status while its draft remains editable and complete durable data exactly matches the acknowledged winner

### Requirement: Verify failed-write preservation

Browser verification SHALL prove an injected failed write preserves acknowledged data and its unsaved draft.

<!-- pdac:cite id="SB-PERSIST-FAILURE" digest="sha256:31db2bb51e3c0495ac05dc1b53938c2de756eef9176e3ba747f6b877ee014357" -->
<!-- pdac:cite id="BR-DURABILITY" digest="sha256:d822f18f163b8685937ae5a3137dc04ef4a2d5947ab7a9954245bd965b72fa45" -->

#### Scenario: Failed write preserves the complete durable revision until explicit retry

- **GIVEN** A complete acknowledged fixture and a one-shot native IndexedDB put fault
- **WHEN** A note edit encounters the injected QuotaExceededError
- **THEN** Failure and unsaved status are visible, the draft remains editable/exportable, the complete prior durable revision is unchanged, and explicit retry saves exactly the next revision which survives reload

### Requirement: Verify complete draft export

Browser verification SHALL compare actual downloaded draft backups against complete expected envelopes.

<!-- pdac:cite id="SB-BACKUP-EXPORT" digest="sha256:4dc53a109e0e344b95c117d7a429c92b3b54d4ce8856cf00104b501d13f86237" -->
<!-- pdac:cite id="BR-BACKUP" digest="sha256:6e01f0285df7783f48eb0c482fa31f490f09e97e0f67a3a5fb3261dc1d1ed29c" -->

#### Scenario: Unsaved work remains portable

- **WHEN** The musician exports work after either refusal
- **THEN** The actual downloaded versioned envelope contains the complete draft and exporting does not modify durable data

### Requirement: Verify acknowledged recovery

Browser verification SHALL prove reload reconstructs the complete last acknowledged revision.

<!-- pdac:cite id="SB-PERSIST-RECOVER" digest="sha256:3bb4bec701cf460455382daec1bd17f1e87e0a7f2f5cddc33e244a5b6287d9af" -->
<!-- pdac:cite id="FR-PERSIST" digest="sha256:19c3bdee25cf34e4b6c6742a5da9a3c8905ba657d9056227fa0180474ed9b5e3" -->

#### Scenario: Reopen after refusal or retry

- **WHEN** The musician reloads the stale tab or a successfully retried draft
- **THEN** The winner or acknowledged retry is reconstructed with exact identities, content, order and revision
