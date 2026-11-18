---
id: CHG-ARRANGEMENT-EVOLUTION
type: product-change
title: Private playable arrangements and acknowledged recovery
status: applied
base-revision: d084839
operations:
  add:
    - TERM-ARRANGEMENT
    - TERM-VOICING
    - TERM-EVENT
    - TERM-PRINCIPAL
    - BR-ACCESS
    - BR-SESSION
    - LC-SONG-RETENTION
    - SB-NOTATION
    - SB-VOICING
    - SB-PART-ISOLATION
    - SB-NAVIGATION
    - SB-REMOTE-COMMIT
    - SB-ISOLATION
    - SB-ROLE-REVOKE
    - SB-SESSION-LOCK
    - SB-LEASE-EXPIRY
    - SB-SONG-RETAIN
    - SB-SONG-RESTORE
    - SB-SONG-PURGE
    - SB-PRIVATE-RECOVER
    - SB-PRIVATE-REFUSE
    - SB-LIBRARY-RESTORE
  modify:
    - CON-LOCAL-FIRST
    - CON-SCOPE
    - CON-PLATFORM
    - BC-RECOVERY
    - TERM-SONG
    - TERM-SECTION
    - TERM-CHORD
    - TERM-LIBRARY
    - TERM-BACKUP
    - BR-CHORDS
    - BR-STRUCTURE
    - BR-IDENTITY
    - BR-DURABILITY
    - BR-BACKUP
    - UC-CHORDS
    - UC-SECTIONS
    - UC-CONSULT
    - UC-PERSIST
    - UC-BACKUP
    - UC-OFFLINE
    - UC-SONGS
    - FR-CHORDS
    - FR-SECTIONS
    - FR-CONSULT
    - FR-PERSIST
    - FR-BACKUP
    - FR-OFFLINE
    - FR-SONGS
    - QR-INTEGRITY
    - QR-OFFLINE
    - QR-READABILITY
    - LC-LIBRARY
    - SB-CHORD-INVALID
    - SB-KEYBOARD
    - SB-SONG-DELETE
    - SB-SONG-DELETE-LAST
    - SB-OFFLINE
    - SB-PERSIST-RECOVER
    - JRN-PREPARE-PERFORM
  remove: []
