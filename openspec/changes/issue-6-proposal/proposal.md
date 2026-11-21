<!-- pdac-scope: cited -->

# Repertoire and song interaction

## Why

Realize the already supplied ScoreMap product intent for [issue #6](https://github.com/juangcarmona/scoremap/issues/6). The applied CHG-INITIAL is the only source of product semantics; this delivery change supplies implementation and verification.

## What Changes

Implement the accepted behaviours cited below in the bounded paths `src/features/library/Library.tsx`, `tests/e2e/library.spec.ts`. Dependencies: #5.

## Capabilities

### New Capabilities

- delivery: Observable implementation of the cited slice.

### Modified Capabilities

None.

## Impact

<!-- pdac:cite id="SB-BLANK-NAME" digest="sha256:df469f85a539ac9aabbc71658c59485c3a0232a88349ce62b0ac126d6897f04c" -->
<!-- pdac:cite id="SB-MEMBERSHIP-ADD" digest="sha256:f0cc7537b2efb9033a66e7f95e4d2ba68c92037edd808c571fa4b9f3c3eddbbe" -->
<!-- pdac:cite id="SB-MEMBERSHIP-DUPLICATE" digest="sha256:cf13783a3af08774e6216bb726af792566480d5ba2d3a236983ae749f241366b" -->
<!-- pdac:cite id="SB-MEMBERSHIP-REMOVE" digest="sha256:76ff8dfb68346d6bcaa2716da66062cd284902f6bdf5003a77538132041bd71c" -->
<!-- pdac:cite id="SB-MISSING-IDENTITY" digest="sha256:fff8b2ea2df48cf8b63bb2b5ed2ea1f834b2b24389ed9e300fba67bb6d78c66d" -->
<!-- pdac:cite id="SB-REPERTOIRE-CREATE" digest="sha256:37922d0d79d173763965250a8b5fa744c0f62775ba78c6c3ae7e4e0db182d86a" -->
<!-- pdac:cite id="SB-REPERTOIRE-DELETE" digest="sha256:3203bf7d104b07abed94f2f2beb00b92f33eead1e90981e88f123fe3aeda62c6" -->
<!-- pdac:cite id="SB-REPERTOIRE-RENAME" digest="sha256:96865538af194f8c287f62e4dc44e4341fab5700fb7f306801b1411f2e9a27ba" -->
<!-- pdac:cite id="SB-SONG-ADD" digest="sha256:3c802dc04e6f6ee9f01574e60c2a55f3c74c1614762f929575dffdf87b78efe9" -->
<!-- pdac:cite id="SB-SONG-CREATE" digest="sha256:d95b74331bb7efbb0806b44d35f116106618a1460ddc58b6a0fe7ec9183decba" -->
<!-- pdac:cite id="SB-SONG-DELETE-LAST" digest="sha256:6d28d410277829ac14537809d400174250ebf8c7ad66ba5d7fe33b4d8cab5451" -->
<!-- pdac:cite id="SB-SONG-DELETE" digest="sha256:bbd38eb21cb613007349d8e8a1ecedaf120174f33d7caca81a0f0acdcaf2d060" -->
<!-- pdac:cite id="SB-SONG-EDIT" digest="sha256:1e27a22da49c7b805dcc4023c563afa4b2ec78936ca42473957617aecb9fa33a" -->
<!-- pdac:cite id="BR-EDIT-GUARD" digest="sha256:20e678c4743404c64a51c01e4446026ac95811827d2f5e1c641839291ad32718" -->
<!-- pdac:cite id="BR-IDENTITY" digest="sha256:d9c6607eb0cc984270a900d1889980f7515f3c1648f31efe56ceb9f3818e0352" -->
<!-- pdac:cite id="LC-LIBRARY" digest="sha256:87592e7d48ad80b922f219f370fee009668a74146f83cbb2f159e16752fbdda5" -->
<!-- pdac:cite id="FR-MEMBERSHIP" digest="sha256:5616e543703cb1206e49a200d319d27a6bd55c401c3374b9ed3564583aab6b3e" -->
<!-- pdac:cite id="FR-REPERTOIRES" digest="sha256:dcba63d54b9537950221b434cc50236f2aa2e4cdb1e53a229891b757e440f70f" -->
<!-- pdac:cite id="FR-SONGS" digest="sha256:77823d9d26f9d5aa3f2fedb540d015a16b2aadc76c1eb2836824b7bb255ec739" -->
<!-- pdac:cite id="UC-MEMBERSHIP" digest="sha256:e3f170c1793e24b326a5fe28a985095a50ed7757cfd75d028c9cac9a6f4d8447" -->
<!-- pdac:cite id="UC-REPERTOIRES" digest="sha256:a4029a0536cb5625adbc26301cb71c6e057ead00282f7a00e416d34ddb5aae1f" -->
<!-- pdac:cite id="UC-SONGS" digest="sha256:9230de84fe0d6cbbe62e7f5bc23c9118bf5e425dcda62bfd8b9c9312cd81e4c5" -->

The complete model was examined for shared identity, mode and durability rules. MIDI, accounts and cloud features were excluded because they are outside CON-SCOPE. Read applicable lifecycle transitions and refusal behaviours before authoring tests.
