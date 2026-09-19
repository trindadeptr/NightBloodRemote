## Purpose

Supply stable synthetic bilingual corpora and reproducible offline evaluation that can assess later routing and voice candidates without changing the production pipeline.

## ADDED Requirements

### Requirement: Representative bilingual routing corpus

The benchmark SHALL contain 50–100 synthetic routing cases with unique stable IDs, pt-PT or English language, utterance, bounded synthetic context, expected minimum tier, acceptable tiers and rationale. Coverage SHALL include deterministic commands, conversation, fresh information, project questions, mutations, ambiguity and contextual follow-up chains. Fresh-information expectations MUST require a capable external-information path, not unverified local knowledge or assumed Live tools.

#### Scenario: Context-dependent follow-up
- **WHEN** a case says “Faz isso” or “Do that” following project work
- **THEN** its bounded context and expected route preserve the project-work dependency, while explicit topic changes have their own labeled cases

### Requirement: Explicit prediction evaluation

The evaluator SHALL operate offline on supplied predictions and versioned fixtures, validate full case coverage and recognized tiers, and produce documented numerators/denominators for routing accuracy, false-local, false-Apple, unnecessary-Live, unnecessary-Codex, contextual, pt-PT and English results. Empty subsets SHALL be unavailable. Critical under-routing SHALL be distinguishable from unnecessary escalation and fail the configured safety check.

#### Scenario: Unsafe downgrade
- **WHEN** a supplied prediction selects local for a critical project mutation that requires Codex
- **THEN** it contributes an incorrect route and severe under-routing error and fails the safety check

#### Scenario: Incomplete or ambiguous prediction file
- **WHEN** predictions omit a case, repeat an ID, introduce an unknown ID/tier or target an incompatible fixture version
- **THEN** evaluation fails clearly without publishing a misleading complete score

### Requirement: Evaluation does not fabricate baseline evidence

The evaluator SHALL identify prediction provenance, and no default prediction source SHALL be presented as a measured production router. Synthetic oracle/error fixtures SHALL be labeled tests of the evaluator. Absence of real predictions SHALL yield validation-only results or an explicit missing-input error, never an invented runtime score.

#### Scenario: Dataset is validated without predictions
- **WHEN** only the checked-in corpus is supplied
- **THEN** output establishes fixture validity and does not claim production accuracy or cost savings

### Requirement: Fixed bilingual voice corpus

The benchmark SHALL contain 30–50 synthetic pt-PT/English phrases covering technical words, dates/times/numbers/units, questions, concise KITT-style answers, short summaries, pronunciation challenges and interruption/consecutive-playback scenarios. The documented future comparison SHALL separate raw Apple, processed local and cloud voices, human quality scores and playback metrics, with untested combinations explicitly pending.

#### Scenario: Corpus exists before local synthesis
- **WHEN** the Phase 0 voice corpus is complete but no local engine or physical listening evaluation exists
- **THEN** it is reported as a prepared test corpus and voice quality/latency acceptance remains unmeasured
