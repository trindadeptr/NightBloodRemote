## Why

KITT already counts protocol observations, but transcript events are not user turns and replayed notifications are not new executions. There is no recorded Phase 0 iPhone/CarPlay cost baseline or fixed bilingual evaluation corpus. Later routing changes need trustworthy measurements before claiming savings or changing the working Voice experience.

## What Changes

- Extend existing bounded aggregate diagnostics with explicit observation, unique-turn, token-availability and measurement-scope semantics. Consume validated upstream Codex token notifications where supported; never infer tokens from characters.
- Add 50–100 synthetic pt-PT/English routing cases covering deterministic commands, conversational requests, fresh-information needs, project work, mutations and contextual follow-up chains.
- Add an offline evaluator for supplied predictions, with safety-weighted errors and per-language/context results. Synthetic evaluator tests are never a runtime baseline or evidence of an implemented router.
- Add 30–50 synthetic bilingual voice phrases and a physical iPhone/CarPlay measurement procedure, including latency, cloud audio observability and human voice review fields.
- Record unavailable measurements and the pending physical baseline gate explicitly. Implementation completion alone does not satisfy Phase 0's measurement exit gate.

Non-goals: production routing or routing context, prompt changes, local STT/TTS, Foundation Models, network evaluation services, audio capture, new credentials, permission changes, pairing changes, deployment, commits or publishing.

## Capabilities

### New Capabilities

- `voice-baseline-measurement`: Privacy-preserving protocol evidence and an honest physical baseline measurement contract.
- `kitt-benchmark-evaluation`: Fixed bilingual routing/voice corpora and offline evaluation of explicit prediction inputs.

### Modified Capabilities

None. No existing OpenSpec specifications were present when this change was proposed.

## Impact

The measurement extension targets `CodexVoiceUsageMeasurement` and notification handling in `CodexRemoteVoiceTransport.swift`, its focused Swift tests and existing `NightBloodCarPlayDiagnostics` output limits. New benchmark fixtures, an offline runner/tests and documentation add development tooling without a production dependency. The current protocol, routing, prompts, microphone ownership, security boundaries, signing and fallback behavior remain unchanged.
