## ADDED Requirements

### Requirement: Silence does not automatically stop Voice

The application SHALL NOT schedule Voice Stop solely because the user and assistant are silent. The inactivity timer and its integration SHALL be removed, rather than disabled or given a longer deadline. Explicit Stop SHALL retain native sole ownership, serialized Start/Stop and unknown-outcome protections. Existing native safety limits SHALL remain unchanged.

#### Scenario: Silent active session
- **WHEN** an otherwise healthy active session is silent for more than 30 or 60 seconds
- **THEN** no application inactivity timer requests Stop

#### Scenario: Activity and background resumption
- **WHEN** speech, assistant playback, backing work or foreground resumption changes during an active session
- **THEN** activity presentation updates without scheduling an inactivity Stop

#### Scenario: Manual Stop after silence
- **WHEN** the owner explicitly stops the session
- **THEN** the existing native-first Stop operation is awaited and a subsequent Start remains serialized

### Requirement: Established-session interruption is described truthfully

When server start was observed, subsequent loss of transport SHALL describe interruption with unconfirmed remote closure rather than an unobserved Start. The same conservative unknown state and no-retry policy SHALL remain. A pending Stop SHALL retain Stop-unknown priority.

#### Scenario: Transport loss after observed start
- **WHEN** transport fails after server start was observed and no Stop is pending
- **THEN** the message describes interruption and unknown remote closure without making retry available

#### Scenario: Pending Start or Stop
- **WHEN** transport fails before observed start or after a Stop attempt
- **THEN** existing Start-unknown or Stop-unknown wording and semantics remain respectively

### Requirement: Transport failure diagnostics preserve bounded evidence

Existing transport failure boundaries SHALL record only fixed local source/category and safe booleans, without raw errors, transcript content, identifiers or payloads. Observation MUST NOT change protocol validation, state ownership, permissions or retry eligibility.

#### Scenario: Failure after observed server start
- **WHEN** an existing failure path terminates transport after server start was observed
- **THEN** bounded diagnostics distinguish the local failure boundary and observed start state without asserting a root cause or authorizing a retry

#### Scenario: Error with sensitive associated detail
- **WHEN** an error includes an arbitrary associated message or identity field
- **THEN** persisted diagnostics contain only an allowlisted category and omit the associated value

### Requirement: Delivery separates implementation from physical proof

Delivery SHALL identify removed inactivity behavior separately from unresolved transport failures and SHALL leave physical iPhone/CarPlay and Phase 0 gates pending until supported by evidence.

#### Scenario: Automated tests pass
- **WHEN** tests and builds pass without physical owner retesting
- **THEN** documentation reports implementation verification without claiming uninterrupted physical Voice
