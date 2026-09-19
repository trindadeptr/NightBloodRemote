## Purpose

Provide bounded, privacy-preserving evidence about the existing Voice pipeline so later cost optimizations can be compared against an honest physical baseline.

## ADDED Requirements

### Requirement: Measurement distinguishes protocol evidence from executions

The system SHALL distinguish raw notifications, unique backing turns, and finalized transcript-part observations, retain explicit source/created-task scope, and label the measurement lifetime. It MUST NOT present transcript parts as true user turns. Counters and ephemeral deduplication state SHALL be bounded and expose saturation.

#### Scenario: Replayed turn and transcript notifications
- **WHEN** the same backing turn notification arrives twice and two user transcript parts arrive without unique event identity
- **THEN** diagnostics show two raw turn observations, one unique turn, and two user transcript-part observations without claiming two user turns

#### Scenario: Bounded state reaches capacity
- **WHEN** the identifier or numeric capacity is reached
- **THEN** diagnostics mark capped evidence and continue Voice without overflow, unbounded storage or false exact totals

### Requirement: Token accounting uses validated upstream observations

The system SHALL accept supported token notifications only for the exact selected source task and validate integral, nonnegative, internally consistent token fields. It SHALL distinguish first-snapshot baseline, subsequent observed-window deltas, missing evidence and discontinuity. It MUST NOT sum repeated cumulative totals, count token subcategories twice or represent the observed window as exclusively Voice session usage.

#### Scenario: Cumulative snapshots repeat
- **WHEN** valid task-lifetime totals of 100, 120 and 120 are observed in order
- **THEN** the observed-window increase is 20, the first 100 is excluded, and the repeated snapshot adds zero

#### Scenario: Malformed or unsupported evidence
- **WHEN** usage is absent, belongs to another task, contains negative/fractional/overflowing values, or violates the supported schema
- **THEN** it adds no token usage, does not interrupt Voice, and missing or rejected evidence is not reported as measured zero consumption

#### Scenario: Cumulative counters decrease
- **WHEN** a previously observed cumulative token component decreases
- **THEN** the measurement reports discontinuity and does not fabricate negative usage or silently claim complete coverage

### Requirement: Diagnostics preserve privacy and current behavior

Persisted or exported Phase 0 diagnostics SHALL contain only bounded aggregate values and safe labels, never transcript text, credentials, real task/host/account identifiers, private paths or audio. Measurement SHALL NOT change routing, prompts, dispatch, pairing, permissions, approvals, microphone ownership or retry behavior.

#### Scenario: Sensitive inputs are observed
- **WHEN** protocol input includes transcript text or task identity needed for native scope validation
- **THEN** measurement output omits those values and existing task/host binding and at-most-once behavior remain effective

### Requirement: Cloud exposure proxy preserves lifecycle uncertainty

The system SHALL measure observed realtime-open duration with monotonic elapsed time, identify clean versus interrupted closure, and flush terminal aggregate evidence at most once per observed open interval. It MUST NOT label that proxy actual transmitted audio, received audio or billing duration.

#### Scenario: Replayed start and terminal events
- **WHEN** start evidence repeats while open and terminal evidence repeats after closure
- **THEN** the interval start is not reset, its duration is not double-counted, and its terminal summary is not flushed twice

#### Scenario: Transport is lost without clean close
- **WHEN** an observed open interval ends through transport loss
- **THEN** the exposure proxy is marked incomplete and unavailable actual media/billing measurements remain unavailable

### Requirement: Physical baseline status reflects evidence

The baseline report SHALL distinguish instrumented capability, synthetic checks, Simulator validation and measured physical results. It SHALL keep the Phase 0 physical gate pending until representative iPhone and CarPlay observations quantify backing turns and cloud audio exposure with explicit provenance and limitations. Missing tokens, true user turns, latency or audio duration SHALL be unavailable or manually measured with a documented method, never guessed.

#### Scenario: Only offline and Simulator checks have passed
- **WHEN** no representative physical iPhone/CarPlay session has been measured
- **THEN** the report marks the physical baseline pending and makes no savings or physical-quality acceptance claim

#### Scenario: Only connected duration is known
- **WHEN** a measurement provides cloud connection duration without actual media or billing duration
- **THEN** it is labeled an exposure proxy and actual audio/billed duration remains unavailable
