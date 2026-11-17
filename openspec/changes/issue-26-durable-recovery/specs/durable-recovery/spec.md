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
