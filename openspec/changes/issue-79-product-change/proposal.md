<!-- pdac-scope: cited -->

# Native Android music with independent song and set exchange

## Why

Issue #79 asks for an installed Android music library that saves and reopens without login or a backend, and transfers complete editable songs and ordered sets between independent installations. The accepted model excludes native Android packaging, makes anonymous import a complete-library replacement, and reserves recoverable retention and acknowledged history for private service work. Those are not the requested native outcomes.

## Requested Product Intent

Add a native, device-authoritative journey alongside the existing web/private service. Preserve the full selected editor, piano, staff, song-sheet, phrase, reference and PDF outcomes rather than redefining the MVP as metadata-only CRUD. Native save acknowledges local durability. Native import always creates independent editable copies and preserves all existing destination music. Native songs and sets have revision history, recoverable deletion and distinct confirmed purge without login.

## Impacted Product Areas

- CON-PLATFORM: add Android installation while retaining the web application and its deployment boundaries.
<!-- pdac:cite id="CON-PLATFORM" digest="sha256:276120bdea8e88293e6843367e84966dacdad452cd568a124f64f73a24b529d5" -->
- CON-LOCAL-FIRST: distinguish native local authority from anonymous browser work and authenticated service authority.
<!-- pdac:cite id="CON-LOCAL-FIRST" digest="sha256:3dd07ade8d6c189ac4f9b29fcf0e51d7abc3a6fd1a1f6ab7093918f0c4484c0a" -->
- CON-SCOPE: remove the native Android exclusion only for the selected local journey; keep hardware/audio and unrelated exclusions.
<!-- pdac:cite id="CON-SCOPE" digest="sha256:a69dd93c94d43ee6fe15eee09c94b68a5ac6f96cdd6f435627c3f790b707f664" -->
- BR-IDENTITY: add native song/set retention and graph-wide independent-copy identity semantics without changing private ownership.
<!-- pdac:cite id="BR-IDENTITY" digest="sha256:d9c6607eb0cc984270a900d1889980f7515f3c1648f31efe56ceb9f3818e0352" -->
- BR-BACKUP: add selected native copy import rather than browser replacement, with complete dependencies and PDF bytes.
<!-- pdac:cite id="BR-BACKUP" digest="sha256:6e01f0285df7783f48eb0c482fa31f490f09e97e0f67a3a5fb3261dc1d1ed29c" -->
- BR-DURABILITY and FR-PERSIST: add acknowledged native revisions/history and atomic selected-scope import with attachment completeness; retain all service obligations.
<!-- pdac:cite id="BR-DURABILITY" digest="sha256:d822f18f163b8685937ae5a3137dc04ef4a2d5947ab7a9954245bd965b72fa45" -->
<!-- pdac:cite id="FR-PERSIST" digest="sha256:19c3bdee25cf34e4b6c6742a5da9a3c8905ba657d9056227fa0180474ed9b5e3" -->
- FR-BACKUP and UC-BACKUP: express the complete selected native transfer interaction and observable refusal/retry cases while preserving browser and private-service flows.
<!-- pdac:cite id="FR-BACKUP" digest="sha256:57286bb21b4c895afe8d7831630bec01797580be96efa5fb5a321e9822dca7e1" -->
- UC-REPERTOIRES and FR-REPERTOIRES: retain non-owning membership and add native ordered-set history, deletion, restore and purge.
<!-- pdac:cite id="FR-REPERTOIRES" digest="sha256:dcba63d54b9537950221b434cc50236f2aa2e4cdb1e53a229891b757e440f70f" -->
- BR-ACCESS and BR-SESSION: explicitly scope account/session obligations to existing private service content, not native local authority. BC-RECOVERY, TERM-LIBRARY and TERM-BACKUP: name the additional acknowledgement boundary and distinguish native transfer from browser replacement. These are contextual edits, not deletion of existing account rules.

- UC-PERSIST, UC-SONGS and FR-SONGS: distinguish native local create/save/reopen/history/delete/restore/purge from existing private session flows.
- LC-LIBRARY: preserve states and transition IDs while admitting native independent-copy import, retained deletion and local restore. The private LC-SONG-RETENTION remains unchanged.
- QR-INTEGRITY: qualify actual native local durability and independent-installation exchange alongside existing service recovery.
- Focused native structured behaviours cover genuine active-library transitions and set retention outcomes without inventing a retention lifecycle.

