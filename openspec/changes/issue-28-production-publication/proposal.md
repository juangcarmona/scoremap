<!-- pdac-scope: cited -->
<!-- pdac:cite id="BR-SESSION" digest="sha256:a8c63526b6fe52375791a737ed14280609d00938808928153d49fd2627416326" -->
<!-- pdac:cite id="BR-DURABILITY" digest="sha256:6b075527861da086b9571e8d117c7844348a437e363423bca46f60cc83b02e0b" -->

# Separate production publication

Implement the remaining Aspire-to-Compose publication boundary accepted in ADR-0003/0004 and issue #28. A Development AppHost and a handwritten Compose file do not establish that boundary. Keep the established API/private PWA image and external OIDC contract; add a separate guarded publisher with no development provider, seeds or dashboard.

Generate parameterized persistent database/key storage, loopback ingress, private configuration/secret files and restart/readiness dependencies. Verify the generated snapshot and refusing direct-execution path. Publish immutable committed-source artifacts and their receipt separately from selecting a qualified image, disposable runtime/restore qualification and actual operator deployment. No musical lifecycle, product-model change or infrastructure inventory is introduced.
