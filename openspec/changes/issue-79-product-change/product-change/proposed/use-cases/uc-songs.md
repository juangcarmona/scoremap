---
id: UC-SONGS
type: use-case
title: Manage songs with scoped recoverable deletion and purge
status: draft
primary-actor: ACT-MUSICIAN
bounded-context: BC-LIBRARY
governed-by:
  - BR-IDENTITY
  - BR-EDIT-GUARD
  - BR-DURABILITY
  - BR-ACCESS
  - BR-SESSION
  - BR-STRUCTURE
uses-terms:
  - TERM-SONG
  - TERM-LIBRARY
  - TERM-ARRANGEMENT
  - TERM-PRINCIPAL
---

## Goal

Create, title, optionally attribute and manage personal songs, with private owner-controlled grants where applicable and a clear distinction between recoverable deletion, identity-preserving restoration and irreversible purge. Preserve independent songs, reusable resources and non-owning repertoire membership.

## Trigger

The musician requests a song creation/metadata action, an authorized grant action, deletion, a retained-content read under the applicable local or private authority, restore or distinct purge. Each is a separate command or read with its own result.

## Preconditions

The library is readable and existing target identities resolve. Titles are nonblank. Anonymous browser management uses its complete local boundary and requires no private account. Private reads require current scoped capability; private creation derives ownership from trusted real authentication. Every content mutation independently requires applicable current capability, edit admission, complete valid content/references and expected revision. In the private-service context only the current owner manages grants/deletes; deleted-content read/restore/purge requires that owner's fresh online authorization. Standalone native Android uses installation-local authority without login, network or backend; complete local song history and recoverable deletion do not grant access to any private-service resource. No submitted owner ID, imported grant, global role or known resource ID confers authority.

## Main Flow

1. The musician selects the intended song action and supplies valid values. The product identifies the declared anonymous browser, standalone native or private-service scope; private current capability is checked independently of visible controls.
2. For creation, assign stable opaque identity; in the private-service context derive ownership from the trusted principal. Create complete valid content without grants to independent principals. For metadata editing, change only the requested title/optional artist and preserve all musical content and associations.
3. For requested mutation, enforce applicable current capability, edit guard, complete validity and expected revision at the durable boundary. For private-service mutations serialize permission changes with mutation so a stale cached grant cannot admit a write after revocation.
4. Acknowledge only the complete durable result, preserving complete native local or private-service revision history and stable command receipt at that scope. Reconstruct and display the actual result without treating a device-only candidate as privately saved.

## Alternative Flows