- JRN-PREPARE-PERFORM: add the explicit native no-login, history and complete independent-exchange branch while preserving web/private preparation.
- QR-READABILITY: retain web CSS measurements and qualify native 48dp touch targets, actual Compose views, font scale, TalkBack, focus, insets and back navigation separately.

## Neighbours Checked and Left Out

- LC-SONG-RETENTION, SB-SONG-DELETE, SB-SONG-RESTORE, SB-SONG-PURGE and SB-SONG-RETAIN describe explicitly private song recovery and fresh online ownership. Keep those private examples and lifecycle unchanged; the native rule adds a distinct local context rather than weakening them.
<!-- pdac:cite id="LC-SONG-RETENTION" digest="sha256:afaa64e4767b42ed87d8e40e2b031b598952708b18bacb182a0b8e4dfa502d48" -->
- LC-SONG-RETENTION keeps its explicitly private scope and fresh-online owner checks. LC-LIBRARY is modified only in context semantics: retained deletion is not active presence and native import never authorizes IMPORT-EMPTY replacement.
- BR-PDF, UC-PDF and the PDF attachment/navigation/rejection outcomes remain the consultation contract. New transfer completeness belongs to BR-BACKUP and FR-BACKUP; it is not a claim that a renderer or attachment publisher is implemented.
<!-- pdac:cite id="BR-PDF" digest="sha256:e83f0e00285008ae9c61789b2bc7ed7ec700368aaa55dda2d7323966d5b0e8cb" -->
- BR-REFERENCES and FR-REFERENCES preserve safe external links and their connectivity limits; exporting a link does not promise its remote bytes offline.
- BR-EDIT-GUARD, BR-STRUCTURE, BR-CHORDS, LC-STRUCTURE and SB-SECTION-REORDER retain edit admission, valid musical structure and stable identity. No native exception weakens them.
- FR-SONG-SHEET, FR-PIANO-SCORE and FR-PHRASE-REFERENCE retain the finite musical acceptance outcomes, including exact hand/register semantics, lyrics and phrase associations. Platform delivery is new, not product permission to discard fields.
- FR-OFFLINE, UC-OFFLINE and QR-OFFLINE retain their existing browser/private obligations. New native local authority is specified separately in CON-LOCAL-FIRST, FR-PERSIST and UC-PERSIST. It does not inherit an account lease, browser origin replacement or a promise of offline external targets. Native flows and integrity comparisons are added explicitly to FR-SONGS, UC-SONGS, UC-PERSIST and QR-INTEGRITY.
- ACT-MUSICIAN, BC-LIBRARY, BC-SKETCH, TERM-REPERTOIRE, existing membership/reminder behaviours, CON-CONTENT retain actor, non-owning membership and synthetic-content meaning; QR-READABILITY is modified for native measurements without weakening readability. SB-REPERTOIRE-DELETE remains an active-removal example, not a promise to erase retained native history.

## Clarification Report

The pinned evidence inventory has no unavailable product reports. Unresolved AND-00..AND-07 and AND-G identifiers are delivery-stage/guardrail names, not missing product artifacts. Graph candidates assist review; none grants new scope.

