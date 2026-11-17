---
name: use-tonal-primitives-with-the-accepted-harmony-catalogue
description: Reuse pinned Tonal operations behind the finite ScoreMap harmony catalogue and independent expected fixtures.
status: Proposed
date: 2026-11-17
deciders: []
tags: [music, dependencies, validation]
---

# ADR-0005: Use Tonal primitives with the accepted harmony catalogue

## Context

The applied BR-CHORDS defines 32 canonical qualities, accepted aliases and complete degrees, with 172 definitions when compatible dominant alterations are expanded. Spelled theoretical tones, exact performed pitches and explicit ambiguous/unknown identification have separate meanings. The browser needs maintained note/interval and identification operations; the API independently validates the same finite data.

The pinned evaluation checked six independently specified spelling/pitch fixtures and every accepted degree profile. Tonal's default C13 contains C/E/G/Bb/D/A; ScoreMap requires C/E/G/Bb/D/F/A. The provider's default dictionary therefore cannot define the product catalogue. Tonal's note transposition and extensible chord-type/detection primitives produced the required complete thirteenth, Cdim7's Bbb spelling, explicit C6/Am7 ambiguity and an honest unknown cluster when used with product-owned definitions.

## Decision

We will use `@tonaljs/note` 4.12.4, `@tonaljs/chord-type` 5.2.2 and `@tonaljs/chord-detect` 4.9.4 behind one shared adapter. Register accepted degree profiles under private aliases without deleting provider types, and return only definitions mapped through the accepted product catalogue. Provider names/objects and detection rankings confer no authority and never automatically rewrite harmony or performed notes.

The runtime catalogue is derived from the current accepted BR-CHORDS and projected into TypeScript and C# data. Verification rejects drift between the product rule, catalogue and projections. Independent expected fixtures govern spelling, degree completeness and pitch classes rather than comparing a provider to itself. Application candidates retain the normal implementation review and integration gates; this record does not attest full arrangement or builder acceptance.

## Consequences

- **Positive:** Maintained spelling/transposition and candidate detection are reused while the exact accepted musical vocabulary remains authoritative. The three selected packages and their evaluated dependency set use MIT licenses; the isolated evaluation reported zero vulnerabilities.
- **Negative:** The adapter owns finite catalogue registration and output filtering. Upgrading provider versions requires repeating independent fixtures, dependency/security checks and complete-degree identification checks.
- **Neutral:** Backend validation consumes the same generated data through pure integer/degree checks. Library-specific aliases remain internal; label notation and performed-pitch storage are separate boundaries.

## Alternatives considered

- **Use the default Tonal chord dictionary directly:** rejected because its thirteenth omits an accepted required degree and the dictionary admits additional product-unsupported types.
- **Implement note spelling and detection from scratch:** rejected because maintained provider primitives cover these operations when constrained by the accepted catalogue.
- **Adopt the complete umbrella package:** rejected because the selected operations need only three focused packages; unrelated scales/modes utilities are not required for this slice.

## References

- [Accepted chord semantics](../../product/model/business-rules/br-chords.md)
- [Pinned evaluation receipt](../../evidence/music/tonal-evaluation.json)
- [Musical model change](../../../openspec/changes/issue-22-musical-model/design.md)
- [Tonal note operations](https://tonaljs.github.io/tonal/docs/basics/notes/)
- [Tonal chord operations](https://tonaljs.github.io/tonal/docs/groups/chords/)
- [Tonal source and license](https://github.com/tonaljs/tonal)
