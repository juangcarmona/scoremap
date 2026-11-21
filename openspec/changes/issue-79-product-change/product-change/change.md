---
id: CHG-ANDROID-NATIVE-LOCAL
type: product-change
title: Native Android local music and complete independent song and set exchange
status: applied
base-revision: 30d4d7d
operations:
  add:
    - SB-NATIVE-COPY-IMPORT
    - SB-NATIVE-SONG-CREATE
    - SB-NATIVE-SONG-DELETE
    - SB-NATIVE-SONG-RESTORE
  modify:
    - BC-RECOVERY
    - BR-ACCESS
    - BR-BACKUP
    - BR-DURABILITY
    - BR-IDENTITY
    - BR-SESSION
    - CON-LOCAL-FIRST
    - CON-PLATFORM
    - CON-SCOPE
    - FR-BACKUP
    - FR-PERSIST
    - FR-REPERTOIRES
    - FR-SONGS
    - JRN-PREPARE-PERFORM
    - LC-LIBRARY
    - QR-INTEGRITY
    - QR-READABILITY
    - TERM-BACKUP
    - TERM-LIBRARY
    - UC-BACKUP
    - UC-PERSIST
    - UC-REPERTOIRES
    - UC-SONGS
  remove: []
unaffected:
  - id: BR-PDF
    cause: BC-RECOVERY
    relationship: applies-to
    digest: &impact1 sha256:e83f0e00285008ae9c61789b2bc7ed7ec700368aaa55dda2d7323966d5b0e8cb
    cause-digest: &impact2 sha256:c204b417688c830c0131bd0d4843fae88a2d76880f4fe8d985d67314471cc1a0
    reason: &impact3 Local PDF ownership, bounded navigation, page memory and recoverable errors remain; complete portable bytes belong to the backup rule.
  - id: CON-CONTENT
    cause: BC-RECOVERY
    relationship: applies-to
    digest: &impact4 sha256:5c08415cc8047dfc3161440d4a427675c191cd7bfecef5d3c7bb139fe0a9752e
    cause-digest: *impact2
    reason: &impact5 User-authored music and synthetic public fixtures remain required; native exchange does not authorize shipping private/proprietary music.
  - id: BC-LIBRARY
    cause: BR-ACCESS
    relationship: applies-to
    digest: &impact6 sha256:ae6c307b94a4dfbe98ec1bee2eac14e2d1754b950f2bdd9e454c3431809f5bd4
    cause-digest: &impact7 sha256:9b679c2f86bdff7fc86ae00f0669e3a76023c3579895249dd21bbb3d617494a9
    reason: &impact8 Independent song identity and non-owning repertoire organization remain its responsibility; native authority adds no public catalogue.
  - id: BC-SKETCH
    cause: BR-ACCESS
    relationship: applies-to
    digest: &impact9 sha256:b22f7b77f262d51838dfcf3917347c5637b393f114d2fa2a0bd17618bb21707d
    cause-digest: *impact7
    reason: &impact10 Ordered form/reminders and no invented arrangements remain; Android packaging and file exchange do not redefine musical authorship.
  - id: BC-LIBRARY
    cause: BR-IDENTITY
    relationship: applies-to
    digest: *impact6
    cause-digest: &impact11 sha256:d9c6607eb0cc984270a900d1889980f7515f3c1648f31efe56ceb9f3818e0352
    reason: *impact8
  - id: BC-LIBRARY
    cause: BR-SESSION
    relationship: applies-to
    digest: *impact6
    cause-digest: &impact12 sha256:ef810362632ea22983eed6cfcdb6adfafb1d37497623582d64c0bc7c349e7bc2
    reason: *impact8
  - id: BC-SKETCH
    cause: BR-SESSION
    relationship: applies-to
    digest: *impact9
    cause-digest: *impact12
    reason: *impact10
  - id: BC-LIBRARY
    cause: CON-LOCAL-FIRST
    relationship: applies-to
    digest: *impact6
    cause-digest: &impact13 sha256:3dd07ade8d6c189ac4f9b29fcf0e51d7abc3a6fd1a1f6ab7093918f0c4484c0a
    reason: *impact8
  - id: BC-SKETCH
    cause: CON-LOCAL-FIRST
    relationship: applies-to
    digest: *impact9
    cause-digest: *impact13
    reason: *impact10
  - id: BC-LIBRARY
    cause: CON-PLATFORM
    relationship: applies-to
    digest: *impact6
    cause-digest: &impact14 sha256:276120bdea8e88293e6843367e84966dacdad452cd568a124f64f73a24b529d5
    reason: *impact8
  - id: BC-SKETCH
    cause: CON-PLATFORM
    relationship: applies-to
    digest: *impact9
    cause-digest: *impact14
    reason: *impact10
  - id: BC-LIBRARY
    cause: CON-SCOPE
    relationship: applies-to
    digest: *impact6
    cause-digest: &impact15 sha256:a69dd93c94d43ee6fe15eee09c94b68a5ac6f96cdd6f435627c3f790b707f664
    reason: *impact8
  - id: BC-SKETCH
    cause: CON-SCOPE
    relationship: applies-to
    digest: *impact9
    cause-digest: *impact15
    reason: *impact10
  - id: QR-OFFLINE
    cause: JRN-PREPARE-PERFORM
    relationship: applies-to
    digest: &impact16 sha256:a3c8b14e8eb2c0b1a419ec1a266cf50ff4d0b739936b2f6cf0c0cdfc7db38827
    cause-digest: &impact17 sha256:5fb58bbe487dcaa26e1b8403a5cfbf7349751924e202b08a2e5cd2b587342aa7
    reason: &impact18 Its browser-origin continuity and protected private-service lease measurements remain; they cannot qualify native durability or impose its lease.
  - id: UC-OFFLINE
    cause: BC-RECOVERY
    relationship: bounded-context
    digest: &impact19 sha256:1106de43fb4ae8be6f0841e7e806c92c3ee15b2050cfc56b74b3d35292aa1922
    cause-digest: *impact2
    reason: &impact20 Its goal/flows explicitly cover retained-origin anonymous and protected private work; native standalone recovery is a distinct added path.
  - id: UC-PDF
    cause: BC-RECOVERY
    relationship: bounded-context
    digest: &impact21 sha256:26a5a12df99ab22eb72daa5e4fb48587a0a47942d74d8d9f717d26489b201062
    cause-digest: *impact2
    reason: &impact22 Attach/open/swipe/resume still operates on the owning song local PDF; native transfer completeness is handled by backup/import boundaries.
  - id: SB-BACKUP-IMPORT
    cause: LC-LIBRARY
    relationship: covers-transition.lifecycle
    digest: &impact23 sha256:a91c468115f1a66e2222f71eb936d54052e1959dfe93867da92c93476ac28d3e
    cause-digest: &impact24 sha256:87592e7d48ad80b922f219f370fee009668a74146f83cbb2f159e16752fbdda5
    reason: &impact25 Explicitly confirmed browser replacement and original identity recovery remain; native graph remapping is a distinct import interaction.
  - id: SB-BACKUP-IMPORT-EMPTY
    cause: LC-LIBRARY
    relationship: covers-transition.lifecycle
    digest: &impact26 sha256:94feeffb023102ad9861da55203c10d9df2f94ffe120ab962c346aa331908c6d
    cause-digest: *impact24
    reason: &impact27 UC-BACKUP explicitly retains this browser IMPORT-EMPTY branch; native independent-copy import cannot use it to clear destination songs.
  - id: SB-LIBRARY-RESTORE
    cause: LC-LIBRARY
    relationship: covers-transition.lifecycle
    digest: &impact28 sha256:421376c1f89c4e7042848c358bc37845549f3f021f3cd77d7fc3b3176fe5d56d
    cause-digest: *impact24
    reason: &impact29 This is explicitly owner-authorized private restore into a populated library; its online checks do not govern added native restore cases.
  - id: SB-SONG-ADD
    cause: LC-LIBRARY
    relationship: covers-transition.lifecycle
    digest: &impact30 sha256:3c802dc04e6f6ee9f01574e60c2a55f3c74c1614762f929575dffdf87b78efe9
    cause-digest: *impact24
    reason: &impact31 Another titled song still creates a distinct identity and preserves existing content; native independent copies use a separate import command.
  - id: SB-SONG-CREATE
    cause: LC-LIBRARY
    relationship: covers-transition.lifecycle
    digest: &impact32 sha256:d95b74331bb7efbb0806b44d35f116106618a1460ddc58b6a0fe7ec9183decba
    cause-digest: *impact24
    reason: &impact33 The first new song still has an empty valid structure and populates the active library; retention adds no different creation semantics.
  - id: SB-SONG-DELETE
    cause: LC-LIBRARY
    relationship: covers-transition.lifecycle
    digest: &impact34 sha256:bbd38eb21cb613007349d8e8a1ecedaf120174f33d7caca81a0f0acdcaf2d060
    cause-digest: *impact24
    reason: &impact35 The subject is explicitly a private active song with collaborative grants; native song removal does not weaken its owner-only recovery.
  - id: SB-SONG-DELETE-LAST
    cause: LC-LIBRARY
    relationship: covers-transition.lifecycle
    digest: &impact36 sha256:6d28d410277829ac14537809d400174250ebf8c7ad66ba5d7fe33b4d8cab5451
    cause-digest: *impact24
    reason: &impact37 Given clauses explicitly identify authenticated private deletion; native recoverable final-song deletion requires separate no-login coverage.
  - id: TERM-ATTACHMENT
    cause: BC-RECOVERY
    relationship: defined-in
    digest: &impact38 sha256:5d434a7bf0cc094ce878496a367fbcd5d2969c1adedc5ba7386d63ab4d4e1c4a
    cause-digest: *impact2
    reason: &impact39 An optional locally stored PDF still belongs to one song and page position; imported independent copies retain distinct owning songs.
  - id: FR-CHORDS
    cause: BR-ACCESS
    relationship: derived-from
    digest: &impact40 sha256:4da1a2f14b722446609a1fca78c027c682d149ecbef18a835eb561f6050f1ae4
    cause-digest: *impact7
    reason: &impact41 Harmony, exact pitch, notation and copied preset semantics remain; principal-owned preference clauses retain their private context under CON-LOCAL-FIRST.
  - id: FR-CONSULT
    cause: BR-ACCESS
    relationship: derived-from
    digest: &impact42 sha256:8afd8d795cf7cd9ec628100291b0772c1588e74a2c4411da5b4dab59bd7c0078
    cause-digest: *impact7
    reason: &impact43 Synchronized read-only performance, accessible keys and private-session guards remain; Android adds delivery, not a weaker performance guard.
  - id: FR-OFFLINE
    cause: BR-ACCESS
    relationship: derived-from
    digest: &impact44 sha256:f39bedc59d2b0506bd49854b84996662f18997159a708d204b54ddecc3c910c1
    cause-digest: *impact7
    reason: &impact45 Anonymous retained-origin and qualified private-lease branches remain explicit; standalone native authority is added in CON-LOCAL-FIRST/FR-PERSIST.
  - id: FR-PHRASE-REFERENCE
    cause: BR-ACCESS
    relationship: derived-from
    digest: &impact46 sha256:16c20f0819f52467b0ac1ba823db8ac5defc7c6c01fd44ad310bdcf15fb35e5b
    cause-digest: *impact7
    reason: &impact47 Exact phrase pitch/order/timing/hand and complete lyric/key transfer remain required; native import must preserve them, not change them.
  - id: FR-PIANO-SCORE
    cause: BR-ACCESS
    relationship: derived-from
    digest: &impact48 sha256:c7090b853deaf69a52df30a9a1ae62d24b51a0cb620dcb38a272ec1e0856cde5
    cause-digest: *impact7
    reason: &impact49 The A0-toC8 editor, separate hands, compact staff and truthful register remain; native packaging adds no audio or altered pitch semantics.
  - id: FR-SECTIONS
    cause: BR-ACCESS
    relationship: derived-from
    digest: &impact50 sha256:a8314412962608a99effe44d9872f7c8261e039e75182e25d111b353609dc95b
    cause-digest: *impact7
    reason: &impact51 Shared form, independent parts, exact timing and six binding layouts remain; native copied graphs must preserve those associations.
  - id: FR-SONG-SHEET
    cause: BR-ACCESS
    relationship: derived-from
    digest: &impact52 sha256:d1601737decd8d10473cdbbb1a417f4a33fa58c70f272f7378b44a7b78d9139c
    cause-digest: *impact7
    reason: &impact53 Focused lyrics/key/chord association and performance protection remain; native acceptance includes these fields rather than title-only CRUD.
  - id: FR-CHORDS
    cause: BR-DURABILITY
    relationship: derived-from
    digest: *impact40
    cause-digest: &impact54 sha256:d822f18f163b8685937ae5a3137dc04ef4a2d5947ab7a9954245bd965b72fa45
    reason: *impact41
  - id: FR-OFFLINE
    cause: BR-DURABILITY
    relationship: derived-from
    digest: *impact44
    cause-digest: *impact54
    reason: *impact45
  - id: FR-PHRASE-REFERENCE
    cause: BR-DURABILITY
    relationship: derived-from
    digest: *impact46
    cause-digest: *impact54
    reason: *impact47
  - id: FR-PIANO-SCORE
    cause: BR-DURABILITY
    relationship: derived-from
    digest: *impact48
    cause-digest: *impact54
    reason: *impact49
  - id: FR-SECTIONS
    cause: BR-DURABILITY
    relationship: derived-from
    digest: *impact50
    cause-digest: *impact54
    reason: *impact51
  - id: FR-SONG-SHEET
    cause: BR-DURABILITY
    relationship: derived-from
    digest: *impact52
    cause-digest: *impact54
    reason: *impact53
  - id: FR-SECTIONS
    cause: BR-IDENTITY
    relationship: derived-from
    digest: *impact50
    cause-digest: *impact11
    reason: *impact51
  - id: FR-CONSULT
    cause: BR-SESSION
    relationship: derived-from
    digest: *impact42
    cause-digest: *impact12
    reason: *impact43
  - id: FR-OFFLINE
    cause: BR-SESSION
    relationship: derived-from
    digest: *impact44
    cause-digest: *impact12
    reason: *impact45
  - id: FR-OFFLINE
    cause: CON-LOCAL-FIRST
    relationship: derived-from
    digest: *impact44
    cause-digest: *impact13
    reason: *impact45
  - id: FR-CONSULT
    cause: CON-PLATFORM
    relationship: derived-from
    digest: *impact42
    cause-digest: *impact14
    reason: *impact43
  - id: FR-OFFLINE
    cause: CON-PLATFORM
    relationship: derived-from
    digest: *impact44
    cause-digest: *impact14
    reason: *impact45
  - id: FR-PHRASE-REFERENCE
    cause: UC-BACKUP
    relationship: derived-from
    digest: *impact46
    cause-digest: &impact55 sha256:ce5f43fc20dbe7e1482447d0334509c00460c28f84e33b3e8aacfcc2e4cbeb9a
    reason: *impact47
  - id: UC-CHORDS
    cause: BR-ACCESS
    relationship: governed-by
    digest: &impact56 sha256:8824f28ac95b8a1f38fa68249fdf8e32441cfc3a4efa5b9e20ef10d81a392ae8
    cause-digest: *impact7
    reason: &impact57 Builder, exact-pitch preview and independent preset copying remain; private capability/session clauses stay in the explicit service context.
  - id: UC-CONSULT
    cause: BR-ACCESS
    relationship: governed-by
    digest: &impact58 sha256:d27ea53e1c307569b2fe941ea94eec4bb0e98e6478f2d947ec7123273f419562
    cause-digest: *impact7
    reason: &impact59 Read-only synchronized keyboard context and private lock rules remain; neither mode switching nor local native access grants service authority.
  - id: UC-OFFLINE
    cause: BR-ACCESS
    relationship: governed-by
    digest: *impact19
    cause-digest: *impact7
    reason: *impact20
  - id: UC-SECTIONS
    cause: BR-ACCESS
    relationship: governed-by
    digest: &impact60 sha256:e928650b0097c6c084f0a5da9483b55153571c56163b84edf7e280c991c97ebd
    cause-digest: *impact7
    reason: &impact61 Shared-form edits and independent performed bindings retain guards and stable identity; native copying does not authorize hidden forks.
  - id: UC-CHORDS
    cause: BR-DURABILITY
    relationship: governed-by
    digest: *impact56
    cause-digest: *impact54
    reason: *impact57
  - id: UC-CONSULT
    cause: BR-DURABILITY
    relationship: governed-by
    digest: *impact58
    cause-digest: *impact54
    reason: *impact59
  - id: UC-OFFLINE
    cause: BR-DURABILITY
    relationship: governed-by
    digest: *impact19
    cause-digest: *impact54
    reason: *impact20
  - id: UC-PDF
    cause: BR-DURABILITY
    relationship: governed-by
    digest: *impact21
    cause-digest: *impact54
    reason: *impact22
  - id: UC-SECTIONS
    cause: BR-DURABILITY
    relationship: governed-by
    digest: *impact60
    cause-digest: *impact54
    reason: *impact61
  - id: UC-ANNOTATIONS
    cause: BR-IDENTITY
    relationship: governed-by
    digest: &impact62 sha256:1b3e61e884b4aa938f3b9a81d07f90523bcd46514071f5d953d98cfbd7e0d715
    cause-digest: *impact11
    reason: &impact63 Song/section note association and acknowledged guarded local edits remain; native save adds a boundary without changing the note operation.
  - id: UC-CHORDS
    cause: BR-IDENTITY
    relationship: governed-by
    digest: *impact56
    cause-digest: *impact11
    reason: *impact57
  - id: UC-MEMBERSHIP
    cause: BR-IDENTITY
    relationship: governed-by
    digest: &impact64 sha256:e3f170c1793e24b326a5fe28a985095a50ed7757cfd75d028c9cac9a6f4d8447
    cause-digest: *impact11
    reason: &impact65 Membership still references an existing song once without owning it; native set delete/restore retains that non-cascading relationship.
  - id: UC-OFFLINE
    cause: BR-IDENTITY
    relationship: governed-by
    digest: *impact19
    cause-digest: *impact11
    reason: *impact20
  - id: UC-SECTIONS
    cause: BR-IDENTITY
    relationship: governed-by
    digest: *impact60
    cause-digest: *impact11
    reason: *impact61
  - id: UC-CHORDS
    cause: BR-SESSION
    relationship: governed-by
    digest: *impact56
    cause-digest: *impact12
    reason: *impact57
  - id: UC-CONSULT
    cause: BR-SESSION
    relationship: governed-by
    digest: *impact58
    cause-digest: *impact12
    reason: *impact59
  - id: UC-OFFLINE
    cause: BR-SESSION
    relationship: governed-by
    digest: *impact19
    cause-digest: *impact12
    reason: *impact20
  - id: UC-SECTIONS
    cause: BR-SESSION
    relationship: governed-by
    digest: *impact60
    cause-digest: *impact12
    reason: *impact61
  - id: SB-CHORD-INVALID
    cause: BR-ACCESS
    relationship: illustrates
    digest: &impact66 sha256:fa5826a9a93f7a9bc10e9ad1e72754e764bb2df8f23ed7ac3cbf164fa793c6cf
    cause-digest: *impact7
    reason: &impact67 Conflicting ninth-degree alterations still refuse without changing revision or parts; capability is contextual, not a native login demand.
  - id: SB-ISOLATION
    cause: BR-ACCESS
    relationship: illustrates
    digest: &impact68 sha256:c7260a9a28f7e15ed8636dbacee4e4ab3d2a160dcb5f63da5bdb77ef66957616
    cause-digest: *impact7
    reason: &impact69 Its given clauses explicitly concern two authenticated private owners and a foreign private song; native copies confer no such grant.
  - id: SB-KEYBOARD
    cause: BR-ACCESS
    relationship: illustrates
    digest: &impact70 sha256:cda070d024497257667b098a1cdd8841ea33ef5c1483ae5094a2370e6ea751a7
    cause-digest: *impact7
    reason: &impact71 Exact D-flat3/F3/A-flat4 labels, chromatic geometry and read-only reference remain; read permission follows the declared content context.
  - id: SB-LEASE-EXPIRY
    cause: BR-ACCESS
    relationship: illustrates
    digest: &impact72 sha256:66183f5ad7f2bfc1eece9fd3912db48e31a28ef81f1bffba8d9e80669214f785
    cause-digest: *impact7
    reason: &impact73 The exact eight-hour deadline is explicitly a qualified private-service lease; it never limits standalone native local history.
  - id: SB-LIBRARY-RESTORE
    cause: BR-ACCESS
    relationship: illustrates
    digest: *impact28
    cause-digest: *impact7
    reason: *impact29
  - id: SB-NAVIGATION
    cause: BR-ACCESS
    relationship: illustrates
    digest: &impact74 sha256:e4e00cff984f6fb87df0263902aa1b4c04883ead9b0e4aed14a2e24aef75eff4
    cause-digest: *impact7
    reason: &impact75 The example explicitly selects within an authorized private song; synchronized context, silence clearing and unchanged music are preserved.
  - id: SB-PART-ISOLATION
    cause: BR-ACCESS
    relationship: illustrates
    digest: &impact76 sha256:85cf4dedece8f20f84edc68e86ac37c4b105e99145da4e57a830453758d1ef31
    cause-digest: *impact7
    reason: &impact77 Adding a fourth part must preserve prior arrangements and bindings; device-independent transfer does not alter those musical invariants.
  - id: SB-PRIVATE-RECOVER
    cause: BR-ACCESS
    relationship: illustrates
    digest: &impact78 sha256:c7bad250d5d7012accdd7852a0ae3a6f17a26cf19382cb888479746e765c15e1
    cause-digest: *impact7
    reason: &impact79 Real sign-in and current private-service revision13 reconstruction remain mandatory; an independent native file copy cannot satisfy them.
  - id: SB-PRIVATE-REFUSE
    cause: BR-ACCESS
    relationship: illustrates
    digest: &impact80 sha256:22d47656277b4ac1c3cfc10ff9b8314cee5c33c492c10e1ad0c90ef6fc292fa3
    cause-digest: *impact7
    reason: &impact81 The retained record belongs to a revoked private editor; no-login native history cannot expose or convert that protected service draft.
  - id: SB-REMOTE-COMMIT
    cause: BR-ACCESS
    relationship: illustrates
    digest: &impact82 sha256:a1ea1989597914fb6e6274f53bedb39be6ddfcaa4d620a9e3b5d30c4ab72de2c
    cause-digest: *impact7
    reason: &impact83 Its service-authorized revision12-to13 commit remains remote acknowledgement; native local success must not be counted as this example.
  - id: SB-ROLE-REVOKE
    cause: BR-ACCESS
    relationship: illustrates
    digest: &impact84 sha256:5d99fcf4a7f445424b499f791cd8fdcba987accd64320bf82ca6c1eee9f41936
    cause-digest: *impact7
    reason: &impact85 This explicitly concerns an authenticated private editor downgraded to viewer; native local ownership does not bypass the revoked grant.
  - id: SB-SESSION-LOCK
    cause: BR-ACCESS
    relationship: illustrates
    digest: &impact86 sha256:a5e1891191daf4e685982b11b403e5d7cafb94146788ab10dc1614faccbef239
    cause-digest: *impact7
    reason: &impact87 Its private-session expiry locks account-bound draft plaintext; native no-account history is neither that session nor that draft.
  - id: SB-SONG-DELETE
    cause: BR-ACCESS
    relationship: illustrates
    digest: *impact34
    cause-digest: *impact7
    reason: *impact35
  - id: SB-SONG-DELETE-LAST
    cause: BR-ACCESS
    relationship: illustrates
    digest: *impact36
    cause-digest: *impact7
    reason: *impact37
  - id: SB-SONG-PURGE
    cause: BR-ACCESS
    relationship: illustrates
    digest: &impact88 sha256:133809f84408d5503c4bd2772f4dd2d435458e28d64d20d19554e6a4ccfb625c
    cause-digest: *impact7
    reason: &impact89 Fresh online authorization and anti-resurrection apply to this deleted private song; native purge is a separate local context.
  - id: SB-SONG-RESTORE
    cause: BR-ACCESS
    relationship: illustrates
    digest: &impact90 sha256:bc8195c3e26f9999e9bc357c4c26463f4d75b33d0cfeb8959262634b10b0f857
    cause-digest: *impact7
    reason: &impact91 This private DELETED-toACTIVE restore preserves identity and invalid grants; native restore cannot be used as evidence of its online checks.
  - id: SB-SONG-RETAIN
    cause: BR-ACCESS
    relationship: illustrates
    digest: &impact92 sha256:cfd69ba6b4801ce20df6499716e35080c2793a9a78a2f3cd7880f765ff982c5d
    cause-digest: *impact7
    reason: &impact93 The subject is a private acknowledged song and owner-only retained history; native deletion adds distinct local retention coverage.
  - id: SB-VOICING
    cause: BR-ACCESS
    relationship: illustrates
    digest: &impact94 sha256:777bafd99676a675c0bf9252fdfd22d85fc9338f8343336a64c4733d92a2e429
    cause-digest: *impact7
    reason: &impact95 The private-song octave edit still changes B4 toB5 without reharmonizing or altering other parts; transfer must preserve that result.
  - id: SB-BACKUP-CANCEL
    cause: BR-BACKUP
    relationship: illustrates
    digest: &impact96 sha256:a1b39939e1798f96a3d4d4a6d0eea6f09ba4156293d49b05ae692953a1975806
    cause-digest: &impact97 sha256:6e01f0285df7783f48eb0c482fa31f490f09e97e0f67a3a5fb3261dc1d1ed29c
    reason: &impact98 Declining the existing browser replacement confirmation still preserves its library; native copy-import cancellation is a separate interaction.
  - id: SB-BACKUP-EXPORT
    cause: BR-BACKUP
    relationship: illustrates
    digest: &impact99 sha256:4dc53a109e0e344b95c117d7a429c92b3b54d4ce8856cf00104b501d13f86237
    cause-digest: *impact97
    reason: &impact100 The complete-library browser export remains a retained branch; native selected-song/set exchange adds separately scoped export cases.
  - id: SB-BACKUP-IMPORT
    cause: BR-BACKUP
    relationship: illustrates
    digest: *impact23
    cause-digest: *impact97
    reason: *impact25
  - id: SB-BACKUP-IMPORT-EMPTY
    cause: BR-BACKUP
    relationship: illustrates
    digest: *impact26
    cause-digest: *impact97
    reason: *impact27
  - id: SB-BACKUP-REJECT
    cause: BR-BACKUP
    relationship: illustrates
    digest: &impact101 sha256:f6b3ca347fe8d7d709509474f84ae9b7d4ecfc01ac4a66c3af5de77c20784e5d
    cause-digest: *impact97
    reason: &impact102 Malformed or inconsistent input still refuses before replacement and preserves data; native refusal adds graph/attachment cases separately.
  - id: SB-BACKUP-CANCEL
    cause: BR-DURABILITY
    relationship: illustrates
    digest: *impact96
    cause-digest: *impact54
    reason: *impact98
  - id: SB-BACKUP-EXPORT
    cause: BR-DURABILITY
    relationship: illustrates
    digest: *impact99
    cause-digest: *impact54
    reason: *impact100
  - id: SB-BACKUP-IMPORT
    cause: BR-DURABILITY
    relationship: illustrates
    digest: *impact23
    cause-digest: *impact54
    reason: *impact25
  - id: SB-BACKUP-IMPORT-EMPTY
    cause: BR-DURABILITY
    relationship: illustrates
    digest: *impact26
    cause-digest: *impact54
    reason: *impact27
  - id: SB-BACKUP-REJECT
    cause: BR-DURABILITY
    relationship: illustrates
    digest: *impact101
    cause-digest: *impact54
    reason: *impact102
  - id: SB-CHORD-INVALID
    cause: BR-DURABILITY
    relationship: illustrates
    digest: *impact66
    cause-digest: *impact54
    reason: *impact67
  - id: SB-LEASE-EXPIRY
    cause: BR-DURABILITY
    relationship: illustrates
    digest: *impact72
    cause-digest: *impact54
    reason: *impact73
  - id: SB-LIBRARY-RESTORE
    cause: BR-DURABILITY
    relationship: illustrates
    digest: *impact28
    cause-digest: *impact54
    reason: *impact29
  - id: SB-OFFLINE
    cause: BR-DURABILITY
    relationship: illustrates
    digest: &impact103 sha256:c8e62d06222a082c057240a58f14633bda2e04f4655a6a0beb6c1f54af7e7955
    cause-digest: *impact54
    reason: &impact104 Its retained-origin anonymous save is explicitly browser-local; native acknowledgement adds another context without changing that outcome.
  - id: SB-PART-ISOLATION
    cause: BR-DURABILITY
    relationship: illustrates
    digest: *impact76
    cause-digest: *impact54
    reason: *impact77
  - id: SB-PDF-ATTACH
    cause: BR-DURABILITY
    relationship: illustrates
    digest: &impact105 sha256:bb0ae4e82407c6d62f96564db7644e8d0d8684bc8f3e8a7166570e3ea4210ce5
    cause-digest: *impact54
    reason: &impact106 Owned readable PDF pages must still reopen offline with their song; native transfer adds byte completeness, not different attachment meaning.
  - id: SB-PDF-NAVIGATE
    cause: BR-DURABILITY
    relationship: illustrates
    digest: &impact107 sha256:36fae57b85fc19e0eed3766456b219721211ad4dd5c7123da9e7bdc357122234
    cause-digest: *impact54
    reason: &impact108 Page bounds, remembered position and performance-safe navigation are unchanged; transfer does not turn page navigation into a musical edit.
  - id: SB-PDF-REJECT
    cause: BR-DURABILITY
    relationship: illustrates
    digest: &impact109 sha256:ad3173b24391233d5316ae7d2f1dece023d35efcf0e3f7931e521839dd41a73d
    cause-digest: *impact54
    reason: &impact110 An unreadable PDF must leave the prior song/attachment intact; native publication failure adds refusal cases without weakening this one.
  - id: SB-PERSIST-CONFLICT
    cause: BR-DURABILITY
    relationship: illustrates
    digest: &impact111 sha256:3a7fdc4b47da270a63bc50bf681af96793fb46a8283af9093b01d9959f026b37
    cause-digest: *impact54
    reason: &impact112 The existing local-session stale-save refusal and recoverable-work outcome remain; it does not specify native acknowledged-file export.
  - id: SB-PERSIST-FAILURE
    cause: BR-DURABILITY
    relationship: illustrates
    digest: &impact113 sha256:31db2bb51e3c0495ac05dc1b53938c2de756eef9176e3ba747f6b877ee014357
    cause-digest: *impact54
    reason: &impact114 The given clause explicitly names browser persistence failure; native save failure needs its own local-durability example.
  - id: SB-PERSIST-RECOVER
    cause: BR-DURABILITY
    relationship: illustrates
    digest: &impact115 sha256:3bb4bec701cf460455382daec1bd17f1e87e0a7f2f5cddc33e244a5b6287d9af
    cause-digest: *impact54
    reason: &impact116 Its anonymous retained-origin revision7 explicitly excludes claim/deleted restore and private unlock; native recovery is separate evidence.
  - id: SB-PRIVATE-RECOVER
    cause: BR-DURABILITY
    relationship: illustrates
    digest: *impact78
    cause-digest: *impact54
    reason: *impact79
  - id: SB-PRIVATE-REFUSE
    cause: BR-DURABILITY
    relationship: illustrates
    digest: *impact80
    cause-digest: *impact54
    reason: *impact81
  - id: SB-RECOVERY-INVALID
    cause: BR-DURABILITY
    relationship: illustrates
    digest: &impact117 sha256:0ad0f1f37ef7919e9cbdc0708cc377af07901380f00504ed86d24617bc767ec5
    cause-digest: *impact54
    reason: &impact118 Unknown or unreadable stored data must not become an empty replacement; native unsupported storage preserves the same refusal invariant.
  - id: SB-REMOTE-COMMIT
    cause: BR-DURABILITY
    relationship: illustrates
    digest: *impact82
    cause-digest: *impact54
    reason: *impact83
  - id: SB-ROLE-REVOKE
    cause: BR-DURABILITY
    relationship: illustrates
    digest: *impact84
    cause-digest: *impact54
    reason: *impact85
  - id: SB-SESSION-LOCK
    cause: BR-DURABILITY
    relationship: illustrates
    digest: *impact86
    cause-digest: *impact54
    reason: *impact87
  - id: SB-SONG-DELETE
    cause: BR-DURABILITY
    relationship: illustrates
    digest: *impact34
    cause-digest: *impact54
    reason: *impact35
  - id: SB-SONG-DELETE-LAST
    cause: BR-DURABILITY
    relationship: illustrates
    digest: *impact36
    cause-digest: *impact54
    reason: *impact37
  - id: SB-SONG-PURGE
    cause: BR-DURABILITY
    relationship: illustrates
    digest: *impact88
    cause-digest: *impact54
    reason: *impact89
  - id: SB-SONG-RESTORE
    cause: BR-DURABILITY
    relationship: illustrates
    digest: *impact90
    cause-digest: *impact54
    reason: *impact91
  - id: SB-SONG-RETAIN
    cause: BR-DURABILITY
    relationship: illustrates
    digest: *impact92
    cause-digest: *impact54
    reason: *impact93
  - id: SB-VOICING
    cause: BR-DURABILITY
    relationship: illustrates
    digest: *impact94
    cause-digest: *impact54
    reason: *impact95
  - id: SB-ANNOTATIONS
    cause: BR-IDENTITY
    relationship: illustrates
    digest: &impact119 sha256:e9f7eeba4ec89ac374cbbe880b1a4d2899ca92f1c6fd71231d9a664a94b8660f
    cause-digest: *impact11
    reason: &impact120 Song/section note ownership and edit admission are unchanged; native save adds durability context without changing either note association.
  - id: SB-BLANK-NAME
    cause: BR-IDENTITY
    relationship: illustrates
    digest: &impact121 sha256:df469f85a539ac9aabbc71658c59485c3a0232a88349ce62b0ac126d6897f04c
    cause-digest: *impact11
    reason: &impact122 Whitespace-only song titles remain invalid in every context; independent-copy exchange does not relax creation validation.
  - id: SB-ISOLATION
    cause: BR-IDENTITY
    relationship: illustrates
    digest: *impact68
    cause-digest: *impact11
    reason: *impact69
  - id: SB-LIBRARY-RESTORE
    cause: BR-IDENTITY
    relationship: illustrates
    digest: *impact28
    cause-digest: *impact11
    reason: *impact29
  - id: SB-MEMBERSHIP-ADD
    cause: BR-IDENTITY
    relationship: illustrates
    digest: &impact123 sha256:f0cc7537b2efb9033a66e7f95e4d2ba68c92037edd808c571fa4b9f3c3eddbbe
    cause-digest: *impact11
    reason: &impact124 Adding an existing song once preserves independent song availability; native copied sets retain the same non-owning membership meaning.
  - id: SB-MEMBERSHIP-DUPLICATE
    cause: BR-IDENTITY
    relationship: illustrates
    digest: &impact125 sha256:cf13783a3af08774e6216bb726af792566480d5ba2d3a236983ae749f241366b
    cause-digest: *impact11
    reason: &impact126 Duplicate membership within one set remains invalid; a new import creates a distinct copied graph, not duplicate membership in that set.
  - id: SB-MEMBERSHIP-REMOVE
    cause: BR-IDENTITY
    relationship: illustrates
    digest: &impact127 sha256:76ff8dfb68346d6bcaa2716da66062cd284902f6bdf5003a77538132041bd71c
    cause-digest: *impact11
    reason: &impact128 Removing one membership still leaves its song available; native set retention/history does not make membership own song content.
  - id: SB-MISSING-IDENTITY
    cause: BR-IDENTITY
    relationship: illustrates
    digest: &impact129 sha256:fff8b2ea2df48cf8b63bb2b5ed2ea1f834b2b24389ed9e300fba67bb6d78c66d
    cause-digest: *impact11
    reason: &impact130 Editing an unknown song must still refuse without creating content; import allocates identities only through its separate confirmed command.
  - id: SB-PART-ISOLATION
    cause: BR-IDENTITY
    relationship: illustrates
    digest: *impact76
    cause-digest: *impact11
    reason: *impact77
  - id: SB-REPERTOIRE-CREATE
    cause: BR-IDENTITY
    relationship: illustrates
    digest: &impact131 sha256:37922d0d79d173763965250a8b5fa744c0f62775ba78c6c3ae7e4e0db182d86a
    cause-digest: *impact11
    reason: &impact132 Creating a named set still allocates identity without fabricating songs/memberships; native history adds retention, not initial content.
  - id: SB-REPERTOIRE-DELETE
    cause: BR-IDENTITY
    relationship: illustrates
    digest: &impact133 sha256:3203bf7d104b07abed94f2f2beb00b92f33eead1e90981e88f123fe3aeda62c6
    cause-digest: *impact11
    reason: &impact134 Removal describes the active set/memberships and preserves songs; it does not state that retained native membership history is erased.
  - id: SB-REPERTOIRE-RENAME
    cause: BR-IDENTITY
    relationship: illustrates
    digest: &impact135 sha256:96865538af194f8c287f62e4dc44e4341fab5700fb7f306801b1411f2e9a27ba
    cause-digest: *impact11
    reason: &impact136 Rename keeps set identity and membership unchanged; retaining native revisions adds history without changing that observable edit.
  - id: SB-SECTION-FIRST
    cause: BR-IDENTITY
    relationship: illustrates
    digest: &impact137 sha256:142013b9449dc02eff8f99b7752661694163795e29a55ef00daafc6f63e7ac4c
    cause-digest: *impact11
    reason: &impact138 First-section insertion still creates one new section and ARRANGED presence; native library/retention context does not change form topology.
  - id: SB-SECTION-INSERT
    cause: BR-IDENTITY
    relationship: illustrates
    digest: &impact139 sha256:419cab857698e48ddda21d1b82e507163f407c0d6459f16785fb096c9324427a
    cause-digest: *impact11
    reason: &impact140 A second section remains independently identified and preserves the first; import remapping is separate from editing an existing song.
  - id: SB-SECTION-INVALID-ORDER
    cause: BR-IDENTITY
    relationship: illustrates
    digest: &impact141 sha256:b504ff2ff04dee9f4f02842b169ef787cff8f53943404f0323b0f946bda08944
    cause-digest: *impact11
    reason: &impact142 A repeated section identity in an order remains invalid; consistent native graph remapping cannot authorize duplicate order entries.
  - id: SB-SECTION-MODIFY
    cause: BR-IDENTITY
    relationship: illustrates
    digest: &impact143 sha256:d39296e86c35c16c859c4f1c4294a2df9b5edcd9304a505d7b4d5b985274a95b
    cause-digest: *impact11
    reason: &impact144 Changing label/repeat retains section identity, chords and notes; history acknowledgement does not alter those musical results.
  - id: SB-SECTION-REMOVE
    cause: BR-IDENTITY
    relationship: illustrates
    digest: &impact145 sha256:a9ebfc7be7dad88eaca3e230d20e904c697d133790d193f4cb46dcf495708e77
    cause-digest: *impact11
    reason: &impact146 Only the selected section leaves active form and the other remains; retained song history does not change this active-content result.
  - id: SB-SECTION-REMOVE-LAST
    cause: BR-IDENTITY
    relationship: illustrates
    digest: &impact147 sha256:4857e323f1014f93ab8b8e8e72e692809d2597c653a7cea01de470132b094e66
    cause-digest: *impact11
    reason: &impact148 Removing the last section still leaves a valid empty song; native song deletion/purge is a different command and lifecycle.
  - id: SB-SECTION-REORDER
    cause: BR-IDENTITY
    relationship: illustrates
    digest: &impact149 sha256:610413c7eae977e5760aa413f58ec499375fdafe0952dca8cbc7591cbda639e5
    cause-digest: *impact11
    reason: &impact150 Reorder changes position alone and preserves section content/repeats; native portability must preserve the same identified structure.
  - id: SB-SECTION-REPEAT-BOUNDARY
    cause: BR-IDENTITY
    relationship: illustrates
    digest: &impact151 sha256:8290678c017a749dd78b1b1d6ef192b85a7ec141d1cc1f0a1926c91c957217c7
    cause-digest: *impact11
    reason: &impact152 The integer1-through99 repetition bound is unchanged; native copies preserve rather than reinterpret repeat counts.
  - id: SB-SONG-ADD
    cause: BR-IDENTITY
    relationship: illustrates
    digest: *impact30
    cause-digest: *impact11
    reason: *impact31
  - id: SB-SONG-CREATE
    cause: BR-IDENTITY
    relationship: illustrates
    digest: *impact32
    cause-digest: *impact11
    reason: *impact33
  - id: SB-SONG-DELETE
    cause: BR-IDENTITY
    relationship: illustrates
    digest: *impact34
    cause-digest: *impact11
    reason: *impact35
  - id: SB-SONG-DELETE-LAST
    cause: BR-IDENTITY
    relationship: illustrates
    digest: *impact36
    cause-digest: *impact11
    reason: *impact37
  - id: SB-SONG-EDIT
    cause: BR-IDENTITY
    relationship: illustrates
    digest: &impact153 sha256:1e27a22da49c7b805dcc4023c563afa4b2ec78936ca42473957617aecb9fa33a
    cause-digest: *impact11
    reason: &impact154 Title/artist edits keep the same song and section/membership associations; native history and transfer do not change that edit meaning.
  - id: SB-SONG-PURGE
    cause: BR-IDENTITY
    relationship: illustrates
    digest: *impact88
    cause-digest: *impact11
    reason: *impact89
  - id: SB-SONG-RESTORE
    cause: BR-IDENTITY
    relationship: illustrates
    digest: *impact90
    cause-digest: *impact11
    reason: *impact91
  - id: SB-SONG-RETAIN
    cause: BR-IDENTITY
    relationship: illustrates
    digest: *impact92
    cause-digest: *impact11
    reason: *impact93
  - id: SB-LEASE-EXPIRY
    cause: BR-SESSION
    relationship: illustrates
    digest: *impact72
    cause-digest: *impact12
    reason: *impact73
  - id: SB-LIBRARY-RESTORE
    cause: BR-SESSION
    relationship: illustrates
    digest: *impact28
    cause-digest: *impact12
    reason: *impact29
  - id: SB-NAVIGATION
    cause: BR-SESSION
    relationship: illustrates
    digest: *impact74
    cause-digest: *impact12
    reason: *impact75
  - id: SB-PRIVATE-RECOVER
    cause: BR-SESSION
    relationship: illustrates
    digest: *impact78
    cause-digest: *impact12
    reason: *impact79
  - id: SB-PRIVATE-REFUSE
    cause: BR-SESSION
    relationship: illustrates
    digest: *impact80
    cause-digest: *impact12
    reason: *impact81
  - id: SB-ROLE-REVOKE
    cause: BR-SESSION
    relationship: illustrates
    digest: *impact84
    cause-digest: *impact12
    reason: *impact85
  - id: SB-SESSION-LOCK
    cause: BR-SESSION
    relationship: illustrates
    digest: *impact86
    cause-digest: *impact12
    reason: *impact87
  - id: SB-SONG-DELETE
    cause: BR-SESSION
    relationship: illustrates
    digest: *impact34
    cause-digest: *impact12
    reason: *impact35
  - id: SB-SONG-DELETE-LAST
    cause: BR-SESSION
    relationship: illustrates
    digest: *impact36
    cause-digest: *impact12
    reason: *impact37
  - id: SB-SONG-PURGE
    cause: BR-SESSION
    relationship: illustrates
    digest: *impact88
    cause-digest: *impact12
    reason: *impact89
  - id: SB-SONG-RESTORE
    cause: BR-SESSION
    relationship: illustrates
    digest: *impact90
    cause-digest: *impact12
    reason: *impact91
  - id: SB-SONG-RETAIN
    cause: BR-SESSION
    relationship: illustrates
    digest: *impact92
    cause-digest: *impact12
    reason: *impact93
  - id: SB-BACKUP-CANCEL
    cause: UC-BACKUP
    relationship: illustrates
    digest: *impact96
    cause-digest: *impact55
    reason: *impact98
  - id: SB-BACKUP-EXPORT
    cause: UC-BACKUP
    relationship: illustrates
    digest: *impact99
    cause-digest: *impact55
    reason: *impact100
  - id: SB-BACKUP-IMPORT
    cause: UC-BACKUP
    relationship: illustrates
    digest: *impact23
    cause-digest: *impact55
    reason: *impact25
  - id: SB-BACKUP-IMPORT-EMPTY
    cause: UC-BACKUP
    relationship: illustrates
    digest: *impact26
    cause-digest: *impact55
    reason: *impact27
  - id: SB-BACKUP-REJECT
    cause: UC-BACKUP
    relationship: illustrates
    digest: *impact101
    cause-digest: *impact55
    reason: *impact102
  - id: SB-ISOLATION
    cause: UC-PERSIST
    relationship: illustrates
    digest: *impact68
    cause-digest: &impact155 sha256:ea669e891adfc7641a2cf80bd5cd198d3909ee2fd6424c505a7cf991314c602f
    reason: *impact69
  - id: SB-LEASE-EXPIRY
    cause: UC-PERSIST
    relationship: illustrates
    digest: *impact72
    cause-digest: *impact155
    reason: *impact73
  - id: SB-PERSIST-CONFLICT
    cause: UC-PERSIST
    relationship: illustrates
    digest: *impact111
    cause-digest: *impact155
    reason: *impact112
  - id: SB-PERSIST-FAILURE
    cause: UC-PERSIST
    relationship: illustrates
    digest: *impact113
    cause-digest: *impact155
    reason: *impact114
  - id: SB-PERSIST-RECOVER
    cause: UC-PERSIST
    relationship: illustrates
    digest: *impact115
    cause-digest: *impact155
    reason: *impact116
  - id: SB-PRIVATE-RECOVER
    cause: UC-PERSIST
    relationship: illustrates
    digest: *impact78
    cause-digest: *impact155
    reason: *impact79
  - id: SB-PRIVATE-REFUSE
    cause: UC-PERSIST
    relationship: illustrates
    digest: *impact80
    cause-digest: *impact155
    reason: *impact81
  - id: SB-RECOVERY-INVALID
    cause: UC-PERSIST
    relationship: illustrates
    digest: *impact117
    cause-digest: *impact155
    reason: *impact118
  - id: SB-REMOTE-COMMIT
    cause: UC-PERSIST
    relationship: illustrates
    digest: *impact82
    cause-digest: *impact155
    reason: *impact83
  - id: SB-ROLE-REVOKE
    cause: UC-PERSIST
    relationship: illustrates
    digest: *impact84
    cause-digest: *impact155
    reason: *impact85
  - id: SB-SESSION-LOCK
    cause: UC-PERSIST
    relationship: illustrates
    digest: *impact86
    cause-digest: *impact155
    reason: *impact87
  - id: SB-REPERTOIRE-CREATE
    cause: UC-REPERTOIRES
    relationship: illustrates
    digest: *impact131
    cause-digest: &impact156 sha256:a4029a0536cb5625adbc26301cb71c6e057ead00282f7a00e416d34ddb5aae1f
    reason: *impact132
  - id: SB-REPERTOIRE-DELETE
    cause: UC-REPERTOIRES
    relationship: illustrates
    digest: *impact133
    cause-digest: *impact156
    reason: *impact134
  - id: SB-REPERTOIRE-RENAME
    cause: UC-REPERTOIRES
    relationship: illustrates
    digest: *impact135
    cause-digest: *impact156
    reason: *impact136
  - id: SB-BLANK-NAME
    cause: UC-SONGS
    relationship: illustrates
    digest: *impact121
    cause-digest: &impact157 sha256:9230de84fe0d6cbbe62e7f5bc23c9118bf5e425dcda62bfd8b9c9312cd81e4c5
    reason: *impact122
  - id: SB-LIBRARY-RESTORE
    cause: UC-SONGS
    relationship: illustrates
    digest: *impact28
    cause-digest: *impact157
    reason: *impact29
  - id: SB-MISSING-IDENTITY
    cause: UC-SONGS
    relationship: illustrates
    digest: *impact129
    cause-digest: *impact157
    reason: *impact130
  - id: SB-SONG-ADD
    cause: UC-SONGS
    relationship: illustrates
    digest: *impact30
    cause-digest: *impact157
    reason: *impact31
  - id: SB-SONG-CREATE
    cause: UC-SONGS
    relationship: illustrates
    digest: *impact32
    cause-digest: *impact157
    reason: *impact33
  - id: SB-SONG-DELETE
    cause: UC-SONGS
    relationship: illustrates
    digest: *impact34
    cause-digest: *impact157
    reason: *impact35
  - id: SB-SONG-DELETE-LAST
    cause: UC-SONGS
    relationship: illustrates
    digest: *impact36
    cause-digest: *impact157
    reason: *impact37
  - id: SB-SONG-EDIT
    cause: UC-SONGS
    relationship: illustrates
    digest: *impact153
    cause-digest: *impact157
    reason: *impact154
  - id: SB-SONG-PURGE
    cause: UC-SONGS
    relationship: illustrates
    digest: *impact88
    cause-digest: *impact157
    reason: *impact89
  - id: SB-SONG-RESTORE
    cause: UC-SONGS
    relationship: illustrates
    digest: *impact90
    cause-digest: *impact157
    reason: *impact91
  - id: SB-SONG-RETAIN
    cause: UC-SONGS
    relationship: illustrates
    digest: *impact92
    cause-digest: *impact157
    reason: *impact93
  - id: LC-SONG-RETENTION
    cause: BR-ACCESS
    relationship: transitions[].governed-by
    digest: &impact158 sha256:afaa64e4767b42ed87d8e40e2b031b598952708b18bacb182a0b8e4dfa502d48
    cause-digest: *impact7
    reason: &impact159 Title, subject and boundaries explicitly restrict this lifecycle to private acknowledged songs; native retention must not inherit online guards.
  - id: LC-SONG-RETENTION
    cause: BR-DURABILITY
    relationship: transitions[].governed-by
    digest: *impact158
    cause-digest: *impact54
    reason: *impact159
  - id: LC-SONG-RETENTION
    cause: BR-IDENTITY
    relationship: transitions[].governed-by
    digest: *impact158
    cause-digest: *impact11
    reason: *impact159
  - id: LC-STRUCTURE
    cause: BR-IDENTITY
    relationship: transitions[].governed-by
    digest: &impact160 sha256:31caaa7320486ab3a837e8b0f3ac2b14f6e5623b664f131cb85af1ce030a24ef
    cause-digest: *impact11
    reason: &impact161 EMPTY/ARRANGED derives only from section presence; native history/import context adds no publishing, save-status or retention state here.
  - id: LC-SONG-RETENTION
    cause: BR-SESSION
    relationship: transitions[].governed-by
    digest: *impact158
    cause-digest: *impact12
    reason: *impact159
  - id: LC-SONG-RETENTION
    cause: UC-SONGS
    relationship: transitions[].realized-by
    digest: *impact158
    cause-digest: *impact157
    reason: *impact159
  - id: SB-PERSIST-RECOVER
    cause: TERM-BACKUP
    relationship: uses-terms
    digest: *impact115
    cause-digest: &impact162 sha256:2b96703caa8e0dde2824a37f28ceafe715826a8aa4fdd43a55c3b1b64ee79a81
    reason: *impact116
  - id: FR-OFFLINE
    cause: TERM-LIBRARY
    relationship: uses-terms
    digest: *impact44
    cause-digest: &impact163 sha256:bdb900be33ca4f27b023de6fa19bae13e19ca99c8596ac98a8c7f77def61005a
    reason: *impact45
  - id: QR-OFFLINE
    cause: TERM-LIBRARY
    relationship: uses-terms
    digest: *impact16
    cause-digest: *impact163
    reason: *impact18
  - id: SB-LEASE-EXPIRY
    cause: TERM-LIBRARY
    relationship: uses-terms
    digest: *impact72
    cause-digest: *impact163
    reason: *impact73
  - id: SB-LIBRARY-RESTORE
    cause: TERM-LIBRARY
    relationship: uses-terms
    digest: *impact28
    cause-digest: *impact163
    reason: *impact29
  - id: SB-OFFLINE
    cause: TERM-LIBRARY
    relationship: uses-terms
    digest: *impact103
    cause-digest: *impact163
    reason: *impact104
  - id: SB-PERSIST-RECOVER
    cause: TERM-LIBRARY
    relationship: uses-terms
    digest: *impact115
    cause-digest: *impact163
    reason: *impact116
  - id: SB-PRIVATE-REFUSE
    cause: TERM-LIBRARY
    relationship: uses-terms
    digest: *impact80
    cause-digest: *impact163
    reason: *impact81
  - id: SB-SONG-DELETE
    cause: TERM-LIBRARY
    relationship: uses-terms
    digest: *impact34
    cause-digest: *impact163
    reason: *impact35
  - id: SB-SONG-DELETE-LAST
    cause: TERM-LIBRARY
    relationship: uses-terms
    digest: *impact36
    cause-digest: *impact163
    reason: *impact37
  - id: SB-SONG-PURGE
    cause: TERM-LIBRARY
    relationship: uses-terms
    digest: *impact88
    cause-digest: *impact163
    reason: *impact89
  - id: SB-SONG-RESTORE
    cause: TERM-LIBRARY
    relationship: uses-terms
    digest: *impact90
    cause-digest: *impact163
    reason: *impact91
  - id: SB-SONG-RETAIN
    cause: TERM-LIBRARY
    relationship: uses-terms
    digest: *impact92
    cause-digest: *impact163
    reason: *impact93
  - id: UC-OFFLINE
    cause: TERM-LIBRARY
    relationship: uses-terms
    digest: *impact19
    cause-digest: *impact163
    reason: *impact20
