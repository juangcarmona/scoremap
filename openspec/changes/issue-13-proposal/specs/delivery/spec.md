<!-- pdac-scope: cited -->

## Product dependencies

<!-- pdac:cite id="SB-PDF-ATTACH" digest="sha256:bb0ae4e82407c6d62f96564db7644e8d0d8684bc8f3e8a7166570e3ea4210ce5" -->
<!-- pdac:cite id="SB-PDF-NAVIGATE" digest="sha256:36fae57b85fc19e0eed3766456b219721211ad4dd5c7123da9e7bdc357122234" -->
<!-- pdac:cite id="SB-PDF-REJECT" digest="sha256:ad3173b24391233d5316ae7d2f1dece023d35efcf0e3f7931e521839dd41a73d" -->
<!-- pdac:cite id="BR-DURABILITY" digest="sha256:d822f18f163b8685937ae5a3137dc04ef4a2d5947ab7a9954245bd965b72fa45" -->
<!-- pdac:cite id="BR-EDIT-GUARD" digest="sha256:20e678c4743404c64a51c01e4446026ac95811827d2f5e1c641839291ad32718" -->
<!-- pdac:cite id="BR-PDF" digest="sha256:e83f0e00285008ae9c61789b2bc7ed7ec700368aaa55dda2d7323966d5b0e8cb" -->
<!-- pdac:cite id="FR-PDF" digest="sha256:83070927beae39c02951f46b74eec2fa28a5c6530df574719a7b969c48c0e6ad" -->
<!-- pdac:cite id="UC-PDF" digest="sha256:26a5a12df99ab22eb72daa5e4fb48587a0a47942d74d8d9f717d26489b201062" -->

## ADDED Requirements

### Requirement: Realize the accepted delivery behaviour

The implementation SHALL satisfy the cited product behaviours and governing invariants for this slice. This is a consumer projection of CHG-INITIAL; the ProductShape artifacts remain canonical.

#### Scenario: SB-PDF-ATTACH

- **WHEN** The musician attaches the PDF and later reopens the song offline
- **THEN** The PDF remains associated with that song; Readable local pages are available inside ScoreMap; Sketch and PDF can be switched without data loss

#### Scenario: SB-PDF-NAVIGATE

- **WHEN** The musician navigates forward, backward and with a horizontal swipe
- **THEN** Each navigation stays within the page bounds; The current page is remembered when the song is reopened; Performance mode permits page navigation without modifying musical content

#### Scenario: SB-PDF-REJECT

- **WHEN** The musician attempts to attach that PDF
- **THEN** A recoverable PDF error is shown; The song and existing attachment remain unchanged