| Priority / changed node | Neighbour and relationship | Polarity / classification | Mechanical reason and disposition |
| --- | --- | --- | --- |
| P1 CON-PLATFORM, CON-LOCAL-FIRST, CON-SCOPE | BC-LIBRARY, BC-RECOVERY, BC-SKETCH via applies-to; FR-PERSIST/FR-OFFLINE via derived-from | governance/dependency; affected | Platform/authority changes reach every library/recovery operation. Update the shared contextual constraints and native acknowledgement obligations; keep instrument-agnostic musical rules. |
| P1 BR-IDENTITY | LC-SONG-RETENTION via transitions[].governed-by; FR-SONGS via derived-from; UC-REPERTOIRES via governed-by | dependency; private lifecycle checked and unaffected, native set interaction affected | Private online recovery cannot become an Android login requirement. Keep explicitly private lifecycle examples, add local retention semantics and native set cases. |
| P1 BR-BACKUP | FR-BACKUP via derived-from; UC-BACKUP via governed-by; LC-LIBRARY via transitions[].governed-by | dependency; transfer interaction affected, presence topology preserved, transition context affected | Native copy import must not invoke browser replacement or fabricate another state. Keep empty-library validity and existing transitions; never remove unrelated destination songs. |
| P1 BR-DURABILITY | FR-PERSIST/FR-BACKUP via derived-from; SB-PERSIST-FAILURE via illustrates | dependency; requirements affected, existing failure outcome checked and unaffected | Native local acknowledgement and selected-set atomicity need explicit scope. Preserve old service and independent-resource boundaries, add whole-selected-graph native acknowledgement. |
| P2 BR-ACCESS, BR-SESSION | private retention lifecycle governance and FR-PERSIST/FR-BACKUP derivation | governance/dependency; contextual scope affected | Fresh online capability/lease rules remain mandatory for service-owned work, never for independent native local history. No blanket account-rule deletion. |
| P2 FR-REPERTOIRES, UC-REPERTOIRES | SB-REPERTOIRE-DELETE via verification/illustrates; TERM-REPERTOIRE via uses-terms | dependency; native interaction affected, song non-ownership checked and unaffected | Recoverable set removal/purge cannot cascade into songs. Ordered historical membership restore validates currently available dependencies. |
| P2 BC-RECOVERY, TERM-LIBRARY, TERM-BACKUP | BR-BACKUP/BR-DURABILITY via uses-terms; library terms via defined-in | dependency; affected | Existing definitions otherwise omit device-authoritative native history or imply universal replacement. Add a named native boundary without redefining service acknowledgement. |
| P2 native PDF transfer | BR-PDF to UC-PDF/SB-PDF-ATTACH via governed-by/illustrates; BR-REFERENCES | dependency; consultation checked and unaffected, transfer affected | Required owned bytes and integrity references travel; links remain links. Unsupported/incomplete content refuses before activation. |
| P3 native musical acceptance | FR-SONG-SHEET, FR-PIANO-SCORE, FR-PHRASE-REFERENCE and structure/chord/edit rules | dependency; checked and unaffected | The owner preserves these outcomes. No new hardware, transcription, account collaboration or UI redesign semantics are selected. |

Independent semantic review identified missing native contexts in song/persistence flows, library restoration and integrity qualification. This operator revision corrects those findings and adds native structured transition examples. The manifest records each derived unaffected edge with the exact candidate and changed-cause digests and an individual semantic reason. Provider overlay validation and exact-candidate review remain separate gates.

## Refinement pass

