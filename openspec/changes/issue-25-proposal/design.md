<!-- pdac-scope: cited -->
# Private-library implementation

## Context

Implement the applied CHG-ARRANGEMENT-EVOLUTION without treating configuration, a local write or a passing unit test as private authority or a remote commit.
<!-- pdac:cite id="FR-PERSIST" digest="sha256:5f901e669e39923921cd1d28302b3f308460a72bda3bce53d83ffa7255934cd4" -->
<!-- pdac:cite id="BR-DURABILITY" digest="sha256:6b075527861da086b9571e8d117c7844348a437e363423bca46f60cc83b02e0b" -->
<!-- pdac:cite id="BR-EDIT-GUARD" digest="sha256:20e678c4743404c64a51c01e4446026ac95811827d2f5e1c641839291ad32718" -->

## Decisions

The API host composes one Library module. HTTP endpoints invoke typed internal sealed handlers; pure domain validation precedes repository operations. The infrastructure adapter owns Npgsql and the transaction. Ownership comes from the validated issuer/subject session. Song grants and content writes serialize under one transaction advisory lock for this bounded MVP. Conditional personal-library and song revisions reject stale writes; complete song history and command receipts commit together. Receipts contain revision/capability metadata, never a duplicate musical library. Retrying returns current content only when acknowledgement metadata still matches current authorization and revisions; otherwise it refuses for explicit comparison. Recovery receipts contain only command/song identity, revision and retention result.

Provider access/refresh tokens are in encrypted server-side tickets. The browser has only a protected session cookie and anti-forgery token. Fresh provider introspection and current database grants govern operations. The Keycloak fixture explicitly includes the confidential client audience required for introspection. Known proxy configuration is private and production requires HTTPS and separately qualified identity/settings.
<!-- pdac:cite id="BR-ACCESS" digest="sha256:fcc173c80ae4a5903dbeb2e11c141cb6ee8d03382c812ebc527d5065347b72c9" -->
<!-- pdac:cite id="BR-SESSION" digest="sha256:a8c63526b6fe52375791a737ed14280609d00938808928153d49fd2627416326" -->

An import preview identifies counts and preservation/copy intent. Validation refuses unknown schema/fields, duplicate IDs and dangling memberships before commit. Import cannot modify/remove existing private songs; explicit copies remap every internal identity consistently. A current v1 file is retained; unsupported richer or PDF-bearing data is never silently truncated.
<!-- pdac:cite id="BR-BACKUP" digest="sha256:0ca300361becac0a9858d098ab1e029b5bc1dfe41a06a58ecc40408fee32ed3b" -->
<!-- pdac:cite id="LC-LIBRARY" digest="sha256:40aaed3bcc086823445f840db9aa19d0e7bdf28ac94bd8ebfa8848b5702c711f" -->

Pending work is encrypted with AES-GCM before a private save attempt. Only ciphertext and an opaque key reference persist in browser storage. The server protects the principal-bound key and records its resource scope; unlock revalidates current permissions. Offline events and unknown/revoked sessions lock the private view and remove active key material. Recovery is explicit export/comparison, with no automatic replay. Private persistent offline editing remains disabled.

Deletion retains immutable supported song history for the owner, removes grants and memberships atomically, and exposes an owner-only trash/history view. Restore checks the complete resulting library for identity conflicts and creates a new revision without reviving former grants or memberships. Purge requires a separate exact-title confirmation, deletes live content/history/grants and preserves a non-content tombstone; restore/import cannot reuse that identity. Restore/purge use the same transaction lock as saves and grants.

The PWA navigation fallback excludes API, authentication, health and both OIDC callback paths, including callback query parameters. Otherwise a previously installed worker can swallow a later sign-in without returning control to the BFF. The connected recovery/user-switch journey exercises this boundary.

## Risks and limits

The single transaction lock prioritizes clear consistency over high write throughput. PostgreSQL/key-ring backup restoration, rich-arrangement retention/purge coverage, long-running session renewal, production artifact qualification and physical-device acceptance need their own executed evidence. The scoped analyzer rules and compiler refusals do not prove identity or transaction security.