unaffected:
  - id: BR-PDF
    cause: BC-RECOVERY
    relationship: applies-to
    digest: sha256:e83f0e00285008ae9c61789b2bc7ed7ec700368aaa55dda2d7323966d5b0e8cb
    cause-digest: sha256:d04a791ff84b254a041561b54cf2371da96c0ab165c98460171f63f059f7989d
    reason: Optional locally associated PDFs and readable-page navigation remain independent. Recovery
      now also owns private service continuity; it does not change the PDF rule.
  - id: CON-CONTENT
    cause: BC-RECOVERY
    relationship: applies-to
    digest: sha256:5c08415cc8047dfc3161440d4a427675c191cd7bfecef5d3c7bb139fe0a9752e
    cause-digest: sha256:d04a791ff84b254a041561b54cf2371da96c0ab165c98460171f63f059f7989d
    reason: All music remains user-authored and all shipped examples synthetic; private persistence and
      recovery introduce no exception.
  - id: BC-LIBRARY
    cause: BR-ACCESS
    relationship: applies-to
    digest: sha256:ae6c307b94a4dfbe98ec1bee2eac14e2d1754b950f2bdd9e454c3431809f5bd4
    cause-digest: sha256:fcc173c80ae4a5903dbeb2e11c141cb6ee8d03382c812ebc527d5065347b72c9
    reason: The context continues to own identified songs and non-owning repertoire membership. Added
      private capability/session constraints govern its operations without introducing a public
      catalogue or changing its responsibility.
  - id: BC-SKETCH
    cause: BR-ACCESS
    relationship: applies-to
    digest: sha256:b22f7b77f262d51838dfcf3917347c5637b393f114d2fa2a0bd17618bb21707d
    cause-digest: sha256:fcc173c80ae4a5903dbeb2e11c141cb6ee8d03382c812ebc527d5065347b72c9
    reason: The context still expresses user-authored ordered musical structure and reminders.
      Additional performed parts and private guards extend its detail without automatic
      transcription or a new context identity.
  - id: BC-SKETCH
    cause: BR-CHORDS
    relationship: applies-to
    digest: sha256:b22f7b77f262d51838dfcf3917347c5637b393f114d2fa2a0bd17618bb21707d
    cause-digest: sha256:543566a20181aa25eab6cc446d8ac467b1ca911632744dd957a0ab3388e9d55c
    reason: The context still expresses user-authored ordered musical structure and reminders.
      Additional performed parts and private guards extend its detail without automatic
      transcription or a new context identity.
  - id: BC-LIBRARY
    cause: BR-IDENTITY
    relationship: applies-to
    digest: sha256:ae6c307b94a4dfbe98ec1bee2eac14e2d1754b950f2bdd9e454c3431809f5bd4
    cause-digest: sha256:6b3d38400ae82fdc926ae2b7a9eee5d02e684c50502545f323adc41cea150768
    reason: The context continues to own identified songs and non-owning repertoire membership. Added
      private capability/session constraints govern its operations without introducing a public
      catalogue or changing its responsibility.
  - id: BC-LIBRARY
    cause: BR-SESSION
    relationship: applies-to
    digest: sha256:ae6c307b94a4dfbe98ec1bee2eac14e2d1754b950f2bdd9e454c3431809f5bd4
    cause-digest: sha256:a8c63526b6fe52375791a737ed14280609d00938808928153d49fd2627416326
    reason: The context continues to own identified songs and non-owning repertoire membership. Added
      private capability/session constraints govern its operations without introducing a public
      catalogue or changing its responsibility.
  - id: BC-SKETCH
    cause: BR-SESSION
    relationship: applies-to
    digest: sha256:b22f7b77f262d51838dfcf3917347c5637b393f114d2fa2a0bd17618bb21707d
    cause-digest: sha256:a8c63526b6fe52375791a737ed14280609d00938808928153d49fd2627416326
    reason: The context still expresses user-authored ordered musical structure and reminders.
      Additional performed parts and private guards extend its detail without automatic
      transcription or a new context identity.
  - id: BC-SKETCH
    cause: BR-STRUCTURE
    relationship: applies-to
    digest: sha256:b22f7b77f262d51838dfcf3917347c5637b393f114d2fa2a0bd17618bb21707d
    cause-digest: sha256:db3410bd8a3fe7f3da94e63ee8804b1c75f03b8f7dd1e7858cfd05aed03a0686
    reason: The context still expresses user-authored ordered musical structure and reminders.
      Additional performed parts and private guards extend its detail without automatic
      transcription or a new context identity.
  - id: BC-LIBRARY
    cause: CON-LOCAL-FIRST
    relationship: applies-to
    digest: sha256:ae6c307b94a4dfbe98ec1bee2eac14e2d1754b950f2bdd9e454c3431809f5bd4
    cause-digest: sha256:a2cd6293106ac4e7a464b7ded96b8670d1de7480624260ba8c49a1400dbc824d
    reason: The context continues to own identified songs and non-owning repertoire membership. Added
      private capability/session constraints govern its operations without introducing a public
      catalogue or changing its responsibility.
  - id: BC-SKETCH
    cause: CON-LOCAL-FIRST
    relationship: applies-to
    digest: sha256:b22f7b77f262d51838dfcf3917347c5637b393f114d2fa2a0bd17618bb21707d
    cause-digest: sha256:a2cd6293106ac4e7a464b7ded96b8670d1de7480624260ba8c49a1400dbc824d
    reason: The context still expresses user-authored ordered musical structure and reminders.
      Additional performed parts and private guards extend its detail without automatic
      transcription or a new context identity.
  - id: BC-LIBRARY
    cause: CON-PLATFORM
    relationship: applies-to
    digest: sha256:ae6c307b94a4dfbe98ec1bee2eac14e2d1754b950f2bdd9e454c3431809f5bd4
    cause-digest: sha256:635e50e18ab13a558ff7fb34323fb9c54c651858935b841272e22ce860067fbb
    reason: The context continues to own identified songs and non-owning repertoire membership. Added
      private capability/session constraints govern its operations without introducing a public
      catalogue or changing its responsibility.
  - id: BC-SKETCH
    cause: CON-PLATFORM
    relationship: applies-to
    digest: sha256:b22f7b77f262d51838dfcf3917347c5637b393f114d2fa2a0bd17618bb21707d
    cause-digest: sha256:635e50e18ab13a558ff7fb34323fb9c54c651858935b841272e22ce860067fbb
    reason: The context still expresses user-authored ordered musical structure and reminders.
      Additional performed parts and private guards extend its detail without automatic
      transcription or a new context identity.
  - id: BC-LIBRARY
    cause: CON-SCOPE
    relationship: applies-to
    digest: sha256:ae6c307b94a4dfbe98ec1bee2eac14e2d1754b950f2bdd9e454c3431809f5bd4
    cause-digest: sha256:2934fbcf8f42cd477a77c5f9fb3fecc17beca485b243c2031279056347655216
    reason: The context continues to own identified songs and non-owning repertoire membership. Added
      private capability/session constraints govern its operations without introducing a public
      catalogue or changing its responsibility.
  - id: BC-SKETCH
    cause: CON-SCOPE
    relationship: applies-to
    digest: sha256:b22f7b77f262d51838dfcf3917347c5637b393f114d2fa2a0bd17618bb21707d
    cause-digest: sha256:2934fbcf8f42cd477a77c5f9fb3fecc17beca485b243c2031279056347655216
    reason: The context still expresses user-authored ordered musical structure and reminders.
      Additional performed parts and private guards extend its detail without automatic
      transcription or a new context identity.
  - id: UC-PDF
    cause: BC-RECOVERY
    relationship: bounded-context
    digest: sha256:26a5a12df99ab22eb72daa5e4fb48587a0a47942d74d8d9f717d26489b201062
    cause-digest: sha256:d04a791ff84b254a041561b54cf2371da96c0ab165c98460171f63f059f7989d
    reason: The existing optional local PDF journey, bounds and refusal/preservation outcomes remain
      unchanged. Broader song/private recovery rules add guards without converting local attachment
      behavior into a service guarantee.
  - id: SB-BACKUP-IMPORT
    cause: LC-LIBRARY
    relationship: covers-transition.lifecycle
    digest: sha256:a91c468115f1a66e2222f71eb936d54052e1959dfe93867da92c93476ac28d3e
    cause-digest: sha256:40aaed3bcc086823445f840db9aa19d0e7bdf28ac94bd8ebfa8848b5702c711f
    reason: The existing explicitly confirmed version-1 anonymous library-envelope
      import/export/cancel/refusal case remains supported. New private claim is a separately
      authorized path; local import never conveys ownership, grants or a service acknowledgement.
  - id: SB-BACKUP-IMPORT-EMPTY
    cause: LC-LIBRARY
    relationship: covers-transition.lifecycle
    digest: sha256:94feeffb023102ad9861da55203c10d9df2f94ffe120ab962c346aa331908c6d
    cause-digest: sha256:40aaed3bcc086823445f840db9aa19d0e7bdf28ac94bd8ebfa8848b5702c711f
    reason: The existing explicitly confirmed version-1 anonymous library-envelope
      import/export/cancel/refusal case remains supported. New private claim is a separately
      authorized path; local import never conveys ownership, grants or a service acknowledgement.
  - id: SB-SONG-ADD
    cause: LC-LIBRARY
    relationship: covers-transition.lifecycle
    digest: sha256:3c802dc04e6f6ee9f01574e60c2a55f3c74c1614762f929575dffdf87b78efe9
    cause-digest: sha256:40aaed3bcc086823445f840db9aa19d0e7bdf28ac94bd8ebfa8848b5702c711f
    reason: Existing anonymous create/edit/name/identity cases preserve stable identities, references
      and unchanged owned content. Private permissions and retained deletion add separately
      specified guards/behaviors, not fabricated content or changed creation/edit outcomes.
  - id: SB-SONG-CREATE
    cause: LC-LIBRARY
    relationship: covers-transition.lifecycle
    digest: sha256:d95b74331bb7efbb0806b44d35f116106618a1460ddc58b6a0fe7ec9183decba
    cause-digest: sha256:40aaed3bcc086823445f840db9aa19d0e7bdf28ac94bd8ebfa8848b5702c711f
    reason: Existing anonymous create/edit/name/identity cases preserve stable identities, references
      and unchanged owned content. Private permissions and retained deletion add separately
      specified guards/behaviors, not fabricated content or changed creation/edit outcomes.
  - id: TERM-ATTACHMENT
    cause: BC-RECOVERY
    relationship: defined-in
    digest: sha256:5d434a7bf0cc094ce878496a367fbcd5d2969c1adedc5ba7386d63ab4d4e1c4a
    cause-digest: sha256:d04a791ff84b254a041561b54cf2371da96c0ab165c98460171f63f059f7989d
    reason: The optional local PDF identity and remembered page are unchanged; admitting private
      recovery does not migrate or redefine attachments.
  - id: UC-PDF
    cause: BR-DURABILITY
    relationship: governed-by
    digest: sha256:26a5a12df99ab22eb72daa5e4fb48587a0a47942d74d8d9f717d26489b201062
    cause-digest: sha256:6b075527861da086b9571e8d117c7844348a437e363423bca46f60cc83b02e0b
    reason: The existing optional local PDF journey, bounds and refusal/preservation outcomes remain
      unchanged. Broader song/private recovery rules add guards without converting local attachment
      behavior into a service guarantee.
  - id: UC-ANNOTATIONS
    cause: BR-IDENTITY
    relationship: governed-by
    digest: sha256:1b3e61e884b4aa938f3b9a81d07f90523bcd46514071f5d953d98cfbd7e0d715
    cause-digest: sha256:6b3d38400ae82fdc926ae2b7a9eee5d02e684c50502545f323adc41cea150768
    reason: Stable section identity, notes, positive repeat bounds, order and guarded presence
      transitions remain unchanged. Additional event/arrangement detail must preserve existing
      associations and the other sections; invalid operations still refuse atomically.
  - id: UC-MEMBERSHIP
    cause: BR-IDENTITY
    relationship: governed-by
    digest: sha256:e3f170c1793e24b326a5fe28a985095a50ed7757cfd75d028c9cac9a6f4d8447
    cause-digest: sha256:6b3d38400ae82fdc926ae2b7a9eee5d02e684c50502545f323adc41cea150768
    reason: "Repertoire identity and non-owning membership behavior are unchanged: membership never
      copies/deletes a song and duplicate or missing references still refuse. Private authorization
      is an additional guard, not a change to these anonymous local outcomes."
  - id: UC-REPERTOIRES
    cause: BR-IDENTITY
    relationship: governed-by
    digest: sha256:282d54489055a7d95fc9eb2ee5516b7872e304e9a5171d8643e22c350c358049
    cause-digest: sha256:6b3d38400ae82fdc926ae2b7a9eee5d02e684c50502545f323adc41cea150768
    reason: "Repertoire identity and non-owning membership behavior are unchanged: membership never
      copies/deletes a song and duplicate or missing references still refuse. Private authorization
      is an additional guard, not a change to these anonymous local outcomes."
  - id: SB-BACKUP-CANCEL
    cause: BR-BACKUP
    relationship: illustrates
    digest: sha256:a1b39939e1798f96a3d4d4a6d0eea6f09ba4156293d49b05ae692953a1975806
    cause-digest: sha256:0ca300361becac0a9858d098ab1e029b5bc1dfe41a06a58ecc40408fee32ed3b
    reason: The existing explicitly confirmed version-1 anonymous library-envelope
      import/export/cancel/refusal case remains supported. New private claim is a separately
      authorized path; local import never conveys ownership, grants or a service acknowledgement.
  - id: SB-BACKUP-EXPORT
    cause: BR-BACKUP
    relationship: illustrates
    digest: sha256:4dc53a109e0e344b95c117d7a429c92b3b54d4ce8856cf00104b501d13f86237
    cause-digest: sha256:0ca300361becac0a9858d098ab1e029b5bc1dfe41a06a58ecc40408fee32ed3b
    reason: The existing explicitly confirmed version-1 anonymous library-envelope
      import/export/cancel/refusal case remains supported. New private claim is a separately
      authorized path; local import never conveys ownership, grants or a service acknowledgement.
  - id: SB-BACKUP-IMPORT
    cause: BR-BACKUP
    relationship: illustrates
    digest: sha256:a91c468115f1a66e2222f71eb936d54052e1959dfe93867da92c93476ac28d3e
    cause-digest: sha256:0ca300361becac0a9858d098ab1e029b5bc1dfe41a06a58ecc40408fee32ed3b
    reason: The existing explicitly confirmed version-1 anonymous library-envelope
      import/export/cancel/refusal case remains supported. New private claim is a separately
      authorized path; local import never conveys ownership, grants or a service acknowledgement.
  - id: SB-BACKUP-IMPORT-EMPTY
    cause: BR-BACKUP
    relationship: illustrates
    digest: sha256:94feeffb023102ad9861da55203c10d9df2f94ffe120ab962c346aa331908c6d
    cause-digest: sha256:0ca300361becac0a9858d098ab1e029b5bc1dfe41a06a58ecc40408fee32ed3b
    reason: The existing explicitly confirmed version-1 anonymous library-envelope
      import/export/cancel/refusal case remains supported. New private claim is a separately
      authorized path; local import never conveys ownership, grants or a service acknowledgement.
  - id: SB-BACKUP-REJECT
    cause: BR-BACKUP
    relationship: illustrates
    digest: sha256:f6b3ca347fe8d7d709509474f84ae9b7d4ecfc01ac4a66c3af5de77c20784e5d
    cause-digest: sha256:0ca300361becac0a9858d098ab1e029b5bc1dfe41a06a58ecc40408fee32ed3b
    reason: The existing explicitly confirmed version-1 anonymous library-envelope
      import/export/cancel/refusal case remains supported. New private claim is a separately
      authorized path; local import never conveys ownership, grants or a service acknowledgement.
  - id: SB-CHORD-ASSIGN
    cause: BR-CHORDS
    relationship: illustrates
    digest: sha256:adbbe7a3f7aef1a2a289f8ee00870b0ce7ad8893343d70b3ca0f1d16c524423b
    cause-digest: sha256:543566a20181aa25eab6cc446d8ac467b1ca911632744dd957a0ab3388e9d55c
    reason: Accepted ordered major/minor triads and the selected major-to-minor edit remain exact
      supported subsets of the enlarged catalogue. Spelling, pitch classes and unaffected chord
      order/content keep their previous outcomes.
  - id: SB-CHORD-MODIFY
    cause: BR-CHORDS
    relationship: illustrates
    digest: sha256:22362c97fc63f3f2c09e70daf1b916611f624e2a27d7304ad1df7e35ee729d91
    cause-digest: sha256:543566a20181aa25eab6cc446d8ac467b1ca911632744dd957a0ab3388e9d55c
    reason: Accepted ordered major/minor triads and the selected major-to-minor edit remain exact
      supported subsets of the enlarged catalogue. Spelling, pitch classes and unaffected chord
      order/content keep their previous outcomes.
  - id: SB-BACKUP-CANCEL
    cause: BR-DURABILITY
    relationship: illustrates
    digest: sha256:a1b39939e1798f96a3d4d4a6d0eea6f09ba4156293d49b05ae692953a1975806
    cause-digest: sha256:6b075527861da086b9571e8d117c7844348a437e363423bca46f60cc83b02e0b
    reason: The existing explicitly confirmed version-1 anonymous library-envelope
      import/export/cancel/refusal case remains supported. New private claim is a separately
      authorized path; local import never conveys ownership, grants or a service acknowledgement.
  - id: SB-BACKUP-EXPORT
    cause: BR-DURABILITY
    relationship: illustrates
    digest: sha256:4dc53a109e0e344b95c117d7a429c92b3b54d4ce8856cf00104b501d13f86237
    cause-digest: sha256:6b075527861da086b9571e8d117c7844348a437e363423bca46f60cc83b02e0b
    reason: The existing explicitly confirmed version-1 anonymous library-envelope
      import/export/cancel/refusal case remains supported. New private claim is a separately
      authorized path; local import never conveys ownership, grants or a service acknowledgement.
  - id: SB-BACKUP-IMPORT
    cause: BR-DURABILITY
    relationship: illustrates
    digest: sha256:a91c468115f1a66e2222f71eb936d54052e1959dfe93867da92c93476ac28d3e
    cause-digest: sha256:6b075527861da086b9571e8d117c7844348a437e363423bca46f60cc83b02e0b
    reason: The existing explicitly confirmed version-1 anonymous library-envelope
      import/export/cancel/refusal case remains supported. New private claim is a separately
      authorized path; local import never conveys ownership, grants or a service acknowledgement.
  - id: SB-BACKUP-IMPORT-EMPTY
    cause: BR-DURABILITY
    relationship: illustrates
    digest: sha256:94feeffb023102ad9861da55203c10d9df2f94ffe120ab962c346aa331908c6d
    cause-digest: sha256:6b075527861da086b9571e8d117c7844348a437e363423bca46f60cc83b02e0b
    reason: The existing explicitly confirmed version-1 anonymous library-envelope
      import/export/cancel/refusal case remains supported. New private claim is a separately
      authorized path; local import never conveys ownership, grants or a service acknowledgement.
  - id: SB-BACKUP-REJECT
    cause: BR-DURABILITY
    relationship: illustrates
    digest: sha256:f6b3ca347fe8d7d709509474f84ae9b7d4ecfc01ac4a66c3af5de77c20784e5d
    cause-digest: sha256:6b075527861da086b9571e8d117c7844348a437e363423bca46f60cc83b02e0b
    reason: The existing explicitly confirmed version-1 anonymous library-envelope
      import/export/cancel/refusal case remains supported. New private claim is a separately
      authorized path; local import never conveys ownership, grants or a service acknowledgement.
  - id: SB-PDF-ATTACH
    cause: BR-DURABILITY
    relationship: illustrates
    digest: sha256:bb0ae4e82407c6d62f96564db7644e8d0d8684bc8f3e8a7166570e3ea4210ce5
    cause-digest: sha256:6b075527861da086b9571e8d117c7844348a437e363423bca46f60cc83b02e0b
    reason: The existing optional local PDF journey, bounds and refusal/preservation outcomes remain
      unchanged. Broader song/private recovery rules add guards without converting local attachment
      behavior into a service guarantee.
  - id: SB-PDF-NAVIGATE
    cause: BR-DURABILITY
    relationship: illustrates
    digest: sha256:36fae57b85fc19e0eed3766456b219721211ad4dd5c7123da9e7bdc357122234
    cause-digest: sha256:6b075527861da086b9571e8d117c7844348a437e363423bca46f60cc83b02e0b
    reason: The existing optional local PDF journey, bounds and refusal/preservation outcomes remain
      unchanged. Broader song/private recovery rules add guards without converting local attachment
      behavior into a service guarantee.
  - id: SB-PDF-REJECT
    cause: BR-DURABILITY
    relationship: illustrates
    digest: sha256:ad3173b24391233d5316ae7d2f1dece023d35efcf0e3f7931e521839dd41a73d
    cause-digest: sha256:6b075527861da086b9571e8d117c7844348a437e363423bca46f60cc83b02e0b
    reason: The existing optional local PDF journey, bounds and refusal/preservation outcomes remain
      unchanged. Broader song/private recovery rules add guards without converting local attachment
      behavior into a service guarantee.
  - id: SB-PERSIST-CONFLICT
    cause: BR-DURABILITY
    relationship: illustrates
    digest: sha256:3a7fdc4b47da270a63bc50bf681af96793fb46a8283af9093b01d9959f026b37
    cause-digest: sha256:6b075527861da086b9571e8d117c7844348a437e363423bca46f60cc83b02e0b
    reason: This existing anonymous local-storage success/refusal case remains valid and separate from
      new private service commits. Broader durability preserves its previous revision, explicit
      failure and recoverable/exportable work outcomes; it supplies no private authority.
  - id: SB-PERSIST-FAILURE
    cause: BR-DURABILITY
    relationship: illustrates
    digest: sha256:31db2bb51e3c0495ac05dc1b53938c2de756eef9176e3ba747f6b877ee014357
    cause-digest: sha256:6b075527861da086b9571e8d117c7844348a437e363423bca46f60cc83b02e0b
    reason: This existing anonymous local-storage success/refusal case remains valid and separate from
      new private service commits. Broader durability preserves its previous revision, explicit
      failure and recoverable/exportable work outcomes; it supplies no private authority.
  - id: SB-RECOVERY-INVALID
    cause: BR-DURABILITY
    relationship: illustrates
    digest: sha256:0ad0f1f37ef7919e9cbdc0708cc377af07901380f00504ed86d24617bc767ec5
    cause-digest: sha256:6b075527861da086b9571e8d117c7844348a437e363423bca46f60cc83b02e0b
    reason: This existing anonymous local-storage success/refusal case remains valid and separate from
      new private service commits. Broader durability preserves its previous revision, explicit
      failure and recoverable/exportable work outcomes; it supplies no private authority.
  - id: SB-ANNOTATIONS
    cause: BR-IDENTITY
    relationship: illustrates
    digest: sha256:e9f7eeba4ec89ac374cbbe880b1a4d2899ca92f1c6fd71231d9a664a94b8660f
    cause-digest: sha256:6b3d38400ae82fdc926ae2b7a9eee5d02e684c50502545f323adc41cea150768
    reason: Stable section identity, notes, positive repeat bounds, order and guarded presence
      transitions remain unchanged. Additional event/arrangement detail must preserve existing
      associations and the other sections; invalid operations still refuse atomically.
  - id: SB-BLANK-NAME
    cause: BR-IDENTITY
    relationship: illustrates
    digest: sha256:df469f85a539ac9aabbc71658c59485c3a0232a88349ce62b0ac126d6897f04c
    cause-digest: sha256:6b3d38400ae82fdc926ae2b7a9eee5d02e684c50502545f323adc41cea150768
    reason: Existing anonymous create/edit/name/identity cases preserve stable identities, references
      and unchanged owned content. Private permissions and retained deletion add separately
      specified guards/behaviors, not fabricated content or changed creation/edit outcomes.
  - id: SB-MEMBERSHIP-ADD
    cause: BR-IDENTITY
    relationship: illustrates
    digest: sha256:f0cc7537b2efb9033a66e7f95e4d2ba68c92037edd808c571fa4b9f3c3eddbbe
    cause-digest: sha256:6b3d38400ae82fdc926ae2b7a9eee5d02e684c50502545f323adc41cea150768
    reason: "Repertoire identity and non-owning membership behavior are unchanged: membership never
      copies/deletes a song and duplicate or missing references still refuse. Private authorization
      is an additional guard, not a change to these anonymous local outcomes."
  - id: SB-MEMBERSHIP-DUPLICATE
    cause: BR-IDENTITY
    relationship: illustrates
    digest: sha256:cf13783a3af08774e6216bb726af792566480d5ba2d3a236983ae749f241366b
    cause-digest: sha256:6b3d38400ae82fdc926ae2b7a9eee5d02e684c50502545f323adc41cea150768
    reason: "Repertoire identity and non-owning membership behavior are unchanged: membership never
      copies/deletes a song and duplicate or missing references still refuse. Private authorization
      is an additional guard, not a change to these anonymous local outcomes."
  - id: SB-MEMBERSHIP-REMOVE
    cause: BR-IDENTITY
    relationship: illustrates
    digest: sha256:76ff8dfb68346d6bcaa2716da66062cd284902f6bdf5003a77538132041bd71c
    cause-digest: sha256:6b3d38400ae82fdc926ae2b7a9eee5d02e684c50502545f323adc41cea150768
    reason: "Repertoire identity and non-owning membership behavior are unchanged: membership never
      copies/deletes a song and duplicate or missing references still refuse. Private authorization
      is an additional guard, not a change to these anonymous local outcomes."
  - id: SB-MISSING-IDENTITY
    cause: BR-IDENTITY
    relationship: illustrates
    digest: sha256:fff8b2ea2df48cf8b63bb2b5ed2ea1f834b2b24389ed9e300fba67bb6d78c66d
    cause-digest: sha256:6b3d38400ae82fdc926ae2b7a9eee5d02e684c50502545f323adc41cea150768
    reason: Existing anonymous create/edit/name/identity cases preserve stable identities, references
      and unchanged owned content. Private permissions and retained deletion add separately
      specified guards/behaviors, not fabricated content or changed creation/edit outcomes.
  - id: SB-REPERTOIRE-CREATE
    cause: BR-IDENTITY
    relationship: illustrates
    digest: sha256:37922d0d79d173763965250a8b5fa744c0f62775ba78c6c3ae7e4e0db182d86a
    cause-digest: sha256:6b3d38400ae82fdc926ae2b7a9eee5d02e684c50502545f323adc41cea150768
    reason: "Repertoire identity and non-owning membership behavior are unchanged: membership never
      copies/deletes a song and duplicate or missing references still refuse. Private authorization
      is an additional guard, not a change to these anonymous local outcomes."
  - id: SB-REPERTOIRE-DELETE
    cause: BR-IDENTITY
    relationship: illustrates
    digest: sha256:3203bf7d104b07abed94f2f2beb00b92f33eead1e90981e88f123fe3aeda62c6
    cause-digest: sha256:6b3d38400ae82fdc926ae2b7a9eee5d02e684c50502545f323adc41cea150768
    reason: "Repertoire identity and non-owning membership behavior are unchanged: membership never
      copies/deletes a song and duplicate or missing references still refuse. Private authorization
      is an additional guard, not a change to these anonymous local outcomes."
  - id: SB-REPERTOIRE-RENAME
    cause: BR-IDENTITY
    relationship: illustrates
    digest: sha256:96865538af194f8c287f62e4dc44e4341fab5700fb7f306801b1411f2e9a27ba
    cause-digest: sha256:6b3d38400ae82fdc926ae2b7a9eee5d02e684c50502545f323adc41cea150768
    reason: "Repertoire identity and non-owning membership behavior are unchanged: membership never
      copies/deletes a song and duplicate or missing references still refuse. Private authorization
      is an additional guard, not a change to these anonymous local outcomes."
  - id: SB-SECTION-FIRST
    cause: BR-IDENTITY
    relationship: illustrates
    digest: sha256:142013b9449dc02eff8f99b7752661694163795e29a55ef00daafc6f63e7ac4c
    cause-digest: sha256:6b3d38400ae82fdc926ae2b7a9eee5d02e684c50502545f323adc41cea150768
    reason: Stable section identity, notes, positive repeat bounds, order and guarded presence
      transitions remain unchanged. Additional event/arrangement detail must preserve existing
      associations and the other sections; invalid operations still refuse atomically.
  - id: SB-SECTION-INSERT
    cause: BR-IDENTITY
    relationship: illustrates
    digest: sha256:419cab857698e48ddda21d1b82e507163f407c0d6459f16785fb096c9324427a
    cause-digest: sha256:6b3d38400ae82fdc926ae2b7a9eee5d02e684c50502545f323adc41cea150768
    reason: Stable section identity, notes, positive repeat bounds, order and guarded presence
      transitions remain unchanged. Additional event/arrangement detail must preserve existing
      associations and the other sections; invalid operations still refuse atomically.
  - id: SB-SECTION-INVALID-ORDER
    cause: BR-IDENTITY
    relationship: illustrates
    digest: sha256:b504ff2ff04dee9f4f02842b169ef787cff8f53943404f0323b0f946bda08944
    cause-digest: sha256:6b3d38400ae82fdc926ae2b7a9eee5d02e684c50502545f323adc41cea150768
    reason: Stable section identity, notes, positive repeat bounds, order and guarded presence
      transitions remain unchanged. Additional event/arrangement detail must preserve existing
      associations and the other sections; invalid operations still refuse atomically.
  - id: SB-SECTION-MODIFY
    cause: BR-IDENTITY
    relationship: illustrates
    digest: sha256:d39296e86c35c16c859c4f1c4294a2df9b5edcd9304a505d7b4d5b985274a95b
    cause-digest: sha256:6b3d38400ae82fdc926ae2b7a9eee5d02e684c50502545f323adc41cea150768
    reason: Stable section identity, notes, positive repeat bounds, order and guarded presence
      transitions remain unchanged. Additional event/arrangement detail must preserve existing
      associations and the other sections; invalid operations still refuse atomically.
  - id: SB-SECTION-REMOVE
    cause: BR-IDENTITY
    relationship: illustrates
    digest: sha256:a9ebfc7be7dad88eaca3e230d20e904c697d133790d193f4cb46dcf495708e77
    cause-digest: sha256:6b3d38400ae82fdc926ae2b7a9eee5d02e684c50502545f323adc41cea150768
    reason: Stable section identity, notes, positive repeat bounds, order and guarded presence
      transitions remain unchanged. Additional event/arrangement detail must preserve existing
      associations and the other sections; invalid operations still refuse atomically.
  - id: SB-SECTION-REMOVE-LAST
    cause: BR-IDENTITY
    relationship: illustrates
    digest: sha256:4857e323f1014f93ab8b8e8e72e692809d2597c653a7cea01de470132b094e66
    cause-digest: sha256:6b3d38400ae82fdc926ae2b7a9eee5d02e684c50502545f323adc41cea150768
    reason: Stable section identity, notes, positive repeat bounds, order and guarded presence
      transitions remain unchanged. Additional event/arrangement detail must preserve existing
      associations and the other sections; invalid operations still refuse atomically.
  - id: SB-SECTION-REORDER
    cause: BR-IDENTITY
    relationship: illustrates
    digest: sha256:610413c7eae977e5760aa413f58ec499375fdafe0952dca8cbc7591cbda639e5
    cause-digest: sha256:6b3d38400ae82fdc926ae2b7a9eee5d02e684c50502545f323adc41cea150768
    reason: Stable section identity, notes, positive repeat bounds, order and guarded presence
      transitions remain unchanged. Additional event/arrangement detail must preserve existing
      associations and the other sections; invalid operations still refuse atomically.
  - id: SB-SECTION-REPEAT-BOUNDARY
    cause: BR-IDENTITY
    relationship: illustrates
    digest: sha256:8290678c017a749dd78b1b1d6ef192b85a7ec141d1cc1f0a1926c91c957217c7
    cause-digest: sha256:6b3d38400ae82fdc926ae2b7a9eee5d02e684c50502545f323adc41cea150768
    reason: Stable section identity, notes, positive repeat bounds, order and guarded presence
      transitions remain unchanged. Additional event/arrangement detail must preserve existing
      associations and the other sections; invalid operations still refuse atomically.
  - id: SB-SONG-ADD
    cause: BR-IDENTITY
    relationship: illustrates
    digest: sha256:3c802dc04e6f6ee9f01574e60c2a55f3c74c1614762f929575dffdf87b78efe9
    cause-digest: sha256:6b3d38400ae82fdc926ae2b7a9eee5d02e684c50502545f323adc41cea150768
    reason: Existing anonymous create/edit/name/identity cases preserve stable identities, references
      and unchanged owned content. Private permissions and retained deletion add separately
      specified guards/behaviors, not fabricated content or changed creation/edit outcomes.
  - id: SB-SONG-CREATE
    cause: BR-IDENTITY
    relationship: illustrates
    digest: sha256:d95b74331bb7efbb0806b44d35f116106618a1460ddc58b6a0fe7ec9183decba
    cause-digest: sha256:6b3d38400ae82fdc926ae2b7a9eee5d02e684c50502545f323adc41cea150768
    reason: Existing anonymous create/edit/name/identity cases preserve stable identities, references
      and unchanged owned content. Private permissions and retained deletion add separately
      specified guards/behaviors, not fabricated content or changed creation/edit outcomes.
  - id: SB-SONG-EDIT
    cause: BR-IDENTITY
    relationship: illustrates
    digest: sha256:1e27a22da49c7b805dcc4023c563afa4b2ec78936ca42473957617aecb9fa33a
    cause-digest: sha256:6b3d38400ae82fdc926ae2b7a9eee5d02e684c50502545f323adc41cea150768
    reason: Existing anonymous create/edit/name/identity cases preserve stable identities, references
      and unchanged owned content. Private permissions and retained deletion add separately
      specified guards/behaviors, not fabricated content or changed creation/edit outcomes.
  - id: SB-SECTION-FIRST
    cause: BR-STRUCTURE
    relationship: illustrates
    digest: sha256:142013b9449dc02eff8f99b7752661694163795e29a55ef00daafc6f63e7ac4c
    cause-digest: sha256:db3410bd8a3fe7f3da94e63ee8804b1c75f03b8f7dd1e7858cfd05aed03a0686
    reason: Stable section identity, notes, positive repeat bounds, order and guarded presence
      transitions remain unchanged. Additional event/arrangement detail must preserve existing
      associations and the other sections; invalid operations still refuse atomically.
  - id: SB-SECTION-INSERT
    cause: BR-STRUCTURE
    relationship: illustrates
    digest: sha256:419cab857698e48ddda21d1b82e507163f407c0d6459f16785fb096c9324427a
    cause-digest: sha256:db3410bd8a3fe7f3da94e63ee8804b1c75f03b8f7dd1e7858cfd05aed03a0686
    reason: Stable section identity, notes, positive repeat bounds, order and guarded presence
      transitions remain unchanged. Additional event/arrangement detail must preserve existing
      associations and the other sections; invalid operations still refuse atomically.
  - id: SB-SECTION-INVALID-ORDER
    cause: BR-STRUCTURE
    relationship: illustrates
    digest: sha256:b504ff2ff04dee9f4f02842b169ef787cff8f53943404f0323b0f946bda08944
    cause-digest: sha256:db3410bd8a3fe7f3da94e63ee8804b1c75f03b8f7dd1e7858cfd05aed03a0686
    reason: Stable section identity, notes, positive repeat bounds, order and guarded presence
      transitions remain unchanged. Additional event/arrangement detail must preserve existing
      associations and the other sections; invalid operations still refuse atomically.
  - id: SB-SECTION-MODIFY
    cause: BR-STRUCTURE
    relationship: illustrates
    digest: sha256:d39296e86c35c16c859c4f1c4294a2df9b5edcd9304a505d7b4d5b985274a95b
    cause-digest: sha256:db3410bd8a3fe7f3da94e63ee8804b1c75f03b8f7dd1e7858cfd05aed03a0686
    reason: Stable section identity, notes, positive repeat bounds, order and guarded presence
      transitions remain unchanged. Additional event/arrangement detail must preserve existing
      associations and the other sections; invalid operations still refuse atomically.
  - id: SB-SECTION-REMOVE
    cause: BR-STRUCTURE
    relationship: illustrates
    digest: sha256:a9ebfc7be7dad88eaca3e230d20e904c697d133790d193f4cb46dcf495708e77
    cause-digest: sha256:db3410bd8a3fe7f3da94e63ee8804b1c75f03b8f7dd1e7858cfd05aed03a0686
    reason: Stable section identity, notes, positive repeat bounds, order and guarded presence
      transitions remain unchanged. Additional event/arrangement detail must preserve existing
      associations and the other sections; invalid operations still refuse atomically.
  - id: SB-SECTION-REMOVE-LAST
    cause: BR-STRUCTURE
    relationship: illustrates
    digest: sha256:4857e323f1014f93ab8b8e8e72e692809d2597c653a7cea01de470132b094e66
    cause-digest: sha256:db3410bd8a3fe7f3da94e63ee8804b1c75f03b8f7dd1e7858cfd05aed03a0686
    reason: Stable section identity, notes, positive repeat bounds, order and guarded presence
      transitions remain unchanged. Additional event/arrangement detail must preserve existing
      associations and the other sections; invalid operations still refuse atomically.
  - id: SB-SECTION-REORDER
    cause: BR-STRUCTURE
    relationship: illustrates
    digest: sha256:610413c7eae977e5760aa413f58ec499375fdafe0952dca8cbc7591cbda639e5
    cause-digest: sha256:db3410bd8a3fe7f3da94e63ee8804b1c75f03b8f7dd1e7858cfd05aed03a0686
    reason: Stable section identity, notes, positive repeat bounds, order and guarded presence
      transitions remain unchanged. Additional event/arrangement detail must preserve existing
      associations and the other sections; invalid operations still refuse atomically.
  - id: SB-SECTION-REPEAT-BOUNDARY
    cause: BR-STRUCTURE
    relationship: illustrates
    digest: sha256:8290678c017a749dd78b1b1d6ef192b85a7ec141d1cc1f0a1926c91c957217c7
    cause-digest: sha256:db3410bd8a3fe7f3da94e63ee8804b1c75f03b8f7dd1e7858cfd05aed03a0686
    reason: Stable section identity, notes, positive repeat bounds, order and guarded presence
      transitions remain unchanged. Additional event/arrangement detail must preserve existing
      associations and the other sections; invalid operations still refuse atomically.
  - id: SB-BACKUP-CANCEL
    cause: UC-BACKUP
    relationship: illustrates
    digest: sha256:a1b39939e1798f96a3d4d4a6d0eea6f09ba4156293d49b05ae692953a1975806
    cause-digest: sha256:e990e6964f53a63968975d1e12729cdb299fe31d99856efad9539ab4ecd8a6d8
    reason: The existing explicitly confirmed version-1 anonymous library-envelope
      import/export/cancel/refusal case remains supported. New private claim is a separately
      authorized path; local import never conveys ownership, grants or a service acknowledgement.
  - id: SB-BACKUP-EXPORT
    cause: UC-BACKUP
    relationship: illustrates
    digest: sha256:4dc53a109e0e344b95c117d7a429c92b3b54d4ce8856cf00104b501d13f86237
    cause-digest: sha256:e990e6964f53a63968975d1e12729cdb299fe31d99856efad9539ab4ecd8a6d8
    reason: The existing explicitly confirmed version-1 anonymous library-envelope
      import/export/cancel/refusal case remains supported. New private claim is a separately
      authorized path; local import never conveys ownership, grants or a service acknowledgement.
  - id: SB-BACKUP-IMPORT
    cause: UC-BACKUP
    relationship: illustrates
    digest: sha256:a91c468115f1a66e2222f71eb936d54052e1959dfe93867da92c93476ac28d3e
    cause-digest: sha256:e990e6964f53a63968975d1e12729cdb299fe31d99856efad9539ab4ecd8a6d8
    reason: The existing explicitly confirmed version-1 anonymous library-envelope
      import/export/cancel/refusal case remains supported. New private claim is a separately
      authorized path; local import never conveys ownership, grants or a service acknowledgement.
  - id: SB-BACKUP-IMPORT-EMPTY
    cause: UC-BACKUP
    relationship: illustrates
    digest: sha256:94feeffb023102ad9861da55203c10d9df2f94ffe120ab962c346aa331908c6d
    cause-digest: sha256:e990e6964f53a63968975d1e12729cdb299fe31d99856efad9539ab4ecd8a6d8
    reason: The existing explicitly confirmed version-1 anonymous library-envelope
      import/export/cancel/refusal case remains supported. New private claim is a separately
      authorized path; local import never conveys ownership, grants or a service acknowledgement.
  - id: SB-BACKUP-REJECT
    cause: UC-BACKUP
    relationship: illustrates
    digest: sha256:f6b3ca347fe8d7d709509474f84ae9b7d4ecfc01ac4a66c3af5de77c20784e5d
    cause-digest: sha256:e990e6964f53a63968975d1e12729cdb299fe31d99856efad9539ab4ecd8a6d8
    reason: The existing explicitly confirmed version-1 anonymous library-envelope
      import/export/cancel/refusal case remains supported. New private claim is a separately
      authorized path; local import never conveys ownership, grants or a service acknowledgement.
  - id: SB-CHORD-ASSIGN
    cause: UC-CHORDS
    relationship: illustrates
    digest: sha256:adbbe7a3f7aef1a2a289f8ee00870b0ce7ad8893343d70b3ca0f1d16c524423b
    cause-digest: sha256:8824f28ac95b8a1f38fa68249fdf8e32441cfc3a4efa5b9e20ef10d81a392ae8
    reason: Accepted ordered major/minor triads and the selected major-to-minor edit remain exact
      supported subsets of the enlarged catalogue. Spelling, pitch classes and unaffected chord
      order/content keep their previous outcomes.
  - id: SB-CHORD-MODIFY
    cause: UC-CHORDS
    relationship: illustrates
    digest: sha256:22362c97fc63f3f2c09e70daf1b916611f624e2a27d7304ad1df7e35ee729d91
    cause-digest: sha256:8824f28ac95b8a1f38fa68249fdf8e32441cfc3a4efa5b9e20ef10d81a392ae8
    reason: Accepted ordered major/minor triads and the selected major-to-minor edit remain exact
      supported subsets of the enlarged catalogue. Spelling, pitch classes and unaffected chord
      order/content keep their previous outcomes.
  - id: SB-EDIT-RESUME
    cause: UC-CONSULT
    relationship: illustrates
    digest: sha256:04360461982853baddc7e4ddce8a0f0359b824ba917bb581edb2bb5dd00d585a
    cause-digest: sha256:d27ea53e1c307569b2fe941ea94eec4bb0e98e6478f2d947ec7123273f419562
    reason: Consultation remains read-only and deliberate mode switching never changes music. New
      synchronized navigation and private authority do not weaken the accepted edit-mode admission
      guard.
  - id: SB-PERFORMANCE
    cause: UC-CONSULT
    relationship: illustrates
    digest: sha256:c004c86080428dd85d0c3b42ce24be640955fc52f3d9245f05db6e90e6344355
    cause-digest: sha256:d27ea53e1c307569b2fe941ea94eec4bb0e98e6478f2d947ec7123273f419562
    reason: Consultation remains read-only and deliberate mode switching never changes music. New
      synchronized navigation and private authority do not weaken the accepted edit-mode admission
      guard.
  - id: SB-PERFORMANCE-REJECT
    cause: UC-CONSULT
    relationship: illustrates
    digest: sha256:392da1d92a3d7973d37b59e113edf537539262abe257dddd74b9a8eaf925b6d9
    cause-digest: sha256:d27ea53e1c307569b2fe941ea94eec4bb0e98e6478f2d947ec7123273f419562
    reason: Consultation remains read-only and deliberate mode switching never changes music. New
      synchronized navigation and private authority do not weaken the accepted edit-mode admission
      guard.
  - id: SB-PERSIST-CONFLICT
    cause: UC-PERSIST
    relationship: illustrates
    digest: sha256:3a7fdc4b47da270a63bc50bf681af96793fb46a8283af9093b01d9959f026b37
    cause-digest: sha256:11f7381952aca132adad468fc62c648341ccc68c29bdc3b805020ee0997c3d0b
    reason: This existing anonymous local-storage success/refusal case remains valid and separate from
      new private service commits. Broader durability preserves its previous revision, explicit
      failure and recoverable/exportable work outcomes; it supplies no private authority.
  - id: SB-PERSIST-FAILURE
    cause: UC-PERSIST
    relationship: illustrates
    digest: sha256:31db2bb51e3c0495ac05dc1b53938c2de756eef9176e3ba747f6b877ee014357
    cause-digest: sha256:11f7381952aca132adad468fc62c648341ccc68c29bdc3b805020ee0997c3d0b
    reason: This existing anonymous local-storage success/refusal case remains valid and separate from
      new private service commits. Broader durability preserves its previous revision, explicit
      failure and recoverable/exportable work outcomes; it supplies no private authority.
  - id: SB-RECOVERY-INVALID
    cause: UC-PERSIST
    relationship: illustrates
    digest: sha256:0ad0f1f37ef7919e9cbdc0708cc377af07901380f00504ed86d24617bc767ec5
    cause-digest: sha256:11f7381952aca132adad468fc62c648341ccc68c29bdc3b805020ee0997c3d0b
    reason: This existing anonymous local-storage success/refusal case remains valid and separate from
      new private service commits. Broader durability preserves its previous revision, explicit
      failure and recoverable/exportable work outcomes; it supplies no private authority.
  - id: SB-SECTION-FIRST
    cause: UC-SECTIONS
    relationship: illustrates
    digest: sha256:142013b9449dc02eff8f99b7752661694163795e29a55ef00daafc6f63e7ac4c
    cause-digest: sha256:e928650b0097c6c084f0a5da9483b55153571c56163b84edf7e280c991c97ebd
    reason: Stable section identity, notes, positive repeat bounds, order and guarded presence
      transitions remain unchanged. Additional event/arrangement detail must preserve existing
      associations and the other sections; invalid operations still refuse atomically.
  - id: SB-SECTION-INSERT
    cause: UC-SECTIONS
    relationship: illustrates
    digest: sha256:419cab857698e48ddda21d1b82e507163f407c0d6459f16785fb096c9324427a
    cause-digest: sha256:e928650b0097c6c084f0a5da9483b55153571c56163b84edf7e280c991c97ebd
    reason: Stable section identity, notes, positive repeat bounds, order and guarded presence
      transitions remain unchanged. Additional event/arrangement detail must preserve existing
      associations and the other sections; invalid operations still refuse atomically.
  - id: SB-SECTION-INVALID-ORDER
    cause: UC-SECTIONS
    relationship: illustrates
    digest: sha256:b504ff2ff04dee9f4f02842b169ef787cff8f53943404f0323b0f946bda08944
    cause-digest: sha256:e928650b0097c6c084f0a5da9483b55153571c56163b84edf7e280c991c97ebd
    reason: Stable section identity, notes, positive repeat bounds, order and guarded presence
      transitions remain unchanged. Additional event/arrangement detail must preserve existing
      associations and the other sections; invalid operations still refuse atomically.
  - id: SB-SECTION-MODIFY
    cause: UC-SECTIONS
    relationship: illustrates
    digest: sha256:d39296e86c35c16c859c4f1c4294a2df9b5edcd9304a505d7b4d5b985274a95b
    cause-digest: sha256:e928650b0097c6c084f0a5da9483b55153571c56163b84edf7e280c991c97ebd
    reason: Stable section identity, notes, positive repeat bounds, order and guarded presence
      transitions remain unchanged. Additional event/arrangement detail must preserve existing
      associations and the other sections; invalid operations still refuse atomically.
  - id: SB-SECTION-REMOVE
    cause: UC-SECTIONS
    relationship: illustrates
    digest: sha256:a9ebfc7be7dad88eaca3e230d20e904c697d133790d193f4cb46dcf495708e77
    cause-digest: sha256:e928650b0097c6c084f0a5da9483b55153571c56163b84edf7e280c991c97ebd
    reason: Stable section identity, notes, positive repeat bounds, order and guarded presence
      transitions remain unchanged. Additional event/arrangement detail must preserve existing
      associations and the other sections; invalid operations still refuse atomically.
  - id: SB-SECTION-REMOVE-LAST
    cause: UC-SECTIONS
    relationship: illustrates
    digest: sha256:4857e323f1014f93ab8b8e8e72e692809d2597c653a7cea01de470132b094e66
    cause-digest: sha256:e928650b0097c6c084f0a5da9483b55153571c56163b84edf7e280c991c97ebd
    reason: Stable section identity, notes, positive repeat bounds, order and guarded presence
      transitions remain unchanged. Additional event/arrangement detail must preserve existing
      associations and the other sections; invalid operations still refuse atomically.
  - id: SB-SECTION-REORDER
    cause: UC-SECTIONS
    relationship: illustrates
    digest: sha256:610413c7eae977e5760aa413f58ec499375fdafe0952dca8cbc7591cbda639e5
    cause-digest: sha256:e928650b0097c6c084f0a5da9483b55153571c56163b84edf7e280c991c97ebd
    reason: Stable section identity, notes, positive repeat bounds, order and guarded presence
      transitions remain unchanged. Additional event/arrangement detail must preserve existing
      associations and the other sections; invalid operations still refuse atomically.
  - id: SB-SECTION-REPEAT-BOUNDARY
    cause: UC-SECTIONS
    relationship: illustrates
    digest: sha256:8290678c017a749dd78b1b1d6ef192b85a7ec141d1cc1f0a1926c91c957217c7
    cause-digest: sha256:e928650b0097c6c084f0a5da9483b55153571c56163b84edf7e280c991c97ebd
    reason: Stable section identity, notes, positive repeat bounds, order and guarded presence
      transitions remain unchanged. Additional event/arrangement detail must preserve existing
      associations and the other sections; invalid operations still refuse atomically.
  - id: SB-BLANK-NAME
    cause: UC-SONGS
    relationship: illustrates
    digest: sha256:df469f85a539ac9aabbc71658c59485c3a0232a88349ce62b0ac126d6897f04c
    cause-digest: sha256:a1e0a3c0e6ef1573fb12557f4916af5b0f457628040dc5529a4db42891be3780
    reason: Existing anonymous create/edit/name/identity cases preserve stable identities, references
      and unchanged owned content. Private permissions and retained deletion add separately
      specified guards/behaviors, not fabricated content or changed creation/edit outcomes.
  - id: SB-MISSING-IDENTITY
    cause: UC-SONGS
    relationship: illustrates
    digest: sha256:fff8b2ea2df48cf8b63bb2b5ed2ea1f834b2b24389ed9e300fba67bb6d78c66d
    cause-digest: sha256:a1e0a3c0e6ef1573fb12557f4916af5b0f457628040dc5529a4db42891be3780
    reason: Existing anonymous create/edit/name/identity cases preserve stable identities, references
      and unchanged owned content. Private permissions and retained deletion add separately
      specified guards/behaviors, not fabricated content or changed creation/edit outcomes.
  - id: SB-SONG-ADD
    cause: UC-SONGS
    relationship: illustrates
    digest: sha256:3c802dc04e6f6ee9f01574e60c2a55f3c74c1614762f929575dffdf87b78efe9
    cause-digest: sha256:a1e0a3c0e6ef1573fb12557f4916af5b0f457628040dc5529a4db42891be3780
    reason: Existing anonymous create/edit/name/identity cases preserve stable identities, references
      and unchanged owned content. Private permissions and retained deletion add separately
      specified guards/behaviors, not fabricated content or changed creation/edit outcomes.
  - id: SB-SONG-CREATE
    cause: UC-SONGS
    relationship: illustrates
    digest: sha256:d95b74331bb7efbb0806b44d35f116106618a1460ddc58b6a0fe7ec9183decba
    cause-digest: sha256:a1e0a3c0e6ef1573fb12557f4916af5b0f457628040dc5529a4db42891be3780
    reason: Existing anonymous create/edit/name/identity cases preserve stable identities, references
      and unchanged owned content. Private permissions and retained deletion add separately
      specified guards/behaviors, not fabricated content or changed creation/edit outcomes.
  - id: SB-SONG-EDIT
    cause: UC-SONGS
    relationship: illustrates
    digest: sha256:1e27a22da49c7b805dcc4023c563afa4b2ec78936ca42473957617aecb9fa33a
    cause-digest: sha256:a1e0a3c0e6ef1573fb12557f4916af5b0f457628040dc5529a4db42891be3780
    reason: Existing anonymous create/edit/name/identity cases preserve stable identities, references
      and unchanged owned content. Private permissions and retained deletion add separately
      specified guards/behaviors, not fabricated content or changed creation/edit outcomes.
  - id: LC-STRUCTURE
    cause: TERM-SONG
    relationship: subject
    digest: sha256:31caaa7320486ab3a837e8b0f3ac2b14f6e5623b664f131cb85af1ce030a24ef
    cause-digest: sha256:7d49b3b035b78c45528842359fac9531736717000c30c37e668219ece1abf910
    reason: EMPTY/ARRANGED derive only from section presence. Added exact timing, private authorization
      and arrangements do not change those states or existing guarded insert/modify/reorder/remove
      transitions.
  - id: LC-STRUCTURE
    cause: BR-IDENTITY
    relationship: transitions[].governed-by
    digest: sha256:31caaa7320486ab3a837e8b0f3ac2b14f6e5623b664f131cb85af1ce030a24ef
    cause-digest: sha256:6b3d38400ae82fdc926ae2b7a9eee5d02e684c50502545f323adc41cea150768
    reason: EMPTY/ARRANGED derive only from section presence. Added exact timing, private authorization
      and arrangements do not change those states or existing guarded insert/modify/reorder/remove
      transitions.
  - id: LC-STRUCTURE
    cause: BR-STRUCTURE
    relationship: transitions[].governed-by
    digest: sha256:31caaa7320486ab3a837e8b0f3ac2b14f6e5623b664f131cb85af1ce030a24ef
    cause-digest: sha256:db3410bd8a3fe7f3da94e63ee8804b1c75f03b8f7dd1e7858cfd05aed03a0686
    reason: EMPTY/ARRANGED derive only from section presence. Added exact timing, private authorization
      and arrangements do not change those states or existing guarded insert/modify/reorder/remove
      transitions.
  - id: LC-STRUCTURE
    cause: UC-SECTIONS
    relationship: transitions[].realized-by
    digest: sha256:31caaa7320486ab3a837e8b0f3ac2b14f6e5623b664f131cb85af1ce030a24ef
    cause-digest: sha256:e928650b0097c6c084f0a5da9483b55153571c56163b84edf7e280c991c97ebd
    reason: EMPTY/ARRANGED derive only from section presence. Added exact timing, private authorization
      and arrangements do not change those states or existing guarded insert/modify/reorder/remove
      transitions.
  - id: UC-ANNOTATIONS
    cause: TERM-SECTION
    relationship: uses-terms
    digest: sha256:1b3e61e884b4aa938f3b9a81d07f90523bcd46514071f5d953d98cfbd7e0d715
    cause-digest: sha256:6c4673eadcd6da5bd1fba69b895ad1a560c77e3329c1c30a6d14b01ab465bf5b
    reason: Stable section identity, notes, positive repeat bounds, order and guarded presence
      transitions remain unchanged. Additional event/arrangement detail must preserve existing
      associations and the other sections; invalid operations still refuse atomically.
  - id: UC-ANNOTATIONS
    cause: TERM-SONG
    relationship: uses-terms
    digest: sha256:1b3e61e884b4aa938f3b9a81d07f90523bcd46514071f5d953d98cfbd7e0d715
    cause-digest: sha256:7d49b3b035b78c45528842359fac9531736717000c30c37e668219ece1abf910
    reason: Stable section identity, notes, positive repeat bounds, order and guarded presence
      transitions remain unchanged. Additional event/arrangement detail must preserve existing
      associations and the other sections; invalid operations still refuse atomically.
  - id: UC-MEMBERSHIP
    cause: TERM-SONG
    relationship: uses-terms
    digest: sha256:e3f170c1793e24b326a5fe28a985095a50ed7757cfd75d028c9cac9a6f4d8447
    cause-digest: sha256:7d49b3b035b78c45528842359fac9531736717000c30c37e668219ece1abf910
    reason: "Repertoire identity and non-owning membership behavior are unchanged: membership never
      copies/deletes a song and duplicate or missing references still refuse. Private authorization
      is an additional guard, not a change to these anonymous local outcomes."
  - id: UC-PDF
    cause: TERM-SONG
    relationship: uses-terms
    digest: sha256:26a5a12df99ab22eb72daa5e4fb48587a0a47942d74d8d9f717d26489b201062
    cause-digest: sha256:7d49b3b035b78c45528842359fac9531736717000c30c37e668219ece1abf910
    reason: The existing optional local PDF journey, bounds and refusal/preservation outcomes remain
      unchanged. Broader song/private recovery rules add guards without converting local attachment
      behavior into a service guarantee.
  - id: UC-REFERENCES
    cause: TERM-SONG
    relationship: uses-terms
    digest: sha256:f5c149268a2548e66b3defdfac2618dda842ffd8d2b2aeb12acf66a829eed4da
    cause-digest: sha256:7d49b3b035b78c45528842359fac9531736717000c30c37e668219ece1abf910
    reason: External HTTP/HTTPS references remain attached to the same stable song identity. New
      arrangement and private recovery detail neither opens external content offline nor changes
      reference validation.
  - id: UC-REPERTOIRES
    cause: TERM-SONG
    relationship: uses-terms
    digest: sha256:282d54489055a7d95fc9eb2ee5516b7872e304e9a5171d8643e22c350c358049
    cause-digest: sha256:7d49b3b035b78c45528842359fac9531736717000c30c37e668219ece1abf910
    reason: "Repertoire identity and non-owning membership behavior are unchanged: membership never
      copies/deletes a song and duplicate or missing references still refuse. Private authorization
      is an additional guard, not a change to these anonymous local outcomes."
