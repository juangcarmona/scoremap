<!-- pdac-scope: cited -->
<!-- pdac:cite id="BR-SESSION" digest="sha256:a8c63526b6fe52375791a737ed14280609d00938808928153d49fd2627416326" -->
<!-- pdac:cite id="BR-DURABILITY" digest="sha256:6b075527861da086b9571e8d117c7844348a437e363423bca46f60cc83b02e0b" -->
<!-- pdac:cite id="FR-PERSIST" digest="sha256:5f901e669e39923921cd1d28302b3f308460a72bda3bce53d83ffa7255934cd4" -->

## ADDED Requirements

### Requirement: Current session deadlines
The browser MUST receive the authoritative session-check time and earliest known cookie/provider expiration without usable provider material. It MUST charge network latency, lock at expiry without awaiting a poll, and refuse clock rollback or unknown time. An expired context MUST abort requests, reject old responses and release plaintext/key/capability caches. This session metadata MUST NOT confer song permission or enable private offline access.

#### Scenario: Expiry with a protected pending command
- **GIVEN** a real authenticated principal with a protected pending command and a known deadline
- **WHEN** that deadline is reached without renewed authority
- **THEN** the active private context locks, no old response acknowledges a new write, and the encrypted record remains for same-principal fresh authorization.

### Requirement: Explicit pending-work recovery
A reopened private library MUST retain its prior encrypted command and prevent silent replacement by new edits. Recovery MUST require current online scope permission, show a review, permit explicit export/removal, and retry only the original stable command and revision. Permission refusal and revision conflict MUST preserve acknowledged music and protected work.

#### Scenario: Lost acknowledgement after a complete commit
- **GIVEN** a complete original command whose server transaction committed but whose acknowledgement was lost
- **WHEN** the same principal explicitly retries that protected command after reopening and current authorization
- **THEN** its original receipt acknowledges the existing revision without duplicating events/history, and only that pending record is removed.

<!-- pdac:cite id="BR-BACKUP" digest="sha256:0ca300361becac0a9858d098ab1e029b5bc1dfe41a06a58ecc40408fee32ed3b" -->

### Requirement: Explicit independent recovery copies
The musician MUST be able to explicitly save one authorized pending song as a separate private copy under current permission and edit admission. The complete owned identity graph MUST be remapped consistently while external personal-resource provenance remains descriptive. Existing music/history and the original protected ciphertext MUST be preserved; copying MUST NOT silently merge or overwrite them.

#### Scenario: Legacy recovery copy
- **GIVEN** a supported legacy pending song and current permission
- **WHEN** the musician explicitly saves its independent recovery copy
- **THEN** atomic import migration retains that new copy's legacy source/history and deterministic mapping without inventing performed notes, and an ambiguous retry recognizes the same migrated copy.

### Requirement: Stable recovery-copy receipts
Opaque destination identities and a command identifier MUST be retained atomically before dispatch without musical names or keys in that metadata. Repeating an ambiguous copy MUST reconcile the same currently authorized complete destination or refuse changed content; it MUST NOT silently allocate another copy.

#### Scenario: Copy acknowledgement lost before reload
- **GIVEN** a protected complete pending song whose original retry is stale and a separately acknowledged newer original
- **WHEN** the musician confirms a recovery copy and its actual commit response is lost
- **THEN** reloading and confirming that same copy reconciles its retained identity without another write/revision, preserves the complete pending music and leaves the original's content/history plus protected ciphertext unchanged.

### Requirement: Protect admitted drafts before transport
Each admitted musical edit MUST derive the latest complete valid candidate and retain protected principal/context-bound work before transport. Older acknowledgements MUST NOT replace newer drafts. A failed protection commit MUST send no such write, claim no local retention and preserve prior acknowledgement. Confirmed restore/import MUST form a barrier so later commands apply to the restored state.

#### Scenario: New typing behind an older response
- **GIVEN** an actual service commit whose response is held and newer admitted typing in the same private song
- **WHEN** the browser reloads after acknowledging protected retention of the newer draft
- **THEN** the complete latest typed draft remains recoverable under fresh permission, the older service revision remains acknowledged and no newer write is automatically replayed.

### Requirement: Independent protected editing contexts
Each editing context MUST retain its own protected record without overwriting another tab. Supported legacy record keys MUST remain recoverable; unknown versions MUST remain intact. Unlock, export and replay MUST require the same stable principal and fresh current resource checks.

#### Scenario: Two pending tabs
- **GIVEN** two real authenticated tabs that opened the same acknowledged revision
- **WHEN** each retains a different unacknowledged draft and both are closed
- **THEN** reopening permits explicit authorized review/export of each distinct protected draft without changing acknowledged music or silently choosing a winner.

### Requirement: Terminate without waiting for an unknown network result
Voluntary logout MUST wait for latest local protection rather than a network response, offer an accurate explicit decision on protection failure, end the old context and preserve protected work without automatic replay. Requests MUST be bounded and original anonymous data MUST survive.

#### Scenario: Logout with a committed but undelivered response
- **GIVEN** a real service commit with a held response and a durably protected original command
- **WHEN** the musician confirms voluntary logout
- **THEN** real provider termination completes before that response is released, and later same-principal fresh authorization can reconcile its original receipt without another revision.
