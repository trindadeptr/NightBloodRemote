# KITT offline benchmark

This directory contains synthetic evaluation material for later KITT routing and
voice work. It does not contain private transcripts, real task or host IDs,
recorded audio, production predictions, a runtime baseline, or evidence of cost
savings. The current labels are agent-authored and explicitly remain pending
human review.

## Validate the corpora

Run from the repository root:

```bash
python3 scripts/kitt_benchmark.py
python3 -m unittest scripts/test_kitt_benchmark.py -v
```

The first command performs fixture validation only. Its JSON output deliberately
contains `evaluation: null` and false runtime/baseline/quality claims. It does
not run a router, synthesize speech, contact a service, or invent predictions.

`routing_cases.json` contains 80 versioned synthetic cases. Each case has a
stable ID, language, category, utterance, expected minimum tier, acceptable
tiers, expected action, critical/contextual flags, rationale, and optional
bounded conversation state. Conversation state contains only synthetic chain
metadata and small routing facts; it contains no full history or real identity.
It is the state immediately before the case is routed. `activeWork` therefore
describes work established by an earlier turn, while a first-turn request that
starts new work has `activeWork: false`.

`datasetVersion` identifies corpus content independently of `schemaVersion`.
When utterances, context or expected labels change after a recorded evaluation,
bump the dataset version in both corpora and the runner before collecting new
predictions. Old predictions must not be scored against changed labels.

The tier order is:

```text
local < apple < live < codex
```

The action labels are:

- `new`: begin a new answer or unit of work;
- `steer`: continue the active project work in its existing context;
- `clarify`: obtain missing or uncertain intent before execution;
- `fallback`: use the labeled higher tier because a lower capability is
  unavailable.

The corpus describes target decisions for candidate routers. It does not assert
that any production local action, Apple path, or fallback is implemented.
Fresh-information cases use Codex because this phase has no verified claim that
GPT Live has the required external-information tools.

`voice_phrases.json` contains 40 versioned synthetic phrases for pt-PT and
English. It covers ordinary answers, technical terms and filenames, numbers,
dates, times, percentages, units, questions, concise KITT-style lines, short
Codex summaries, pronunciation challenges, interruption, and rapid consecutive
playback. Every phrase has `humanReviewStatus: pending` and `humanScores: null`.
Do not call these phrases human-reviewed until a reviewer and review time are
recorded as provenance.

## Evaluate supplied predictions

The runner accepts predictions produced elsewhere; it includes no classifier.
Use this format:

```json
{
  "schemaVersion": 1,
  "dataset": "kitt-routing",
  "datasetVersion": 1,
  "provenance": {
    "name": "candidate-router-build-17",
    "kind": "runtime-candidate",
    "details": "Offline export from the named candidate configuration."
  },
  "predictions": [
    {"id": "pt-det-001", "tier": "local", "action": "new"}
  ]
}
```

The array must contain exactly one prediction for every checked-in routing case.
Missing, duplicate, extra, invalid-tier, invalid-action, or incompatible-version
input exits with status 2 and produces no score. `provenance.kind` is either
`runtime-candidate` or `synthetic-evaluator-test`; the latter is for controlled
evaluator tests and is not production evidence.

Evaluate a complete file with:

```bash
python3 scripts/kitt_benchmark.py --predictions /absolute/path/to/predictions.json
```

Write the aggregate JSON result to a file with:

```bash
python3 scripts/kitt_benchmark.py \
  --predictions /absolute/path/to/predictions.json \
  --output /absolute/path/to/result.json
```

Exit status 0 means the input is valid and passes the safety gate. Status 1
means evaluation completed but a critical under-route, critical action error,
or clarification violation failed the safety gate. Status 2 means validation
failed. Results contain aggregate counts and ratios only, never utterances or
rationales.

## Metric definitions

Every ratio is emitted as `numerator`, `denominator`, and `value`. A zero
denominator yields `value: null` rather than zero.

| Metric | Numerator | Denominator |
|---|---|---|
| `routingAccuracy` | predictions whose tier belongs to `acceptableTiers` | all cases |
| `actionAccuracy` | predictions with the expected action | all cases |
| `decisionAccuracy` | predictions with both an acceptable tier and expected action | all cases |
| `falseLocalRate` | predictions at `local` below the expected minimum tier | all cases |
| `falseAppleRate` | predictions at `apple` below the expected minimum tier | all cases |
| `unnecessaryLiveRate` | predictions at `live` when a cheaper acceptable tier exists | all cases |
| `unnecessaryCodexRate` | predictions at `codex` when a cheaper acceptable tier exists | all cases |
| `contextualFollowupAccuracy` | contextual cases with both acceptable tier and expected action | contextual cases |
| `ptPTAccuracy` | pt-PT cases with both acceptable tier and expected action | pt-PT cases |
| `enAccuracy` | English cases with both acceptable tier and expected action | English cases |
| `criticalUnderRoutingRate` | critical predictions below their expected minimum tier | critical cases |
| `clarificationViolationRate` | clarification cases predicted with another action | clarification cases |
| `criticalActionViolationRate` | critical cases predicted with another action | critical cases |

An unacceptable higher tier is an accuracy and possible unnecessary-escalation
error, not a false-local/false-Apple safety error. A critical tier downgrade
fails even if its action label is correct. A critical action mismatch also
fails, so a matched tier cannot hide unsafe `new` versus `steer` or `clarify`
behavior.

## Future voice comparison

The corpus prepares a later physical comparison of:

1. raw Apple system voice;
2. processed Local KITT Voice Engine;
3. current cloud Realtime voice.

For each tested combination, record human scores separately for
`intelligibility`, `naturalness`, `KITTCharacterFit`, `ptPTPronunciation`,
`enPronunciation`, and `fatigueOverLongerUse`. Record objective
`localTtsFirstAudioMs`, `localTtsCompletionMs`, `audioUnderruns`,
`audioInterruptionsRecovered`, `carPlayRouteFailures`, and `voiceFallbacks`
where those values are actually observed. Include the device/surface,
configuration, reviewer provenance, and whether the result is pending. Do not
collect microphone content or fill unavailable measurements with zero.

No voice variant has been synthesized, listened to, or accepted by this
benchmark implementation. iPhone and parked CarPlay voice quality, pronunciation,
latency, interruptions, and fallback behavior remain pending physical review.