Native attempt [44920581717](https://github.com/juangcarmona/scoremap/actions/runs/44920581717) failed during evidence collection at its fixed ten-minute planning deadline. Its completed patch event contained a complete proposal; the failed attempt published no finalized result, PR, approval or apply receipt. This operator-authored revision starts from that recovered proposal, corrects the independent review findings and uses the owning ProductShape integration for deterministic validation and apply. It does not represent a successful native producer run or reuse its authorization binding.

Recovered source: nineteen proposed files from successful tool-call event `call_81115efa43d14ba8991cb99d917127eb`, candidate SHA-256 `f53fe6f17979d0f9d581f172872242187d387df24f43cd86c1c4f839b8f71abd`. Accepted model baseline: `30d4d7d88f27e6d390ffbc2d80ac27a5e8fc5a8e`. Private diagnostic records remain outside Git. The owner has delegated implementation, necessary MVP product decisions and integration; each concrete operator decision must state that delegation rather than imply personal inspection by the owner.

Verified decision sources are owner answers 7063466116 and 7064948674. Their claims of delegation do not establish approval of this exact delta. Relevant answers retained verbatim:

> **Answer to the current collision question: C — always create an independent editable local copy.** Never overwrite or merge existing destination music implicitly. Remap identities consistently across the imported song/set graph and preserve ordered membership and every supported musical field and association. Preview the proposed import and allow cancellation. A deliberately repeated import may create another independent copy; retry/reconciliation of the same interrupted command must not duplicate a committed result.

> **Local history:** retain the acknowledged revisions of local songs and sets, with inspect/restore producing a new revision and preserving intervening history. No automatic expiry. Explicit deletion is a separate deliberate action. Export/share the selected current acknowledged musical revision, with source revision/provenance metadata; do not share the device's private revision history implicitly. Imported content begins an independent destination history.

> **Local authority and coexistence:** the installed Android app owns its device-local durable library and works without login or a backend. Keep existing web/private-service behavior and its authorization/session/retention rules in their existing context. No live synchronization, account claim or retirement of the web service is required by this native MVP.

> Choose recoverable native deletion. Deleting a local Android song removes it from active use and active set memberships while retaining its complete owned musical content, owned PDF attachments and acknowledged revision history until a separate, explicitly confirmed permanent purge. No automatic expiry or age-based purge. Other songs, surviving sets and independently owned reusable resources remain unchanged.

> Restore retains the song/content identities and creates a new acknowledged revision while preserving intervening history; do not silently recreate former set memberships. Purge is a distinct destructive confirmation naming the deleted item and explaining that its retained live content/history cannot then be restored. Preserve a non-content command/purge receipt so stale commands or restore retries cannot resurrect the purged identity; a deliberate independent imported copy remains a different identity. Do not promise to erase existing exported copies.

> Apply the same recoverable-delete / separately confirmed purge principle to native sets and their own ordered-membership history. Removing or purging a set never deletes its songs or independently owned resources. Restoration must validate the current graph; if a required song/resource has been permanently removed, disclose the missing dependency and refuse an invalid or partial restore without changing the durable library. Do not silently invent or resurrect missing content.

The other supplied decisions select complete supported dependency copying, owned PDF bytes/integrity, explicit external links, refusal of incomplete/oversized/unknown capabilities, local preferences and runtime hardware authority remaining local, and atomic qualified attachment publication. They remain obligations, not optional acceptance deferrals.

Ambiguity comparison: overwrite/update/merge versus independent copy is resolved in favour of copy; private history transfer versus current acknowledged revision is resolved in favour of current content only; destructive delete versus recoverable delete is resolved in favour of recoverable delete and separate purge; login/service authority versus standalone authority is resolved in favour of native local authority with service coexistence. No parked product question remains. Native implementation, store distribution, signing, toolchain qualification and physical-device evidence are delivery work, not new product permission.

The owning provider passed the exact overlay with zero diagnostics. Participating semantic review and coordinator cross-review resolved the reported findings; the operator recorded the exact decision under the existing owner delegation and ran the provider dry-run and actual apply. See [decision](../../../docs/evidence/android/product-decision.json) and [apply receipt](../../../docs/evidence/android/product-apply.json). Source integration and the fresh native parent refinement follow separately. Toolchain, architecture enforcement, stacked PRs and native child-controller actions remain delivery work. No physical tablet qualification is claimed.

Readiness: the native Product Change is provider-applied on this working branch. Required checks, exact-head integration review, merge and fresh native parent refinement remain separate gates; no Android product code or device acceptance is claimed.

## Applied baseline bindings for modified artifacts

These owning-provider payloads bind this current consumer to the applied baseline. The exact reviewed pre-apply candidate is pinned separately in the operator decision receipt; these refreshed bindings do not rewrite that historical decision.

- BC-RECOVERY: applied native context with its existing browser/private branch preserved.
<!-- pdac:cite id="BC-RECOVERY" digest="sha256:c204b417688c830c0131bd0d4843fae88a2d76880f4fe8d985d67314471cc1a0" -->
- BR-ACCESS: applied native context with its existing browser/private branch preserved.
<!-- pdac:cite id="BR-ACCESS" digest="sha256:9b679c2f86bdff7fc86ae00f0669e3a76023c3579895249dd21bbb3d617494a9" -->
- BR-BACKUP: applied native context with its existing browser/private branch preserved.
<!-- pdac:cite id="BR-BACKUP" digest="sha256:6e01f0285df7783f48eb0c482fa31f490f09e97e0f67a3a5fb3261dc1d1ed29c" -->
- BR-DURABILITY: applied native context with its existing browser/private branch preserved.
<!-- pdac:cite id="BR-DURABILITY" digest="sha256:d822f18f163b8685937ae5a3137dc04ef4a2d5947ab7a9954245bd965b72fa45" -->
- BR-IDENTITY: applied native context with its existing browser/private branch preserved.
<!-- pdac:cite id="BR-IDENTITY" digest="sha256:d9c6607eb0cc984270a900d1889980f7515f3c1648f31efe56ceb9f3818e0352" -->
- BR-SESSION: applied native context with its existing browser/private branch preserved.
<!-- pdac:cite id="BR-SESSION" digest="sha256:ef810362632ea22983eed6cfcdb6adfafb1d37497623582d64c0bc7c349e7bc2" -->
- CON-LOCAL-FIRST: applied native context with its existing browser/private branch preserved.
<!-- pdac:cite id="CON-LOCAL-FIRST" digest="sha256:3dd07ade8d6c189ac4f9b29fcf0e51d7abc3a6fd1a1f6ab7093918f0c4484c0a" -->
- CON-PLATFORM: applied native context with its existing browser/private branch preserved.
<!-- pdac:cite id="CON-PLATFORM" digest="sha256:276120bdea8e88293e6843367e84966dacdad452cd568a124f64f73a24b529d5" -->
- CON-SCOPE: applied native context with its existing browser/private branch preserved.
<!-- pdac:cite id="CON-SCOPE" digest="sha256:a69dd93c94d43ee6fe15eee09c94b68a5ac6f96cdd6f435627c3f790b707f664" -->
- FR-BACKUP: applied native context with its existing browser/private branch preserved.
<!-- pdac:cite id="FR-BACKUP" digest="sha256:57286bb21b4c895afe8d7831630bec01797580be96efa5fb5a321e9822dca7e1" -->
- FR-PERSIST: applied native context with its existing browser/private branch preserved.
<!-- pdac:cite id="FR-PERSIST" digest="sha256:19c3bdee25cf34e4b6c6742a5da9a3c8905ba657d9056227fa0180474ed9b5e3" -->
- FR-REPERTOIRES: applied native context with its existing browser/private branch preserved.
<!-- pdac:cite id="FR-REPERTOIRES" digest="sha256:dcba63d54b9537950221b434cc50236f2aa2e4cdb1e53a229891b757e440f70f" -->
- FR-SONGS: applied native context with its existing browser/private branch preserved.
<!-- pdac:cite id="FR-SONGS" digest="sha256:77823d9d26f9d5aa3f2fedb540d015a16b2aadc76c1eb2836824b7bb255ec739" -->
- JRN-PREPARE-PERFORM: applied native context with its existing browser/private branch preserved.
<!-- pdac:cite id="JRN-PREPARE-PERFORM" digest="sha256:5fb58bbe487dcaa26e1b8403a5cfbf7349751924e202b08a2e5cd2b587342aa7" -->
- LC-LIBRARY: applied native context with its existing browser/private branch preserved.
<!-- pdac:cite id="LC-LIBRARY" digest="sha256:87592e7d48ad80b922f219f370fee009668a74146f83cbb2f159e16752fbdda5" -->
- QR-INTEGRITY: applied native context with its existing browser/private branch preserved.
<!-- pdac:cite id="QR-INTEGRITY" digest="sha256:efafc9b7b32a7ff39fdb822f04ef46def7c7534b84b2e48a606fce99bea603e6" -->
- QR-READABILITY: applied native context with its existing browser/private branch preserved.
<!-- pdac:cite id="QR-READABILITY" digest="sha256:7139af1523273cf318b98b0f01da8688627c1a747f656b10017dcd3f0424c4af" -->
- TERM-BACKUP: applied native context with its existing browser/private branch preserved.
<!-- pdac:cite id="TERM-BACKUP" digest="sha256:2b96703caa8e0dde2824a37f28ceafe715826a8aa4fdd43a55c3b1b64ee79a81" -->
- TERM-LIBRARY: applied native context with its existing browser/private branch preserved.
<!-- pdac:cite id="TERM-LIBRARY" digest="sha256:bdb900be33ca4f27b023de6fa19bae13e19ca99c8596ac98a8c7f77def61005a" -->
- UC-BACKUP: applied native context with its existing browser/private branch preserved.
<!-- pdac:cite id="UC-BACKUP" digest="sha256:ce5f43fc20dbe7e1482447d0334509c00460c28f84e33b3e8aacfcc2e4cbeb9a" -->
- UC-PERSIST: applied native context with its existing browser/private branch preserved.
<!-- pdac:cite id="UC-PERSIST" digest="sha256:ea669e891adfc7641a2cf80bd5cd198d3909ee2fd6424c505a7cf991314c602f" -->
- UC-REPERTOIRES: applied native context with its existing browser/private branch preserved.
<!-- pdac:cite id="UC-REPERTOIRES" digest="sha256:a4029a0536cb5625adbc26301cb71c6e057ead00282f7a00e416d34ddb5aae1f" -->
- UC-SONGS: applied native context with its existing browser/private branch preserved.
<!-- pdac:cite id="UC-SONGS" digest="sha256:9230de84fe0d6cbbe62e7f5bc23c9118bf5e425dcda62bfd8b9c9312cd81e4c5" -->

## Open Questions for the Product Owner

None.
