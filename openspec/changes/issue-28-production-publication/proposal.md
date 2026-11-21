<!-- pdac-scope: cited -->
<!-- pdac:cite id="BR-SESSION" digest="sha256:ef810362632ea22983eed6cfcdb6adfafb1d37497623582d64c0bc7c349e7bc2" -->
<!-- pdac:cite id="BR-DURABILITY" digest="sha256:d822f18f163b8685937ae5a3137dc04ef4a2d5947ab7a9954245bd965b72fa45" -->

# Separate production publication

Implement the remaining Aspire-to-Compose publication boundary accepted in ADR-0003/0004 and issue #28. A Development AppHost and a handwritten Compose file do not establish that boundary. Keep the established API/private PWA image and external OIDC contract; add a separate guarded publisher with no development provider, seeds or dashboard.

Generate parameterized persistent database/key storage, loopback ingress, private configuration/secret files and restart/readiness dependencies. Verify the generated snapshot and refusing direct-execution path. Publish immutable committed-source artifacts and their receipt separately from selecting a qualified image, disposable runtime/restore qualification and actual operator deployment. No musical lifecycle, product-model change or infrastructure inventory is introduced.
