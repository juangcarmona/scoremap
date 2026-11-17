## ADDED Requirements

### Requirement: Authenticated BFF boundary

<!-- pdac-scope: cited -->


The web application MUST use the selected real OIDC provider through maintained ASP.NET Core code/PKCE middleware and server-held sessions, with current principal/resource authorization and explicit CSRF admission for mutation.

#### Scenario: Real sign-in and callback

- **GIVEN** an enabled synthetic user in the selected native provider fixture
- **WHEN** the user signs in through the actual provider form
- **THEN** the private screen opens with an HttpOnly session cookie and no provider token in browser storage.

<!-- pdac:cite id="FR-PERSIST" digest="sha256:5f901e669e39923921cd1d28302b3f308460a72bda3bce53d83ffa7255934cd4" -->
<!-- pdac:cite id="BR-ACCESS" digest="sha256:fcc173c80ae4a5903dbeb2e11c141cb6ee8d03382c812ebc527d5065347b72c9" -->
<!-- pdac:cite id="BR-SESSION" digest="sha256:a8c63526b6fe52375791a737ed14280609d00938808928153d49fd2627416326" -->

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

<!-- pdac:cite id="BR-BACKUP" digest="sha256:0ca300361becac0a9858d098ab1e029b5bc1dfe41a06a58ecc40408fee32ed3b" -->
<!-- pdac:cite id="BR-DURABILITY" digest="sha256:6b075527861da086b9571e8d117c7844348a437e363423bca46f60cc83b02e0b" -->
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
