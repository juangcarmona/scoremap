<!-- pdac-scope: cited -->
# Persistent musician notation

## Why
Musicians need Anglo-American, fixed-name Latin and dual labels without rewriting stored harmony. The accepted arrangement evolution defines the semantics; this change implements its presentation/preference slice on current songs and retains the richer-model fixtures as pending.

## What Changes
- Shared spelling-preserving formatters and notation context, consumed by every existing chord/keyboard/history surface.
- A simple notation selector usable in edit or performance mode. Anonymous device preference stays separate from an authenticated principal's independently acknowledged server preference.
- Current-principal-only conditional preference storage and explicit loading/pending/failure states, with Anglo-American fallback.

## Capabilities
### New Capabilities
- `musician-notation`: consistent display and separate durable notation preference.

### Modified Capabilities
None; canonical musical storage remains unchanged.

## Impact
Shared music presentation, Library/Sketch UI composition, a preference feature, Library module preference DTO/handlers/SQL, browser/unit/backend tests. No external provider or new theory engine is needed for note-name formatting.

<!-- pdac:cite id="FR-CHORDS" digest="sha256:4da1a2f14b722446609a1fca78c027c682d149ecbef18a835eb561f6050f1ae4" -->
<!-- pdac:cite id="BR-CHORDS" digest="sha256:543566a20181aa25eab6cc446d8ac467b1ca911632744dd957a0ab3388e9d55c" -->
<!-- pdac:cite id="BR-ACCESS" digest="sha256:fcc173c80ae4a5903dbeb2e11c141cb6ee8d03382c812ebc527d5065347b72c9" -->
<!-- pdac:cite id="BR-DURABILITY" digest="sha256:6b075527861da086b9571e8d117c7844348a437e363423bca46f60cc83b02e0b" -->
