> Continuation: the owner subsequently requested removal of automatic silence
> shutdown. The inactivity requirement below records build31's historical scope;
> `voice-connection-continuity` supersedes it for build33. Native sole Stop
> ownership and unknown-outcome protections remain applicable.

## Context

JavaScript performStop closes media before signalling.stop; native bridgeStop currently returns without beginning a stop when no owner exists. The 15-second idle timer does not recheck activity at expiry, and setWorking(true) does not cancel it. These are concrete code defects. They can explain silent local teardown, but the physical trace does not establish that they caused every observed interruption.

## Goals / Non-Goals

**Goals:** Repair idle/native Stop coordination using existing authority, eliminate stale timers and observe fixed idle-stop markers.

**Non-Goals:** General terminal UI/reason classification, audio processing, credentials/permissions, mutation retries or automatic Voice restart.

## Decisions

1. Replace deferred unscoped bridgeStop lookup with synchronous MainActor beginBridgeStop(from:) returning a captured Task. At message receipt, validate the native source face against sessionFace before joining/creating the existing sole stop owner. Capture the currently owned transport synchronously; the asynchronous wrapper only awaits that Task and replies. Never resolve an old deferred request against a new session. No task/host identity is exposed to JavaScript.
2. Reuse beginStop rather than introducing a second mutation owner. Mark stopping and invalidate applicable grants/generation synchronously before returning the captured operation. Concurrent same-session Stop joins the existing operation. A foreign source cannot stop active Voice. With no owned Voice, only known inactive state permits a successful no-op; unresolved outcomes must not be reported as confirmed stopped or retried.
3. JavaScript performStop awaits native signalling before releasing local media in finally. Report idle only after success and propagate failure without hiding uncertainty. Preserve stopPromise deduplication and start's wait for that promise. Native closeLocalOnly remains independent of stopPromise, avoiding a native/web wait cycle when confirmed native cleanup closes the peer.
4. Cancel pending idle timers when backing work starts, and recheck user speech, assistant speech, awaiting response, backing work and current session eligibility at expiry. Preserve the owner-requested 30-second duration and existing teardown/reset behavior.
5. Persist only fixed allowlisted idle-stop-started/completed/failed, native-stop-accepted and terminal-server-observed event names through the existing bounded ring, with safe booleans/numeric data only if needed. Do not persist raw JS error/detail, remote reasons, transcripts or identifiers. Markers supply no mutation authority.

## Risks / Trade-offs

- Old or other-surface request stops current Voice → source validation and synchronous native transport capture before asynchronous work; preserve JavaScript start/stop serialization.
- Native/web stop deadlock → closeLocalOnly must not await stopPromise; test deferred native completion.
- Timer fires during renewed activity → cancel on work and recheck at expiry.
- Physical audio has another cause → record actual test results and remaining uncertainty; no general root-cause claim.

## Migration Plan

Implement the narrow repair and focused JS/native tests, run existing build/lifecycle checks, then deploy through the authorized workflow with signing/pairing unchanged. Record physical idle, active-work and explicit Stop behavior. Broader terminal diagnostics and unexpected-close UI are deferred.

## Owner update

The owner explicitly requested increasing inactivity shutdown from 15 to 30 seconds. Apply 30 seconds to the idle timer and tests; activity and mutation safeguards remain unchanged.
