<!-- pdac-scope: cited -->

## Product dependencies

<!-- pdac:cite id="SB-ANNOTATIONS" digest="sha256:e9f7eeba4ec89ac374cbbe880b1a4d2899ca92f1c6fd71231d9a664a94b8660f" -->
<!-- pdac:cite id="SB-REFERENCE-INVALID" digest="sha256:e8869ae8629e53bb37c03929c6c359d644e301527c89f4840530c78264779a9a" -->
<!-- pdac:cite id="SB-REFERENCE" digest="sha256:e203d2c8d8a82bebe478f129a51a6c3fa3ff35dedd53060a161c58d144e329c1" -->
<!-- pdac:cite id="BR-EDIT-GUARD" digest="sha256:20e678c4743404c64a51c01e4446026ac95811827d2f5e1c641839291ad32718" -->
<!-- pdac:cite id="BR-IDENTITY" digest="sha256:d9c6607eb0cc984270a900d1889980f7515f3c1648f31efe56ceb9f3818e0352" -->
<!-- pdac:cite id="BR-REFERENCES" digest="sha256:f6c63aa91b8cd5dc754520d4015424c3c56811d90a886f62a895c9db99ce9ce3" -->
<!-- pdac:cite id="FR-ANNOTATIONS" digest="sha256:129f593fd3ff8c31fb40abf5805928901658bf3ddfdb1bb5b589c687b9515940" -->
<!-- pdac:cite id="FR-REFERENCES" digest="sha256:7e91c572a98f87aca1b524767e99c88a04958f199c4a1c5dcefd746dcae6bfce" -->
<!-- pdac:cite id="UC-ANNOTATIONS" digest="sha256:1b3e61e884b4aa938f3b9a81d07f90523bcd46514071f5d953d98cfbd7e0d715" -->
<!-- pdac:cite id="UC-REFERENCES" digest="sha256:f5c149268a2548e66b3defdfac2618dda842ffd8d2b2aeb12acf66a829eed4da" -->

## ADDED Requirements

### Requirement: Realize the accepted delivery behaviour

The implementation SHALL satisfy the cited product behaviours and governing invariants for this slice. This is a consumer projection of CHG-INITIAL; the ProductShape artifacts remain canonical.

#### Scenario: SB-ANNOTATIONS

- **WHEN** The musician adds a song note and updates one section note
- **THEN** The song and selected section retain the supplied free-form text; The other section is unchanged

#### Scenario: SB-REFERENCE-INVALID

- **WHEN** The musician supplies a script or non-web URL
- **THEN** The reference is rejected; Song content remains unchanged

#### Scenario: SB-REFERENCE

- **WHEN** The musician adds and opens an absolute HTTPS reference
- **THEN** The reference remains associated with that song; The external page opens separately; Pending application state remains available
