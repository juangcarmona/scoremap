<!-- pdac-scope: cited -->

# Optional local PDF attachment and viewer

## Why

Realize the already supplied ScoreMap product intent for [issue #13](https://github.com/juangcarmona/scoremap/issues/13). The applied CHG-INITIAL is the only source of product semantics; this delivery change supplies implementation and verification.

## What Changes

Implement the accepted behaviours cited below in the bounded paths `src/features/library/PdfViewer.tsx`, `tests/e2e/pdf.spec.ts`. Dependencies: #10, #12.

## Capabilities

### New Capabilities

- delivery: Observable implementation of the cited slice.

### Modified Capabilities

None.

## Impact

<!-- pdac:cite id="SB-PDF-ATTACH" digest="sha256:bb0ae4e82407c6d62f96564db7644e8d0d8684bc8f3e8a7166570e3ea4210ce5" -->
<!-- pdac:cite id="SB-PDF-NAVIGATE" digest="sha256:36fae57b85fc19e0eed3766456b219721211ad4dd5c7123da9e7bdc357122234" -->
<!-- pdac:cite id="SB-PDF-REJECT" digest="sha256:ad3173b24391233d5316ae7d2f1dece023d35efcf0e3f7931e521839dd41a73d" -->
<!-- pdac:cite id="BR-DURABILITY" digest="sha256:6b075527861da086b9571e8d117c7844348a437e363423bca46f60cc83b02e0b" -->
<!-- pdac:cite id="BR-EDIT-GUARD" digest="sha256:20e678c4743404c64a51c01e4446026ac95811827d2f5e1c641839291ad32718" -->
<!-- pdac:cite id="BR-PDF" digest="sha256:e83f0e00285008ae9c61789b2bc7ed7ec700368aaa55dda2d7323966d5b0e8cb" -->
<!-- pdac:cite id="FR-PDF" digest="sha256:83070927beae39c02951f46b74eec2fa28a5c6530df574719a7b969c48c0e6ad" -->
<!-- pdac:cite id="UC-PDF" digest="sha256:26a5a12df99ab22eb72daa5e4fb48587a0a47942d74d8d9f717d26489b201062" -->

The complete model was examined for shared identity, mode and durability rules. MIDI, accounts and cloud features were excluded because they are outside CON-SCOPE. Read applicable lifecycle transitions and refusal behaviours before authoring tests.
