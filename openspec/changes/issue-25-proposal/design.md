<!-- pdac-scope: cited -->
# Private-library implementation

## Context

Implement the applied CHG-ARRANGEMENT-EVOLUTION without treating configuration, a local write or a passing unit test as private authority or a remote commit.
<!-- pdac:cite id="FR-PERSIST" digest="sha256:19c3bdee25cf34e4b6c6742a5da9a3c8905ba657d9056227fa0180474ed9b5e3" -->
<!-- pdac:cite id="BR-DURABILITY" digest="sha256:d822f18f163b8685937ae5a3137dc04ef4a2d5947ab7a9954245bd965b72fa45" -->
<!-- pdac:cite id="BR-EDIT-GUARD" digest="sha256:20e678c4743404c64a51c01e4446026ac95811827d2f5e1c641839291ad32718" -->

## Decisions

The API host composes one Library module. HTTP endpoints invoke typed internal sealed handlers; pure domain validation precedes repository operations. The infrastructure adapter owns Npgsql and the transaction. Ownership comes from the validated issuer/subject session. Song grants and content writes serialize under one transaction advisory lock for this bounded MVP. Conditional personal-library and song revisions reject stale writes; complete song history and command receipts commit together. Receipts contain revision/capability metadata, never a duplicate musical library. Retrying returns current content only when acknowledgement metadata still matches current authorization and revisions; otherwise it refuses for explicit comparison. Recovery receipts contain only command/song identity, revision and retention result.

Provider access/refresh tokens are in encrypted server-side tickets. The browser has only a protected session cookie and anti-forgery token. Fresh provider introspection and current database grants govern operations. The Keycloak fixture explicitly includes the confidential client audience required for introspection. Known proxy configuration is private and production requires HTTPS and separately qualified identity/settings.
<!-- pdac:cite id="BR-ACCESS" digest="sha256:9b679c2f86bdff7fc86ae00f0669e3a76023c3579895249dd21bbb3d617494a9" -->
<!-- pdac:cite id="BR-SESSION" digest="sha256:ef810362632ea22983eed6cfcdb6adfafb1d37497623582d64c0bc7c349e7bc2" -->

An import preview identifies counts and preservation/copy intent. Validation refuses unknown schema/fields, duplicate IDs and dangling memberships before commit. Import cannot modify/remove existing private songs; explicit copies remap every internal identity consistently. A current v1 file is retained; unsupported richer or PDF-bearing data is never silently truncated.
<!-- pdac:cite id="BR-BACKUP" digest="sha256:6e01f0285df7783f48eb0c482fa31f490f09e97e0f67a3a5fb3261dc1d1ed29c" -->
<!-- pdac:cite id="LC-LIBRARY" digest="sha256:87592e7d48ad80b922f219f370fee009668a74146f83cbb2f159e16752fbdda5" -->

Pending work is encrypted with AES-GCM before a private save attempt. Only ciphertext and an opaque key reference persist in browser storage. The server protects the principal-bound key and records its resource scope; unlock revalidates current permissions. Offline events and unknown/revoked sessions lock the private view and remove active key material. Recovery is explicit export/comparison, with no automatic replay. Private persistent offline editing remains disabled.

Deletion retains immutable supported song history for the owner, removes grants and memberships atomically, and exposes an owner-only trash/history view. Restore checks the complete resulting library for identity conflicts and creates a new revision without reviving former grants or memberships. Purge requires a separate exact-title confirmation, deletes live content/history/grants and preserves a non-content tombstone; restore/import cannot reuse that identity. Restore/purge use the same transaction lock as saves and grants.

The PWA navigation fallback excludes API, authentication, health and both OIDC callback paths, including callback query parameters. Otherwise a previously installed worker can swallow a later sign-in without returning control to the BFF. The connected recovery/user-switch journey exercises this boundary.

## Risks and limits

The single transaction lock prioritizes clear consistency over high write throughput. PostgreSQL/key-ring backup restoration, rich-arrangement retention/purge coverage, long-running session renewal, production artifact qualification and physical-device acceptance need their own executed evidence. The scoped analyzer rules and compiler refusals do not prove identity or transaction security.

The Development bootstrap validates the selected native realm before creating runtime files or starting the provider. User IDs and case-insensitive usernames and client IDs must be unique; each user supplies an enabled flag and password credential. The selected client is enabled and confidential. Explicit user role bindings must refer to declared realm/client roles, except the provider's standard realm roles. Realm names cannot contain path separators, and the identity authority must match. Validation failures omit fixture contents and credentials. These are bootstrap-fixture checks; song grants remain independent resource-scoped permissions.
