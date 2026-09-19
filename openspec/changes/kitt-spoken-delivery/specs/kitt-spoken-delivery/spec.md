> Historical experiment, withdrawn at the owner's request. Build 34 was tested and its voice delivery was not preferred; build 35 restores the exact build 33 source. The proposal and requirements below describe the reverted experiment, not current application behaviour. Do not apply or merge these requirements into the baseline.

## ADDED Requirements

### Requirement: Consistent KITT spoken delivery
The system SHALL supply concise, courteous, fluent KITT delivery guidance for live and delegated replies, defaulting to one or two short sentences when sufficient.

#### Scenario: KITT delegates work
- **WHEN** the captured character is KITT
- **THEN** KITT reply guidance follows the unchanged execution instructions
- **AND** selected voice and protocol fields remain unchanged

### Requirement: Character isolation and truthful delivery
The system SHALL select reply style independently of voice and SHALL preserve uncertainty and execution boundaries.

#### Scenario: Another character selects Ember
- **WHEN** the captured character is not KITT
- **THEN** KITT reply instructions are absent even if the selected voice is Ember

#### Scenario: The listener asks about timbre
- **WHEN** only text and requested voice identity are available
- **THEN** the guidance prohibits claiming verified audible timbre or quality
