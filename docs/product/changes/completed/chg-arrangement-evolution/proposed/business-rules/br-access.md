---
id: BR-ACCESS
type: business-rule
title: Current private resource capabilities
status: draft
applies-to: [BC-LIBRARY, BC-SKETCH, BC-RECOVERY]
uses-terms: [TERM-PRINCIPAL, TERM-SONG]
---

## Rule

Private songs are private by default. Derive identity/ownership from the trusted authenticated principal, never submitted ownership or a global role. Every operation, including direct application calls, lists, nested resources, attachments, custom song resources, history/export and writes, requires current resource-scoped authorization. Knowing an ID grants nothing. Independently owned personal presets/configurations/preferences remain accessible only to their owner; applying a copied preset to a song exposes only that song's copy under its grants.

| Capability on active song and its owned children | Owner | Editor | Viewer | Outsider/disabled/no session |
| --- | --- | --- | --- | --- |
| Read/consult | yes | yes | yes | no |
| Read active-song revision history/export authorized musical content | yes | yes | yes | no |
| Change music, form, arrangements and owned configuration | yes | yes | no | no |
| Restore an active historical revision as a new revision | yes | yes | no | no |
| Manage grants, delete song | yes | no | no | no |
| List/read deleted content, restore deleted song, confirm purge | yes with fresh online check | no | no | no |

Only owners manage song-scoped grants. No client-controlled escalation or ownership transfer is introduced. Edit admission, domain validity and expected revision remain additional write guards. Grant changes serialize with writes and revoke invalidates collaborative access; new operations use current permissions, not stale UI/token/cache roles. Observed revocation/disablement locks existing private views immediately. Disconnected revocation detection is bounded by BR-SESSION, not instantaneous; retention never grants access. Unauthorized operations disclose no private content and do not mutate or perform a lifecycle transition.

## Rationale

Ingress protection and hidden controls cannot enforce private musical ownership.

## Examples

Independent owner B cannot read A's guessed event/history/export IDs. A viewer may consult but cannot save; a former editor cannot read deleted history.

## Exceptions

Anonymous local work has no private account grant; its later claim remains explicit and non-destructive.
