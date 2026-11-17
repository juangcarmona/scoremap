---
id: BR-IDENTITY
type: business-rule
title: Stable identity and recoverable ownership
status: draft
applies-to: [BC-LIBRARY]
uses-terms: [TERM-SONG, TERM-LIBRARY]
---

## Rule

Song, repertoire, section and all newly identified musical objects have stable unique opaque identities. Membership includes each existing active song at most once. Deleting a repertoire removes only memberships. Reordering changes position only and retains identified content, chords, notes, repeats and associations. Private identity/capability checks also govern operations in otherwise unchanged membership, reminder, reference and attachment capabilities.

Anonymous song deletion removes its memberships and owned current data under the existing local boundary. Private deletion requires current owner authorization, edit admission and expected revision. Its acknowledged atomic result removes the song from active lists, repertoire memberships and consultation, moves all song-owned arrangements/events/attachments and history into recoverable deletion, and invalidates collaborative grants. Other songs and independently owned reusable resources remain unchanged. No age-based purge occurs. Deleted-song content/history is accessible only to its current owner after fresh online authorization; former editor/viewer grants provide no trash access.

Owner restore retains song/content identities, validates current revision and all references, and creates a new acknowledged revision. It does not restore former grants or repertoire memberships. Identity/revision conflicts refuse atomically while preserving retained recovery data. Purge is a distinct owner-confirmed destructive action naming the song and irreversibility. It atomically removes all retained song-owned content/history from the live application while preserving independently owned reusable resources. A non-content purge receipt prevents stale commands, restore and protected pending replay from resurrecting that identity. Lost responses and concurrent delete/restore/purge reconcile by command identity and current revision without partial deletion or duplicate resurrection.

Deletion is not erasure. Previously downloaded exports, unobserved offline copies and operator backups cannot be promised instantly erased. Backup restoration must reconcile deletion/purge records and current authorization before admitting restored content; it cannot silently republish deleted data.

## Rationale

Preserve stable associations and accidental-deletion recovery without disguising retention or granting former collaborators access.

## Examples

Deleting the final private song yields an empty active library with owner-only retained history. Restoring it does not grant access to its former editor.

## Exceptions

No implicit cascading deletion of independently owned voicings/instruments. Anonymous-library preservation on session cleanup remains mandatory.
