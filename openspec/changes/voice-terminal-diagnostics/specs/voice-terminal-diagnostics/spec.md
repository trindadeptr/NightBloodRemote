> Continuation: the owner subsequently requested removal of automatic silence
> shutdown. The inactivity requirement below records build31's historical scope;
> `voice-connection-continuity` supersedes it for build33. Native sole Stop
> ownership and unknown-outcome protections remain applicable.

## Purpose

Keep native sole ownership of Voice Stop synchronized with local media and prevent obsolete idle timers from ending an active conversation.

## ADDED Requirements

### Requirement: Web stop is bound to the native session owner

An accepted web Stop SHALL synchronously capture the exact owning native source/session and join or create its existing sole stop operation. The asynchronous reply SHALL await that captured operation, not look up a later session. Foreign sources MUST NOT stop active Voice. Unknown outcomes MUST NOT be retried or reported as confirmed stopped.

#### Scenario: Idle Stop with active owned Voice
- **WHEN** idle cleanup requests Stop and no stop operation exists
- **THEN** exactly one native stop owner is created for that session and its result is awaited

#### Scenario: Concurrent or stale Stop
- **WHEN** a same-session Stop repeats or an old/other-surface request reaches a different session
- **THEN** repeated work joins the captured owner and stale/foreign work cannot mutate the different session

#### Scenario: No owned Voice or uncertain outcome
- **WHEN** no owned Voice remains
- **THEN** known inactive state permits an idempotent no-op, while unknown state is not falsely reported as confirmed stopped

### Requirement: Local media teardown follows native Stop outcome

JavaScript SHALL request and await native Stop before local media teardown, release media on both success and failure, report success only when confirmed, and preserve serialized Stop and subsequent Start. Native cleanup MUST NOT deadlock waiting on that same web Stop promise.

#### Scenario: Native Stop is pending or fails
- **WHEN** native Stop is delayed or fails
- **THEN** teardown ordering remains native-first, media is released when the operation settles and failure remains visible without an automatic retry

### Requirement: Idle expiry respects current activity

The idle timer SHALL recheck current speech, awaiting response, backing work and session eligibility at expiry. Backing-work activation SHALL cancel pending idle timers. The idle duration SHALL be 30 seconds as requested by the owner.

#### Scenario: Activity begins after timer was armed
- **WHEN** work or speech begins before an idle callback executes
- **THEN** that obsolete callback does not stop the active session

### Requirement: Idle diagnostics and delivery remain truthful

Persisted idle-stop diagnostics SHALL use only fixed known event markers and safe bounded fields, without raw errors, transcripts or identities. Delivery SHALL distinguish the repaired code defects from unresolved physical audio/connection causes.

#### Scenario: Idle Stop fails with arbitrary error text
- **WHEN** an idle-stop event contains private or unrecognized detail
- **THEN** diagnostics persist only the safe event classification and do not claim that all physical interruption causes are fixed
