<!-- pdac-scope: cited -->
<!-- pdac:cite id="BR-SESSION" digest="sha256:ef810362632ea22983eed6cfcdb6adfafb1d37497623582d64c0bc7c349e7bc2" -->
<!-- pdac:cite id="BR-DURABILITY" digest="sha256:d822f18f163b8685937ae5a3137dc04ef4a2d5947ab7a9954245bd965b72fa45" -->
<!-- pdac:cite id="FR-PERSIST" digest="sha256:19c3bdee25cf34e4b6c6742a5da9a3c8905ba657d9056227fa0180474ed9b5e3" -->

# Durable recovery and session boundaries

Implement issue #26 on the complete arrangement and private-service checkpoints. A session deadline must lock active data without waiting for periodic polling, abort stale responses and preserve encrypted pending work. A new session must explicitly review its previous pending command before replacing it. Original-receipt retry checks current permissions and the original revisions; conflict never overwrites current music. Device retention, remote acknowledgement, independently owned resources, qualified private offline access and operator disaster recovery retain separate boundaries.
