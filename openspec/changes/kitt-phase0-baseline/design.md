## Context

See proposal.md for motivation. The current transport already counts attempted/sent/accepted/failed-or-unknown RPCs, raw transcript observations, and unique source/created task turns. Its identifier sets stop at 4096 entries. `NightBloodCarPlayDiagnostics` retains 80 events and truncates detail to 160 characters. Existing tests verify replay separation and identifier omission. The measurement object currently spans a transport lifetime, which must not be presented as a single Voice session without evidence.

The locally installed App Server 0.155.0-alpha.9 experimental JSON schema defines `thread/tokenUsage/updated` with required `threadId`, `turnId`, and `tokenUsage { last, total }`. Breakdown fields are `inputTokens`, `cachedInputTokens`, `outputTokens`, `reasoningOutputTokens`, `totalTokens` and optional `cacheWriteInputTokens`. Totals cover task lifetime. Realtime transcript-done has `role`, `text`, `threadId` but no unique event ID, and represents a transcript part. Neither notification establishes user utterance boundaries or billed Realtime audio duration.

## Goals / Non-Goals

**Goals:** Add bounded, testable evidence with explicit scope and availability; establish repeatable synthetic fixtures and physical data collection contracts.

**Non-Goals:** Do not infer production routes from benchmark labels, change protocol validation or request dispatch, create new persistent analytics storage, install a build on the working phone, or claim physical acceptance from a Simulator.

## Decisions

### Extend existing measurement rather than create an analytics subsystem

Keep measurement within native Swift and reuse the existing diagnostics channel. Limit event categories, ephemeral IDs and pending state. Saturate counters safely instead of overflowing; expose truncation/capping. Persist only aggregate numeric values, bounded availability labels and ephemeral sample labels. Never persist the IDs used for deduplication. Structure summaries so each record fits the 160-character detail limit; existing lifecycle capacity remains bounded.

Raw observations, distinct turn IDs, valid finalized user transcript parts and invalid/dropped observations have different names. Replayed transcript parts cannot be reliably deduplicated and must not be called user turns. Source and native-created task scopes stay separate. Transport lifetime is the default measurement scope; manual baseline sessions must note/reset the scope through existing lifecycle rather than silently assuming one object equals one session. A new persistent database and content-based transcript hashing were rejected as unnecessary and privacy-sensitive.

### Interpret token notifications as cumulative evidence

Validate the observed upstream camelCase schema with nonnegative finite integral values, consistent component bounds, safe arithmetic, required keys and exact selected source-task scope before updating metrics. Unknown/malformed notifications contribute no tokens and never fail Voice. Add the notification as an observer only, not a new RPC or permission path.

For the selected source task only, the first valid `total` snapshot establishes an in-memory baseline; subsequent monotonic differences provide observed-window tokens. Do not add `last` repeatedly or label lifetime totals as session consumption. Duplicate snapshots contribute zero. Decreases/inconsistent snapshots flag unavailable or discontinuous evidence and reset the baseline conservatively without fabricating negative usage. Keep one bounded source-task accumulator and mark saturation; created-task token accounting is outside this increment. Include coverage: no samples, baseline only, observed window, discontinuity/capped as applicable. Do not sum cached/reasoning subsets into input/output again. Do not claim the window is exclusively Voice work: concurrent activity in that task can contribute.

Guessed payload names, character-to-token estimates and adding cumulative snapshots were rejected because they misstate costs. Schema compatibility is tested from synthetic fixtures based on the inspected schema; future unsupported forms stay unavailable.

### Keep benchmark evaluation offline and prediction-driven

Use versioned JSON fixtures with stable unique IDs, language, category, utterance, bounded synthetic conversation state, expected minimum tier, acceptable tiers, critical/contextual flags and rationale. Use `local`, `apple`, `live`, `codex` tier names. Follow-up chains include explicit predecessor metadata and state changes; no actual task IDs or private transcripts. Fresh-information cases require a route declared capable of external information; absent a verified Live tool capability, label Codex acceptable rather than assume Live can browse.

A standard-library offline runner validates fixtures and accepts explicit prediction files keyed by case ID. It rejects duplicates, missing/extra cases, invalid tiers and incompatible dataset versions. It emits machine-readable counts and ratios for overall/critical/language/context accuracy, false-local, false-Apple, unnecessary Live and unnecessary Codex escalation. Document every denominator; empty subsets are unavailable. Accuracy means membership in acceptable tiers; under-routing and over-routing are separate. Critical unsafe downgrades fail the configured safety check. Controlled perfect/incorrect prediction fixtures test the evaluator and are explicitly synthetic, never runtime baseline files. No automatic classifier or cloud request is added.

The voice corpus is a distinct 30–50 phrase fixture covering pronunciation, embedded technical English in pt-PT, numbers, time, units, short summaries, questions, KITT tone and interruption/consecutive-playback scenarios. It prepares later raw Apple/processed-local/cloud listening comparisons but runs no synthesis in Phase 0.

### Separate instrumentation readiness from the physical exit gate

A baseline document records build/OS/desktop versions, surface, language, session count, evidence provenance, observed metrics and missing data without public identifiers. Specify representative conversational/project/follow-up sessions on an iPhone and parked CarPlay, plus Stop/reconnect, Settings preservation, foreground and fallback checks. Record true user turns manually as aggregate counts where protocol data is insufficient. Record observed backing turns and the token coverage caveat. Measure latency manually with a defined end-of-utterance/first-audible-response procedure until reliable endpoints exist; do not turn transport age into response latency.

Cloud connected time can be documented only as an exposure proxy. Actual transmitted/received audio durations and billable units remain unavailable unless direct evidence supports them. A pending baseline report is a valid deliverable of tooling implementation, but does not satisfy Phase 0's physical gate or justify later routing/default changes or savings claims.

Measure the realtime-open interval with a monotonic clock, starting on validated start evidence and ending on close or transport loss. Report whether closure was clean and suppress duplicate terminal flushes; an interrupted interval is incomplete exposure evidence. Replay of a start while already open must not reset its clock. This adds no media inspection or change to the connection state machine.

## Risks / Trade-offs

- Experimental schema differs on the actual host → reject unsupported forms safely and record version/availability; no production protocol fallback.
- Replayed/historical events and concurrent task work contaminate interpretation → separate observation/unique counters and disclose task-lifetime/window coverage.
- Diagnostics evict early records → preserve aggregate snapshots, report bounded coverage, collect promptly after each test; do not increase retention of sensitive material.
- Fixture success can be mistaken for product success → explicit prediction provenance and pending physical gate in reports.
- Build regeneration overwrites signing → verify in a disposable build copy and preserve the original generated project; no working-phone install in this phase.

## Migration Plan

There is no data migration or runtime rollout switch. Add measurement observers and development fixtures; run focused Swift/offline tests, public-source audit, web build and an isolated unsigned Simulator build. Review the diff for unchanged prompts, routing, dispatch, security and signing. If instrumentation regresses behavior, remove the observer/measurement additions; existing Voice remains the only active path. Leave physical acceptance pending until real sessions are collected.