---

## Problem

Native Android installation is excluded. Browser-anonymous replacement and service-authoritative private recovery do not describe standalone native save, independent-copy exchange or recoverable local song/set history. Applying those existing contexts indiscriminately would erase destination music or impose login on local recovery.

## Intended Product Outcome

The installed Android product owns its durable local library without login or backend. It supports the selected complete musical journeys, local history, recoverable song/set deletion, explicit purge and complete current-revision song/ordered-set transfer into independent editable copies. Existing web/private-service outcomes and authority remain intact.

## Rationale

The verified answers select these alternatives for drafting, not approval of this exact delta. Their relevant wording is preserved here and in the proposal:

> **Answer to the current collision question: C — always create an independent editable local copy.** Never overwrite or merge existing destination music implicitly.

> Export/share the selected current acknowledged musical revision, with source revision/provenance metadata; do not share the device's private revision history implicitly. Imported content begins an independent destination history.

> Choose recoverable native deletion. Deleting a local Android song removes it from active use and active set memberships while retaining its complete owned musical content, owned PDF attachments and acknowledged revision history until a separate, explicitly confirmed permanent purge. No automatic expiry or age-based purge. Other songs, surviving sets and independently owned reusable resources remain unchanged.

> Apply the same recoverable-delete / separately confirmed purge principle to native sets and their own ordered-membership history. Removing or purging a set never deletes its songs or independently owned resources. Restoration must validate the current graph; if a required song/resource has been permanently removed, disclose the missing dependency and refuse an invalid or partial restore without changing the durable library. Do not silently invent or resurrect missing content.

