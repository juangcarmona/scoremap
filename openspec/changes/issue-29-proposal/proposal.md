<!-- pdac-scope: cited -->

# Browser evidence for persistence refusal and recovery

## Why

[Issue #29](https://github.com/juangcarmona/scoremap/issues/29) supplies an early, independent verification slice of #27. Current storage/application tests exercise conflicts and failure in isolation; the browser suite lacks the corresponding visible draft/export/retry journeys. This delivery consumes accepted CHG-INITIAL semantics and changes no product behavior.

## What Changes

Add only `tests/e2e/persistence.spec.ts` and this delivery change. Reuse existing browser helpers, production build, report attachments and evidence recorder. No shared configuration, dependency, application, backend, canonical model or architecture edits.

## Capabilities

### New Capabilities

- persistence-browser-evidence: Executable browser proof of existing persistence behavior.

### Modified Capabilities

None.

## Product dependencies

Direct dependencies are persistence refusal/recovery, complete backup export, their governing rules and existing requirement/quality authority:

<!-- pdac:cite id="SB-PERSIST-CONFLICT" digest="sha256:3a7fdc4b47da270a63bc50bf681af96793fb46a8283af9093b01d9959f026b37" -->
<!-- pdac:cite id="SB-PERSIST-FAILURE" digest="sha256:31db2bb51e3c0495ac05dc1b53938c2de756eef9176e3ba747f6b877ee014357" -->
<!-- pdac:cite id="SB-PERSIST-RECOVER" digest="sha256:bdcc4abc19436e6b008b9d88047efe937f948e71d6c817e0c06209b3b498cd26" -->
<!-- pdac:cite id="SB-BACKUP-EXPORT" digest="sha256:4dc53a109e0e344b95c117d7a429c92b3b54d4ce8856cf00104b501d13f86237" -->
<!-- pdac:cite id="BR-DURABILITY" digest="sha256:f6e8a52fdb28d495f07304870d8d2bfa6c6e5adce7722d919ce64efca735c57e" -->
<!-- pdac:cite id="BR-BACKUP" digest="sha256:4344f228dbb32818f9dfdce278ec73ac6acd8dc4689069ac6c79d12c1571b917" -->
<!-- pdac:cite id="BR-EDIT-GUARD" digest="sha256:20e678c4743404c64a51c01e4446026ac95811827d2f5e1c641839291ad32718" -->
<!-- pdac:cite id="FR-PERSIST" digest="sha256:dd2162a91bdda6f1fbded015f3964843f40041d2fb3b4f5cf54d2616586cffc8" -->
<!-- pdac:cite id="QR-INTEGRITY" digest="sha256:568e58e96aee82ee0d0e86d08db59659b9e6d9f182ef20c40e94fdd36e263180" -->
<!-- pdac:cite id="UC-PERSIST" digest="sha256:25240c400f6e45ab69524737119d2d7a7645030a148def3086f3aed73fa08c2a" -->
<!-- pdac:cite id="LC-LIBRARY" digest="sha256:b1df9b0635c42d7a335d0aa1ba95c23b41b6d22d6380a98027c6ddc52a9ebe49" -->

The existing model inventory and `prodshape impact` results were checked before writing this change. Neighbours ACT-MUSICIAN, BC-RECOVERY and TERM-LIBRARY supply unchanged context, not new actor/context/data definitions. LC-LIBRARY remains POPULATED: note edits/refused writes introduce no library-presence transition. Existing annotation, section, chord, repertoire, performance, offline and update scenarios remain owned by their existing tests. Backup import/replacement and unreadable-startup cases remain existing coverage, not this slice. PDF stays deferred under #13. No drift or Product Change is proposed.

## Impact

One test file, two browser journeys, existing report/CI discovery. Lighthouse retains ownership of #20–#28 implementation. This slice neither authenticates users nor qualifies future server persistence, hosting or physical devices.