---

## Problem

Triad sketches and one local latest revision cannot express performed arrangements, private ownership or acknowledged cross-device recovery. Existing exclusions prohibit the requested authority, while the journey's blanket offline outcome does not distinguish anonymous continuity from qualified private access.

## Intended Product Outcome

Preserve stable songs, repertoires, reminders and protected consultation while admitting bounded spelled harmony, exact performed voicings, independent parts and unrestricted device collections. Private songs have current resource capabilities, complete acknowledged revisions, recoverable deletion and protected session/pending-work boundaries. Anonymous work remains local until explicit verified claim. Consultation is available only within its applicable authority; local shell or record availability never grants private access.

## Rationale

The supplied owner decisions select these outcomes verbatim:

> Decision: lock private content and preserve pending work for the same authenticated principal; never silently discard it or make it available to the next account.

> Decision: a maximum of 8 hours, anchored to a successful online authorization check performed by the ScoreMap server.

> Choose recoverable deletion, with a separate, clearly destructive, owner-confirmed permanent purge. No automatic age-based purge. Deletion must not silently erase the newly introduced revision history.

> Choose the existing Song/Section identity boundary: a Song owns its section/measure/harmonic-event timeline; Arrangements reference that shared timeline and own their independent performed parts, voicings/note events and device/layer bindings.

