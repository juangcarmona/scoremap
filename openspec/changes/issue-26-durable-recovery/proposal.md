<!-- pdac-scope: cited -->
<!-- pdac:cite id="BR-SESSION" digest="sha256:a8c63526b6fe52375791a737ed14280609d00938808928153d49fd2627416326" -->
<!-- pdac:cite id="BR-DURABILITY" digest="sha256:6b075527861da086b9571e8d117c7844348a437e363423bca46f60cc83b02e0b" -->
<!-- pdac:cite id="FR-PERSIST" digest="sha256:5f901e669e39923921cd1d28302b3f308460a72bda3bce53d83ffa7255934cd4" -->

# Durable recovery and session boundaries

Implement issue #26 on the complete arrangement and private-service checkpoints. A session deadline must lock active data without waiting for periodic polling, abort stale responses and preserve encrypted pending work. A new session must explicitly review its previous pending command before replacing it. Original-receipt retry checks current permissions and the original revisions; conflict never overwrites current music. Device retention, remote acknowledgement, independently owned resources, qualified private offline access and operator disaster recovery retain separate boundaries.
