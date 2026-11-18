---
id: UC-BACKUP
type: use-case
title: Transfer complete data and explicitly claim local work
status: draft
primary-actor: ACT-MUSICIAN
bounded-context: BC-RECOVERY
governed-by:
  - BR-BACKUP
  - BR-DURABILITY
  - BR-EDIT-GUARD
  - BR-IDENTITY
  - BR-STRUCTURE
  - BR-CHORDS
  - BR-ACCESS
  - BR-SESSION
uses-terms:
  - TERM-BACKUP
  - TERM-LIBRARY
  - TERM-ATTACHMENT
  - TERM-SONG
  - TERM-ARRANGEMENT
  - TERM-EVENT
  - TERM-VOICING
  - TERM-PRINCIPAL
---

## Goal

Export and reconstruct the complete declared musical scope through a documented versioned portable envelope, or explicitly claim selected anonymous work into a private library without loss, silent overwrite or imported authority.

## Trigger

The musician requests export, selects a backup for import, or requests claim of selected retained anonymous work. Export, replacement, private import and claim are separate interactions, not one compound command.

## Preconditions

The chosen source is readable and retained unchanged until the declared operation succeeds. Existing targets resolve. Private source reads/exports and destination actions require real authentication and current scoped capabilities; deleted content requires the current owner's fresh online authorization. Content mutations additionally require edit admission, complete valid data and expected revisions. Imported owners/grants cannot satisfy authorization. The selected destination supports the envelope version and every included capability, or refuses before activation.

## Main Flow

1. The musician selects the operation and its explicit musical scope. The product identifies anonymous complete-library replacement separately from bounded private song import/claim and separately owned personal resources/preferences.
2. For export, the product checks current source authority and prepares the complete versioned envelope for that scope, including identity/order, shared form, timing/repeats, spelled harmony, exact performed pitches, independent arrangements/parts/voicings, optional hands, device/range/layer/sound bindings, memberships, reminders/references and supported attachments with required bytes. Owned preference/preset/configuration scope and copied version provenance remain explicit. Exclude credentials, usable sessions/access material and authority-conferring grants. Export does not mutate source content or turn pending work into an acknowledged save.
3. For import/claim, the product validates the entire proposed scope and references before activation. It presents destination effects, replacement boundaries, supported migrations and any collisions for explicit confirmation. Anonymous replacement names that it replaces the complete local library; private claim/import never silently replaces the account library.
4. For private claim/import, derive destination ownership from the trusted current principal. Refuse colliding identities before mutation and offer an explicit copy-as-new preview with consistently remapped internal associations. Confirmation selects the exact mapping and content, never imported authority.
5. After confirmation, recheck applicable capability, edit admission, complete validity and expected revisions. Acknowledge each declared complete commit boundary only after durability. Principal-bound operation receipts make retry/reconciliation idempotent; separately owned personal resources/preferences have separate receipts. Report exact partial progress for multi-boundary work, not false total success.
6. Verify authorized reconstruction of claimed private content before offering explicit removal of its anonymous source. Until then retain that source. Session cleanup cannot erase it. Provide the actual result and receipts without claiming a device/service transaction.

## Alternative Flows

- A supported empty anonymous backup is a valid explicitly confirmed complete replacement, producing EMPTY library presence. A nonempty replacement produces POPULATED. Preserve the existing IMPORT-EMPTY and IMPORT-POPULATED identities for these actual commands.
- A supported v1 import preserves existing song/repertoire/section/membership/reminder/reference identities, ordering, repeats and triad spelling. Apply BR-STRUCTURE's explicit timing/default-arrangement rules without inventing performed notes from theoretical diagrams. Preserve a pre-migration recovery copy, record deterministic generated-ID mappings and reuse them on retry. Validate before atomic activation.
- Cancelling preview/confirmation leaves source and destination unchanged. Declining copy-as-new does not silently overwrite the collision.
- A committed claim/import with a lost response is reconciled by the original principal-bound receipt before retry; no duplicate songs or revisions are created.
- For a different origin, first explicitly export from the old origin. A new origin cannot read the old origin's retained local library. Moving the application does not itself migrate content.
- Restoring operator backups is distinct from the musician's portable transfer. Before restored private data becomes accessible, reconcile current authorization and deletion/purge records. Old exported data cannot resurrect a purged identity through restore/replay. Independently chosen copy-as-new remains an explicit new identity, not reversal of purge.
- Repeatable private transfer journeys use the same selected synthetic identity fixture and application configuration as manual real-login trials, with execution-scoped reset. This is not mocked authority or permission to reset an existing owner's work. Production refuses development defaults.

## Failure Conditions

Malformed data, duplicate identities/memberships, dangling associations, invalid musical values/timing/pitches, incomplete attachments, unsupported versions/capabilities and failed migration refuse before activation and preserve the original source and last durable destination. Unsupported attachment transfer is refused rather than silently stripped; this use case does not implement an independently pending renderer.

Performance mode refuses content import/claim. Missing current authority, forged owners/grants, unknown targets, stale revisions and identity conflicts cannot grant access or overwrite content. Transaction failure preserves the prior complete declared boundary; ambiguous responses are not proof of rollback. A multi-boundary failure identifies completed receipts and remaining work without falsely promising all-or-nothing across stores.

Session expiry, unknown authority and observed revocation lock private work and stop unauthorized export/replay. Retained pending data remains protected for same-principal online resource/revision revalidation and explicit reconciliation. A previous export right, cached role or retained record is not current authority. Refused commands make no lifecycle transition.

## Postconditions

The complete authorized declared scope is exported or durably reconstructed with its identities and musical meaning intact, or source and prior acknowledgement remain preserved with an actionable refusal/failure. Claim is explicit and non-destructive until verified recovery and a separate source-removal choice. No credential/authority transfer, silent merge, hidden cross-account assignment or instantaneous erasure of old exports/backups is implied. Local round trips alone do not attest remote recovery.