> Choose an enumerated catalogue with independently expected spelled degree/interval fixtures. Preserve accepted major/minor triads and Cmaj7.

> Two simple file contracts

The connected local checkpoint is prioritized, not a reduction of later scope. The independent edit-mode mutation rule remains unchanged. Existing Library and Sketch context summaries remain compatible with their evolved detailed rules and use cases: identity/non-owning membership and musician-authored structure retain their owners, public catalogues and automatic invention remain excluded. Keeping those accepted identities and summaries does not omit capability or arrangement semantics. Recovery's local-only boundary must change. The journey is explicitly qualified, and separate concrete restoration examples cover the single-object presence and retention relationships without inventing fields.

## Affected Product Areas

Song/library identity; shared form and repeat occurrences; harmony/notation/performed pitches; independent parts, optional hands, devices and layers; accessible consultation and its end-to-end journey; private capabilities, sessions and scoped offline lease; complete commits, migrations, claim, history and portability; active removal versus retained deletion and purge. Existing library/structure presence remains distinct from navigation, interaction mode and save status.

## Open Questions

None. The previously material choices are resolved by supplied decisions. Technical selection and qualification must satisfy these outcomes, not silently replace them. Final candidate assembly and provider validation remain outstanding work, not a product-policy question.

## Product Acceptance

