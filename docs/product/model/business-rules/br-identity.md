---
id: BR-IDENTITY
type: business-rule
title: Stable identity and context-specific recoverable ownership
status: draft
applies-to: [BC-LIBRARY]
uses-terms: [TERM-SONG, TERM-LIBRARY, TERM-REPERTOIRE]
---

## Rule

Song, repertoire, section and all newly identified musical objects have stable unique opaque identities. Membership includes each existing active song at most once. Removing a repertoire from active use removes only its active memberships, never its songs. Reordering changes position only and retains identified content, chords, notes, repeats and associations. Private-service identity/capability checks also govern operations in otherwise unchanged membership, reminder, reference and attachment capabilities.

Existing anonymous browser song deletion removes its memberships and owned current data under its existing local boundary. Private-service deletion requires current owner authorization, edit admission and expected revision. Its acknowledged atomic result removes the song from active lists, repertoire memberships and consultation, moves all song-owned arrangements/events/attachments and history into recoverable deletion, and invalidates collaborative grants. Other songs and independently owned reusable resources remain unchanged. No age-based purge occurs. Deleted private-service song content/history is accessible only to its current owner after fresh online authorization; former editor/viewer grants provide no trash access.

Private-service owner restore retains song/content identities, validates current revision and all references, and creates a new acknowledged revision. It does not restore former grants or repertoire memberships. Identity/revision conflicts refuse atomically while preserving retained recovery data. Private-service purge is a distinct owner-confirmed destructive action naming the song and irreversibility. It atomically removes all retained song-owned content/history from the live application while preserving independently owned reusable resources. A non-content purge receipt prevents stale commands, restore and protected pending replay from resurrecting that identity. Lost responses and concurrent delete/restore/purge reconcile by command identity and current revision without partial deletion or duplicate resurrection.

For native Android local songs and sets, deletion is recoverable and local, without login or backend. Delete removes the item from active use; deleting a song also removes its active set memberships. Retain its complete owned musical content, owned PDFs and acknowledged history until a separate explicitly confirmed permanent purge. Retain a deleted set's own ordered-membership history without deleting its songs. No automatic expiry or age-based purge occurs. Preserve unrelated songs, surviving sets and independently owned reusable resources; membership changes caused by song deletion are part of its acknowledged atomic boundary and the affected set's retained history.

Native local history inspection is a read without mutation. Native restore validates the current complete graph and expected revision, retains song/set/content identities, and creates a new acknowledged revision while preserving intervening history. Song restore never silently recreates former set memberships. A set restore uses its retained ordered membership only when the referenced songs/resources are currently valid; missing, deleted or permanently removed required dependencies are disclosed and an invalid or partial restore is refused without changing durable data. Never invent or resurrect a missing dependency.

Native purge is a separate destructive confirmation naming the deleted item and explaining that its retained live owned content/history will no longer be restorable. Purging a set never deletes songs or independently owned resources. Retain a non-content command/purge receipt to prevent stale commands, old history or restore retries from resurrecting the same identity. A deliberately imported independent copy is a new identity, not a reversal of purge. Native delete, restore and purge enforce edit mode, current expected revision and domain invariants and acknowledge one atomic result with a stable retry receipt. Failed/stale/cancelled commands preserve prior durable data; an ambiguous response reconciles the same command before repeating an effect.

Deletion is not erasure. Previously downloaded exports, unobserved offline copies and operator backups cannot be promised instantly erased. Private-service backup restoration must reconcile deletion/purge records and current authorization before admitting restored content; it cannot silently republish deleted data. Native restore/replay likewise respects local purge receipts; independent-copy import never reuses the purged destination identity.

## Rationale

Preserve stable associations and accidental-deletion recovery without disguising retention, granting former collaborators access or imposing a service session on local music.

## Examples

Deleting the final private-service song yields an empty active library with owner-only retained history. Restoring it does not grant access to its former editor. Deleting the final native local song also leaves an empty active library but retains complete local recovery until confirmed purge, without an online check. Restoring a deleted native set whose required song has been purged refuses without a partial set.

## Exceptions

No implicit cascading deletion of independently owned voicings/instruments. Anonymous-browser library preservation on session cleanup remains mandatory. Native recoverable deletion does not retroactively change anonymous-browser current-data deletion.
