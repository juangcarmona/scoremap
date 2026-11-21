# Spec Delta

## Purpose

The song sheet presents a musician's structured song in a focused, readable consultation view while preserving section, repeat, chord and lyric associations.

## ADDED Requirements

### Requirement: Song sheet preserves lyric and chord alignment

The system SHALL associate optional lyrics and chord changes with their song section and position, including repeated chord sequences with changing lyric text.

#### Scenario: Lyrics change over a repeated chord loop
- **WHEN** a section repeats the same chord sequence with different supplied lyric lines
- **THEN** the sheet presents each lyric line with its associated chord changes and preserves the declared repeat

### Requirement: Song sheet supports optional content

The system SHALL allow optional personal notes and band cues and SHALL present sections without lyrics without fabricating text.

#### Scenario: Section has no lyrics
- **WHEN** the musician views a section with chords but no lyric data
- **THEN** the section remains readable and no lyric content is invented

### Requirement: Performance consultation is focused and read-only

The system SHALL provide a navigable, vertically scrollable song view that prioritizes music and lyrics and does not permit content mutation in consultation mode.

#### Scenario: Consult a long song
- **WHEN** the musician enters performance consultation and navigates between sections
- **THEN** the sheet remains vertically navigable and its content is unchanged by consultation actions
