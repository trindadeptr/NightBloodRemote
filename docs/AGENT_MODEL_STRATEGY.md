# KITT agent model strategy

Updated 19 September 2026 following the owner's Pro upgrade. This repository
addendum adapts the KITT Project's `AGENT_MODEL_STRATEGY.md`; the synced Project
reference remains read-only. This governs development agents, not the model or
permission settings of the selected KITT voice task.

## What Pro changes

Pro increases the available Work/Codex allowance, but does not make usage
unlimited. Astra was already available in Work/Codex on Plus. GPT-6 Pro in Chat
has separate access and limits; it is not an additional model identifier to
invent for delegated coding agents. Available models and actual remaining
allowance must be checked in the current environment. See
[OpenAI's Work/Codex usage guidance](https://help.openai.com/en/articles/20001516-managing-usage-with-gpt-6-astra-in-work-and-codex).

Use the extra allowance for complete verification, representative benchmarks,
and an independent review at meaningful gates. Do not abbreviate required work
to conserve allowance, or increase reasoning merely because allowance exists.

## Model and effort selection

| Work | Default | Escalation condition |
| --- | --- | --- |
| Coordination and OpenSpec explore | GPT-6 Astra / Medium | Isolate a difficult subproblem rather than upgrading the whole run. |
| OpenSpec proposal affecting protocol, routing or audio | GPT-6 Astra / High | Produce a bounded design and acceptance criteria, then hand implementation back. |
| Focused documentation/API research | GPT-5.6 Terra / Medium | Conflicting evidence requiring architectural judgment. |
| Normal Swift implementation and tests | GPT-5.6 Sol / Medium | Unfamiliar integration, unresolved failures, or subtle lifecycle interactions. |
| Complex integration implementation | GPT-6 Astra / Medium | Use directly when known complexity warrants it; there is no requirement to fail on Sol first. |
| Mechanical edits and fixture expansion | GPT-5.6 Terra / Low | Stop and escalate if semantic or security decisions appear. |
| Difficult debugging or security/protocol decisions | GPT-6 Astra / High | State the concrete problem and exit condition; return routine work afterward. |
| OpenSpec verify and final security/architecture review | GPT-6 Astra / High | Review evidence independently at phase gates, not after every small edit. |

Keep the coordinator at Medium. Higher effort is not a substitute for missing
files, protocol evidence, physical devices or human listening tests. Fast mode
and maximum effort remain opt-in for a concrete need, not subscription defaults.

## Delegation and continuation

- Delegate bounded independent work with explicit file ownership, invariants,
  test commands and acceptance criteria. Reuse useful findings rather than
  repeatedly passing full project history.
- Preserve work after a limit interruption. Inspect the files and worker state,
  then resume the unfinished subtask after allowance is available; do not replay
  mutations or restart completed work.
- Use only model/effort combinations exposed by the current tools. If model
  switching is unavailable, continue with the existing capable coordinator and
  disclose the limitation rather than claiming a switch occurred.
- Check allowance before substantial work when useful. Never purchase credits,
  redeem resets, or change account settings without explicit authorization.

## KITT runtime remains a separate optimization problem

The Pro upgrade does not change the runtime hierarchy:
native Swift → Apple Intelligence → GPT Live → Codex. Keep baseline measurement,
physical iPhone/CarPlay gates, exact host/task binding, existing task permissions,
at-most-once actions and unknown-outcome handling. Do not select a more expensive
runtime model merely because the development account has more allowance.
