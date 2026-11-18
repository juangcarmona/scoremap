<!-- pdac-scope: cited -->

## ADDED Requirements

### Requirement: Verify stale-tab refusal

Browser verification SHALL reject stale writes.

<!-- pdac:cite id="SB-PERSIST-CONFLICT" digest="sha256:3a7fdc4b47da270a63bc50bf681af96793fb46a8283af9093b01d9959f026b37" -->
<!-- pdac:cite id="BR-DURABILITY" digest="sha256:6b075527861da086b9571e8d117c7844348a437e363423bca46f60cc83b02e0b" -->
<!-- pdac:cite id="QR-INTEGRITY" digest="sha256:ab546fccd5704db577b5005460adc8c643dc6adb9173cf2ee750e7f1e6e0ae3e" -->

#### Scenario: Stale tab cannot overwrite the winner

- **GIVEN** Two real tabs have opened the same complete local revision
- **WHEN** One saves a note and the other attempts a different note edit
- **THEN** The stale tab shows conflict and unsaved status while its draft remains editable and complete durable data exactly matches the acknowledged winner

### Requirement: Verify failed-write preservation

Browser verification SHALL prove an injected failed write preserves acknowledged data and its unsaved draft.

<!-- pdac:cite id="SB-PERSIST-FAILURE" digest="sha256:31db2bb51e3c0495ac05dc1b53938c2de756eef9176e3ba747f6b877ee014357" -->
<!-- pdac:cite id="BR-DURABILITY" digest="sha256:6b075527861da086b9571e8d117c7844348a437e363423bca46f60cc83b02e0b" -->

#### Scenario: Failed write preserves the complete durable revision until explicit retry

- **GIVEN** A complete acknowledged fixture and a one-shot native IndexedDB put fault
- **WHEN** A note edit encounters the injected QuotaExceededError
- **THEN** Failure and unsaved status are visible, the draft remains editable/exportable, the complete prior durable revision is unchanged, and explicit retry saves exactly the next revision which survives reload

### Requirement: Verify complete draft export

Browser verification SHALL compare actual downloaded draft backups against complete expected envelopes.

<!-- pdac:cite id="SB-BACKUP-EXPORT" digest="sha256:4dc53a109e0e344b95c117d7a429c92b3b54d4ce8856cf00104b501d13f86237" -->
<!-- pdac:cite id="BR-BACKUP" digest="sha256:0ca300361becac0a9858d098ab1e029b5bc1dfe41a06a58ecc40408fee32ed3b" -->

#### Scenario: Unsaved work remains portable

- **WHEN** The musician exports work after either refusal
- **THEN** The actual downloaded versioned envelope contains the complete draft and exporting does not modify durable data

### Requirement: Verify acknowledged recovery

Browser verification SHALL prove reload reconstructs the complete last acknowledged revision.

<!-- pdac:cite id="SB-PERSIST-RECOVER" digest="sha256:3bb4bec701cf460455382daec1bd17f1e87e0a7f2f5cddc33e244a5b6287d9af" -->
<!-- pdac:cite id="FR-PERSIST" digest="sha256:5f901e669e39923921cd1d28302b3f308460a72bda3bce53d83ffa7255934cd4" -->

#### Scenario: Reopen after refusal or retry

- **WHEN** The musician reloads the stale tab or a successfully retried draft
- **THEN** The winner or acknowledged retry is reconstructed with exact identities, content, order and revision