- A valid first song changes active-library presence from EMPTY to POPULATED through CREATE-FIRST. Another creation uses CREATE and leaves POPULATED. Empty active libraries and repertoires without songs are valid. A membership refers to an existing active song at most once; deleting a repertoire removes memberships, not songs.
- A private owner-confirmed delete at the current revision atomically removes the song from active lists, repertoire memberships and ordinary consultation, retains all song-owned arrangements/events/attachments and complete history in DELETED retention, and invalidates collaborative grants. Other songs and independently owned reusable resources remain unchanged. Deleting the final active song uses library DELETE-LAST and leaves EMPTY; deleting one while others remain uses DELETE and leaves POPULATED. Anonymous deletion retains its existing current-data removal boundary, not an invented private history guarantee.
- A native current-revision confirmed delete atomically removes the song from active use and active set memberships while retaining its complete song-owned musical content, required PDF bytes and acknowledged history without automatic expiry. Preserve unrelated songs, surviving sets and independently owned resources. DELETE-LAST leaves EMPTY when no active songs remain; DELETE leaves POPULATED otherwise. Deleted-content/history inspection is offline and read-only.
- A native explicit restore of recoverably deleted valid content preserves song and owned-content identities, produces a new acknowledged revision preserving intervening history and never silently recreates former set memberships. Validate current references and expected revision before activation; refuse missing dependencies, identity conflict or purged identity without partial restoration or invented content.
- A native permanent purge requires its own destructive confirmation naming the deleted song and irreversibility. Confirmed purge atomically removes retained live song-owned content/history, preserves unrelated resources and a non-content receipt against stale-command or restore-retry resurrection. Cancellation preserves recovery. Previously exported files are not promised erased; a separately confirmed independent-copy import remaps identities under UC-BACKUP.
- The current owner requests a private deleted-content view after fresh online authorization. Return only that owner's retained scope; mere passage of time does not purge it. This read changes neither retention nor active-library presence and creates no revision. Former editor/viewer grants confer no trash/history access.
- The private owner explicitly restores valid DELETED content using current identity/revision checks. Preserve song and owned content identities, create a new acknowledged revision and return retention to ACTIVE. Active-library presence becomes POPULATED, whether it was EMPTY or POPULATED before the command. Do not restore prior grants or repertoire memberships. All references must be valid; restoration is not an independent-form duplication.
- The private owner requests permanent purge of a deleted song and receives a distinct destructive confirmation naming the song and irreversibility. Only explicit confirmation with fresh owner authorization, edit admission and expected revision admits purge. Atomically remove retained song-owned live content/history, preserve a non-content anti-resurrection receipt and enter PURGED. Preserve unrelated songs and independently owned presets/configuration. Declining confirmation changes nothing.
- Lost delete/restore/purge responses reconcile the original installation/resource/command receipt for native local work or principal/resource/command receipt for private work; retry does not duplicate effects. Concurrent commands against one revision serialize so incompatible stale work refuses without partial deletion or duplicate resurrection.
- Owners manage song-scoped grants. Editors may change active music and restore active history under BR-ACCESS; viewers may consult authorized active content/history/export but cannot mutate. Neither role may manage grants, delete, access deleted content, restore deleted songs or purge. Current owner/editor active-history restore creates a new revision without changing retention or library presence and without reviving obsolete grants.
- Real manual and automated private-song trials share one selected users fixture and one validated application configuration. Owner A, independent B, editor, viewer, disabled and outsider cases exercise actual resource permissions; setup/reset affects only execution-owned data. The first private checkpoint is connected, with persistent private offline access disabled and safe pending-work termination still required. Production rejects development identity/seed/persistence defaults.

## Failure Conditions

Blank titles, unknown identities, invalid references, conflicts, insufficient current capability and performance-mode mutations refuse without mutation or lifecycle transition. A failed atomic delete preserves the complete previous active content, grants, memberships and revision. A failed/conflicting restore preserves retained recovery data and the latest acknowledgement; no partial activation or overwrite occurs. A failed purge leaves the prior complete retained state rather than claiming irreversibility has occurred.

Outsiders, disabled principals and no-session requests cannot read private content or descriptive details. Former grants do not authorize trash/history; retained protected drafts do not authorize read/export/replay after revocation. Session expiry/unknown authority locks private views under BR-SESSION and preserves only protected principal-bound pending work for fresh same-principal online permission/revision checks and explicit reconciliation. No forced export, hidden discard or automatic replay is allowed. Original anonymous work is preserved.

Purge receipts prevent stale commands, old backups and retained drafts from resurrecting the purged identity. Operator restoration must reconcile deletion/purge and current authorization before exposing restored data. Recoverable deletion is not erasure; previously downloaded exports, unobserved offline copies and operator backups cannot be promised instantly erased.

## Postconditions

An admitted command produces one complete acknowledged result and its appropriate genuine presence/retention effects, or the prior complete durable state remains with an actionable refusal/failure. Native deletion retains complete local recovery without expiry; private deletion retains owner-only recovery. Restore keeps identity without silently restoring former grants/memberships; purge removes retained live content and prevents resurrection of that identity. Reading trash is not a transition. Musical form presence remains LC-STRUCTURE's independent EMPTY/ARRANGED distinction; no session/save/publishing states are introduced.
