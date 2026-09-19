## 1. Native aggregate measurement

- [x] 1.1 Extend the existing bounded usage measurement with explicit lifetime/scope, valid user/assistant transcript-part counters, replay distinction and saturation; verify focused Swift tests for invalid parts, duplicates, capping and absence of content/identifiers in summaries.
- [x] 1.2 Add supported camelCase token-notification validation and selected-source-task cumulative observed-window accounting; verify synthetic Swift tests for first/duplicate/increasing/decreasing snapshots, wrong task, absent/malformed/negative/fractional/overflow values and subset accounting.
- [x] 1.3 Add monotonic realtime-open exposure proxy and clean/interrupted closure state; verify deterministic clock tests for repeated start, clean close, transport loss and duplicate terminal flush suppression.
- [x] 1.4 Integrate aggregate-only summaries through existing bounded diagnostics without altering production decisions or requests; verify all emitted detail records fit the existing limit and review dispatch, task/host, permission, prompt and audio code for unchanged behavior.

## 2. Offline bilingual benchmark

- [x] 2.1 Add 50–100 synthetic versioned routing cases with the required tier labels, categories and bounded follow-up chain metadata in pt-PT/English; verify fixture validation, unique IDs, tier consistency and required coverage.
- [x] 2.2 Add 30–50 versioned bilingual voice phrases with pronunciation, technical, summary and playback-scenario coverage; verify fixture validation, unique IDs and required category/language coverage.
- [x] 2.3 Implement an offline supplied-prediction evaluator with documented denominators and machine-readable quality/safety metrics; verify controlled perfect/unsafe/over-escalated cases plus missing, duplicate, extra, invalid-tier and incompatible-version input failures.
- [x] 2.4 Document runner commands, prediction provenance and synthetic-only self-test status; verify validation without predictions never reports production accuracy or a runtime cost baseline.

## 3. Baseline collection contract

- [x] 3.1 Deliver the physical measurement procedure and baseline report template covering iPhone/parked CarPlay, pt-PT/English, conversational/project/follow-up work, lifecycle/fallback checks, aggregate manual user-turn/latency observations and token/audio caveats; verify no private identifiers, transcripts or invented values are included.
- [x] 3.2 Record the actual available offline/Simulator evidence and missing physical/token/audio/latency data; verify the report explicitly keeps the physical Phase 0 gate pending and distinguishes older documented physical acceptance from current-host validation.

## 4. Integration verification

- [x] 4.1 Run focused and existing relevant Swift tests plus offline evaluator tests; record exact commands/results and verify no failures are concealed by synthetic benchmark scores.
- [x] 4.2 Run public-source audit, web build and an unsigned Simulator build in an isolated copy that preserves original signing; verify final branch/status and original generated-project preservation evidence.
- [x] 4.3 Review the completed diff against both capability specs and security invariants, run strict OpenSpec validation and document residual limitations; verify no routing/prompt/audio/security/permission changes and no claim that physical gate has passed.

## 5. Physical Phase 0 exit gate — pending real device access

- [ ] 5.1 Collect representative current-build iPhone and parked CarPlay sessions using the documented procedure, record aggregate backing-turn and cloud-exposure evidence with provenance, then assess latency/fallback/quality limits; verify physical data exists for both surfaces before marking this task or the Phase 0 exit gate complete. Offline implementation and Simulator success cannot complete this task.
