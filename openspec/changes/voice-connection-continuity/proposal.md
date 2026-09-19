## Why

Build 31 physically interrupted an active bilingual conversation during a read-only Codex follow-up. Retained diagnostics show 201,372 ms of Realtime exposure, three completed source turns and an unknown outcome, without an idle Stop or native Stop observation. The trigger is not established. After diagnosis-first build 32, the owner again experienced unwanted silence shutdown and explicitly requested removal of all inactivity-limit code.

## What Changes

- Remove the automatic inactivity timer, all web integration and obsolete native idle diagnostic hooks. Preserve manual Stop and native safety limits.
- Correct established-session interruption wording without changing unknown state or retry eligibility.
- Add bounded fixed failure-origin/category diagnostics at existing transport failure boundaries, including whether server start had been observed. Do not change protocol validation, recovery, or unknown-outcome semantics.
- Retest and deliver an in-place phone-only build with unchanged signing, pairing, host, selected task and permissions.

## Capabilities

### New Capabilities

- `voice-connection-continuity`: owner-controlled silence behavior and bounded evidence for unexplained transport interruptions.

### Modified Capabilities

None in the main spec inventory. This change supersedes the unarchived `voice-terminal-diagnostics` silence-timer requirement. Its native-first explicit Stop safeguards remain in force.

## Impact

Bundled web lifecycle integration and focused tests, bounded native diagnostic emission/tests, physical delivery evidence. No routing optimization, voice substitution, prompt change, generic passthrough, automatic reconnect or mutation retry.
