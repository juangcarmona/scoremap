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

### Requirement: Trusted recoverable revision metadata
New private history revisions MUST retain the trusted acting principal, operation, base song revision and command identity in the same transaction as content. Restore MUST record its selected source revision independently of the base revision. Older history MUST remain unchanged without fabricated authorship. Retained legacy import sources MUST NOT identify the importer as their original author. Purge MUST remove the retained history and its metadata.

#### Scenario: Historical restore preserves intervening work
- **GIVEN** a current authorized song at revision 2 with recoverable revision 1
- **WHEN** an authorized musician restores revision 1
- **THEN** revision 3 records base revision 2 and source revision 1 with the trusted actor and stable command, while revisions 1 and 2 remain immutable and a retry creates no new version.

### Requirement: Selected non-destructive private transfer
Private import and same-origin anonymous claim MUST preview an explicit selection of complete songs and optionally their limited repertoire memberships. Existing destination data and original sources MUST remain intact. Identity collisions MUST refuse before activation with an explicit independent-copy option. Declared source schema/revision/scope MUST remain separate from trusted destination ownership and acknowledgement. Independently owned personal resources MUST use their separate controls.

#### Scenario: Selected claim and collision copy
- **GIVEN** a validated anonymous library containing two complete rich songs and a repertoire containing both
- **WHEN** its owner confirms one selected song and later explicitly copies a colliding selection
- **THEN** only selected complete graphs and limited memberships are committed, the anonymous source remains unchanged, and a lost copy response is reconciled by its original protected command without duplicate identities or revisions.

### Requirement: Verify private transfer reconstruction
A successful transfer confirmation MUST distinguish the acknowledged destination commit from a subsequent fresh authorized reconstruction. Original anonymous work MUST remain retained until that reconstruction is verified and any later removal is explicitly chosen. A failed readback MUST report the acknowledged commit truthfully without pretending rollback or silently importing another copy.

#### Scenario: Acknowledged import with unavailable readback
- **GIVEN** an actual complete import commit whose acknowledgement succeeds
- **WHEN** its next fresh authorized readback fails
- **THEN** the product reports saved-but-unverified reconstruction, keeps the original source and existing destination, and a repeated identity-preserving selection encounters the existing identities without another write.

### Requirement: Independent protected personal commands
Principal-owned preferences and reusable resources MUST retain their complete original command under an independent protected recovery purpose before service transport. Their separate acknowledgement MUST match the intended revision and content before local removal. Current same-principal online authorization MUST precede recovery; no command replays automatically after reopening. A song grant MUST NOT expose personal work, and a personal key MUST NOT authorize song recovery or a song commit.

#### Scenario: Lost preference response and account switch
- **GIVEN** a personal preference command committed on the service whose response was lost and whose original request is protected on the device
- **WHEN** the musician signs out, uses another account and later reauthenticates as the original principal
- **THEN** the other account cannot open the record, the original principal explicitly reviews and retries its original command without another preference revision, and song content/revisions remain unchanged.

#### Scenario: Song revocation leaves personal ownership independent
- **GIVEN** a principal with both a scoped song-recovery key and an independently owned personal key
- **WHEN** the song owner revokes that principal's grant
- **THEN** song-key unlock refuses, fresh same-principal personal-key unlock remains independent, opposite-purpose unlock and personal-key song commits refuse, and an explicit key deletion prevents later unlock.

#### Scenario: Personal protection failure and independent music save
- **GIVEN** a failed personal-record protection operation and a valid independently protected song edit
- **WHEN** the song commit is acknowledged and the musician requests voluntary termination
- **THEN** the song remains acknowledged while the personal failure remains visible for an explicit retention decision; it is never reported as protected or part of the song transaction.

### Requirement: Independent reusable device configurations
Reusable device configurations MUST have separate principal ownership, explicit physical ranges, versions, expected-revision admission and retry receipts. Anonymous resource commits remain local and separate. Applying an acknowledged configuration MUST copy a new song-owned device identity without changing existing music or introducing a live dependency. Separate transfer MUST validate its supported version and complete content, keep the source and require an explicit independent copy.

#### Scenario: Copied configuration remains independent
- **GIVEN** an acknowledged reusable keyboard configuration and a song with three physical keyboards plus an independent second arrangement
- **WHEN** the musician copies the configuration into one arrangement and subsequently edits/removes the reusable resource
- **THEN** the fourth device has its own identity, all prior parts, notes, bindings, shared form and the second arrangement remain unchanged, and later resource changes do not mutate the song copy.

#### Scenario: Lost resource acknowledgement
- **GIVEN** a complete protected device-configuration command whose actual committed response was lost
- **WHEN** the same principal reopens, explicitly reviews the protected original command and retries it
- **THEN** the service reconciles its original receipt without a duplicate resource revision or a song/library revision, and other principals cannot acquire its ownership through the resource identity or a song grant.
