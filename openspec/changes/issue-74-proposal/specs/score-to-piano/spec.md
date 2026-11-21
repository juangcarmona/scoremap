# Spec Delta

## Purpose

The score-to-piano capability lets musicians prepare and compare exact played notes without conflating chord theory, hand ownership or unknown musical information.

## ADDED Requirements

### Requirement: Exact pitches are editable per hand

The system SHALL let the musician select each hand independently and preserve exact selected pitches, including pitches outside the currently visible keyboard range.

#### Scenario: Change hand and keyboard range
- **WHEN** the musician changes the selected hand or navigates the full A0–C8 keyboard
- **THEN** existing pitches retain their exact values and hand ownership

### Requirement: Staff represents only known musical data

The system SHALL show selected exact pitches on a compact grand staff with applicable clefs, known key signature, necessary accidentals and accurate ledger lines or octave indications.

#### Scenario: Key or phrase timing is unknown
- **WHEN** a phrase has no supplied key or explicit duration data
- **THEN** the score does not invent a key, note duration or rest

### Requirement: Ordered phrases remain synchronized

The system SHALL allow explicitly ordered notes, durations and rests to be compared between score and piano views without changing their exact musical values.

#### Scenario: Select a phrase note
- **WHEN** the musician selects an explicitly supplied phrase note in either view
- **THEN** the same exact note is identified in the other view

### Requirement: Score edits preserve protected content boundaries

The system SHALL apply score and played-note changes through the existing authorization and edit guard and SHALL preserve durable content when a save is refused, fails or conflicts.

#### Scenario: Save is refused or conflicts
- **WHEN** authorization is denied, a save fails, or the stored version conflicts
- **THEN** the system reports the outcome and does not silently discard or overwrite the durable arrangement

### Requirement: Complete music survives transfer and recovery

The system SHALL include lyric/chord associations, hand ownership, exact pitches and phrase data in acknowledged save, reopen, backup and recovery operations.

#### Scenario: Round-trip a complete arrangement
- **WHEN** supported song data is saved, reopened and exported then restored
- **THEN** its supported associations and exact musical values are preserved
