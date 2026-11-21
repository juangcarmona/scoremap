## ADDED Requirements

### Requirement: Authenticated BFF boundary

<!-- pdac-scope: cited -->


The web application MUST use the selected real OIDC provider through maintained ASP.NET Core code/PKCE middleware and server-held sessions, with current principal/resource authorization and explicit CSRF admission for mutation.

#### Scenario: Real sign-in and callback

- **GIVEN** an enabled synthetic user in the selected native provider fixture
- **WHEN** the user signs in through the actual provider form
- **THEN** the private screen opens with an HttpOnly session cookie and no provider token in browser storage.

<!-- pdac:cite id="FR-PERSIST" digest="sha256:19c3bdee25cf34e4b6c6742a5da9a3c8905ba657d9056227fa0180474ed9b5e3" -->
<!-- pdac:cite id="BR-ACCESS" digest="sha256:9b679c2f86bdff7fc86ae00f0669e3a76023c3579895249dd21bbb3d617494a9" -->
<!-- pdac:cite id="BR-SESSION" digest="sha256:ef810362632ea22983eed6cfcdb6adfafb1d37497623582d64c0bc7c349e7bc2" -->

#### Scenario: Refused direct request

- **GIVEN** an unauthenticated client or a current song viewer
- **WHEN** it attempts an unauthorized private mutation
- **THEN** the boundary returns its declared 401/403 refusal and the previous durable data is unchanged.

### Requirement: Explicit current-format import and acknowledged commit

The application MUST validate the complete supported v1 library envelope, show its counts and identity/copy intent for confirmation, and implement the accepted import and durability guards before acknowledging a private PostgreSQL transaction.

#### Scenario: Import, edit and second-session recovery

- **GIVEN** a synthetic current ScoreMap JSON export and a real owner session
- **WHEN** the owner confirms import, edits a note and receives a service acknowledgement
- **THEN** a clean second authorized browser reconstructs the same identities, section order, spelling, notes and current acknowledged version from the service.

<!-- pdac:cite id="BR-BACKUP" digest="sha256:6e01f0285df7783f48eb0c482fa31f490f09e97e0f67a3a5fb3261dc1d1ed29c" -->
<!-- pdac:cite id="BR-DURABILITY" digest="sha256:d822f18f163b8685937ae5a3137dc04ef4a2d5947ab7a9954245bd965b72fa45" -->
<!-- pdac:cite id="BR-EDIT-GUARD" digest="sha256:20e678c4743404c64a51c01e4446026ac95811827d2f5e1c641839291ad32718" -->

#### Scenario: Existing identity or stale write

- **GIVEN** an occupied destination identity or an intervening acknowledged revision
- **WHEN** an unconfirmed collision or stale candidate is submitted
- **THEN** it refuses without partial replacement, and explicit copy/remapping or export/comparison remains available.

### Requirement: Protected pending work and real permission changes

The private adapter MUST retain only protected pending records across session termination, revalidate the same stable principal and covered resources before unlock, and never replay retained work automatically. Private persistent offline editing remains disabled.

#### Scenario: Grant revocation

- **GIVEN** a real editor session displaying a granted song
- **WHEN** its owner revokes the grant
- **THEN** subsequent requests refuse the old content/receipt and the observed private view locks.

#### Scenario: Failed save and session termination

- **GIVEN** a valid private candidate whose service acknowledgement cannot be obtained
- **WHEN** its session ends
- **THEN** the original durable revision remains unchanged and only an account-bound ciphertext record persists for explicit authorized recovery.

### Requirement: Current-format song history and owner recovery

The private library MUST retain supported complete song versions, require current authorization and edit mode for restoration, and distinguish recoverable deletion from an explicitly confirmed permanent purge. Purge MUST prevent resurrection of the same identity.

#### Scenario: Owner recovery without obsolete access

- **GIVEN** a current-format owned song with history, grants and repertoire membership
- **WHEN** its owner deletes and explicitly restores it
- **THEN** its song/content identities and history survive, while former grants and memberships remain removed.

<!-- pdac:cite id="FR-SONGS" digest="sha256:77823d9d26f9d5aa3f2fedb540d015a16b2aadc76c1eb2836824b7bb255ec739" -->

#### Scenario: Permanent purge and retry

- **GIVEN** an owner-authorized deleted song and a separately confirmed exact-title purge
- **WHEN** purge commits and the same command is retried
- **THEN** the metadata acknowledgement repeats without another mutation, retained musical history is unavailable, and restore or import of that identity refuses.

#### Scenario: Conflicting or failed recovery

- **GIVEN** unsaved local work, a stale revision, insufficient permission or a competing restore/purge
- **WHEN** recovery is attempted
- **THEN** guards refuse without discarding pending work or partially changing durable music; only one competing valid command can acknowledge the expected revision.