Every B01-B10 and all six arrangements map to rules, requirements and structured success/refusal/boundary examples. Finite degrees/alterations, spelling, pitch/time/repeat bounds, copied preset versions and migration defaults permit independent fixtures. Owner/editor/viewer checks cover direct/nested operations, history and export. Session end locks content while preserving protected same-principal work; the scoped eight-hour maximum cannot self-renew. Recoverable deletion retains history until separate owner purge; restore retains identity but not grants/memberships, with typed examples for both active-library and song-retention RESTORE. Purge removes live retained owned content/history, preserves independent resources and prevents resurrection of the identity without false erasure promises. Anonymous offline edit/reopen examples preserve complete local acknowledgement and do not stand in for private recovery. The journey distinguishes connected private access from later qualified offline use.

Shared real-login users/configuration contracts define the connected checkpoint without claiming later offline, full evolution or deployment completion. One coherent overlay of exactly the manifest's added/modified definitions must be assembled and validated against unchanged accepted truth before publication and decision. All valid canonical references and independent capabilities remain intact. Approval, apply, acceptance, implementation, execution and release remain distinct.

## Out of Scope

Application implementation, provisioning, live migration, architecture source edits, publication, approval, apply, merge and deployment. No fretboard UI, MIDI/hardware control, audio engine, transcription/recording/AI arrangement, effects/patch control, realtime coediting, public catalogue/share links, invitation UX, subscriptions/billing or native packaging. PDF remains independent. Physical-device/origin, automation identity and toolchain-security work retain ownership. Repertoire/membership/reminder/reference semantics are preserved, not recreated. Accepted Library/Sketch context identities and summaries are not removed; no additional service or per-noun project is inferred. No private source, roster, credentials, personal music or deployment inventory belongs in the definition or evidence.