Complete supported PDF transfer remains required; no renderer or publisher qualification is claimed. Native imports copy required reusable musical definitions into their own destination graph rather than importing personal preferences, authority or actual hardware configuration. Keeping explicit contexts prevents these native decisions from weakening private-service ownership, lease or retention rules.

## Affected Product Areas

Platform and scope constraints; library/recovery authority; identities and retention; complete transfer and acknowledged durability; ordered set management; portable/library terminology. Stable IDs are modified rather than duplicated. Explicitly private song-retention lifecycle and examples remain private; musical, reference, PDF consultation, edit-guard and readability outcomes remain unchanged.

## Open Questions

None.

## Product Acceptance

- Native installation permits create/edit/save/restart/reopen and local history/restore/delete/purge with no account or network. Acknowledgement requires complete valid atomic local durability and retry receipts.
- Every mutation enforces edit mode, expected revision and domain validity, including direct commands. A failed/stale/cancelled command preserves prior durable content. Historical restore creates a new revision and preserves intervening history. No automatic expiry occurs.
- Native song deletion removes active membership while retaining all owned music/PDF/history; restoration preserves identities but not former memberships. Set deletion retains its own membership history without deleting songs. Purge is separately confirmed, names the item and irreversibility, preserves independent resources and retains anti-resurrection receipts. Missing dependencies refuse restore without partial activation.
- Export selects the current acknowledged song or complete ordered set, preserving every supported musical field/association, required reusable musical definition and owned PDF byte with integrity reference and source provenance, not the device's revision history or authority. Links retain their explicit connectivity limits.
- Native import previews and validates the whole graph, consistently remaps all local identities and acknowledges the complete selected scope only after atomic local commit and qualified attachment publication. Existing destination songs, sets and resources remain unchanged. Same-command retry returns the existing result; a deliberate new import may create another copy.
- Malformed, unknown, truncated, oversized, duplicate/dangling, unsupported or incomplete content, attachment-publication failure and storage exhaustion preserve the original file and previous library without silent omission or false success.
- Two independent installations reconstruct independently expected complete song/set values; the destination can edit, re-export and reopen without live synchronization. Existing unrelated destination music remains intact.
- Editor/piano/staff/song-sheet/phrase, exact pitch/spelling/part/hand/register, references/PDFs and performance protection remain the selected native acceptance scope, not title/notes-only CRUD.
- Existing browser replacement, private service acknowledgement, accounts/capabilities, protected-session retention and qualified private offline lease are preserved in their existing contexts. Native local history does not depend on those online checks.

## Out of Scope

Implementation, architecture/build choices, child-issue creation, branch publication, delivery integration, merge, release, signing, store distribution, installation evidence and musician acceptance are separate work. MIDI, microphone/audio hardware, synthesis, transcription, realtime collaboration, public sharing services and live synchronization remain excluded or follow-up scope. Android installation does not itself promise Play distribution. No change retires the web service or alters another in-flight musical capability. No approval, apply, production qualification or instant erasure of existing exported copies is asserted.
