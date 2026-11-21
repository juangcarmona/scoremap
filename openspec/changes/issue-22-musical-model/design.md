<!-- pdac-scope: cited -->
# Preserve legacy music while introducing identified occurrences

## Decisions
Use the accepted BR-CHORDS catalogue as the complete finite authority. Reuse pinned Tonal note/interval and chord detection primitives behind a product-owned adapter, registering only the accepted 172 definitions under private aliases and filtering all provider output. The default provider thirteenth omits the required eleventh; its dictionary cannot define product semantics. Independent fixtures and cross-language catalogue checks govern correctness.

A v2 song marks its format explicitly. Shared sections retain their ordered chord occurrence collection for compatibility; v2 occurrences add independent IDs, measure references and exact rational position/duration to their harmonic identity. Section-owned measures carry meter and length. Arrangements own independent parts, exact-pitch note events, voicing groups and physical binding configuration. Theory never implies performed octave or device assignment.

Libraries may hold supported legacy songs and explicit v2 songs without silently rewriting an inaccessible collaborator's song. The library envelope advertises the required supported version. Migration of one song is a declared song boundary: preserve legacy IDs/content/order/repeats; map array entries to generated stable event IDs and consecutive quarter-note positions in default 4/4 measures; create one default arrangement and one unassigned part with no performed notes/bindings. Record the generated mappings. Version-1 import explicitly migrates the imported scope after confirmation; source files remain retained.

Local activation writes a pre-migration complete source recovery copy and mapping with the new library in one IndexedDB transaction. Private activation preserves the immutable raw source revision in service history, records mapping/provenance and acknowledges only the complete conditional transaction. Fresh private imports retain their validated source before the first upgraded revision. Retry reuses the committed receipt/mapping rather than duplicating events. A compatibility marker prevents an older runtime from starting over stored richer content. Unknown/corrupt versions or failed activation preserve prior durable data.

Harmonic events cannot overlap. Rational arithmetic compares exact integer fractions without floating drift; positions/durations stay within their measure. Performed pitch spelling/octave/absolute value must agree within 0..127. Voicings may omit tones; incompatible performed tones require explicit custom reconciliation and never rewrite harmony. Every reference is scoped to the owning song/arrangement/part and confirmed destructive reconciliation lists affected references. No maximum of three parts/devices is introduced.

## Pending UI boundary
This change provides a reachable upgrade/basic editing path and safe round trips. The integrated exact-pitch builder, reusable preset interaction and all requested split/layer/keyboard views are completed in #23/#24 without weakening these invariants. Full richer SB fixtures remain pending until those actual journeys exist.

<!-- pdac:cite id="FR-CHORDS" digest="sha256:4da1a2f14b722446609a1fca78c027c682d149ecbef18a835eb561f6050f1ae4" -->
<!-- pdac:cite id="FR-SECTIONS" digest="sha256:a8314412962608a99effe44d9872f7c8261e039e75182e25d111b353609dc95b" -->
<!-- pdac:cite id="BR-CHORDS" digest="sha256:543566a20181aa25eab6cc446d8ac467b1ca911632744dd957a0ab3388e9d55c" -->
<!-- pdac:cite id="BR-STRUCTURE" digest="sha256:db3410bd8a3fe7f3da94e63ee8804b1c75f03b8f7dd1e7858cfd05aed03a0686" -->
<!-- pdac:cite id="BR-BACKUP" digest="sha256:6e01f0285df7783f48eb0c482fa31f490f09e97e0f67a3a5fb3261dc1d1ed29c" -->
<!-- pdac:cite id="BR-DURABILITY" digest="sha256:d822f18f163b8685937ae5a3137dc04ef4a2d5947ab7a9954245bd965b72fa45" -->
<!-- pdac:cite id="BR-EDIT-GUARD" digest="sha256:20e678c4743404c64a51c01e4446026ac95811827d2f5e1c641839291ad32718" -->
<!-- pdac:cite id="BR-ACCESS" digest="sha256:9b679c2f86bdff7fc86ae00f0669e3a76023c3579895249dd21bbb3d617494a9" -->
