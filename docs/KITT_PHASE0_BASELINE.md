# KITT Phase 0 baseline ledger

## Status

**Physical baseline: pending.** This document records the current evidence and
the collection contract for the existing cloud Voice path. It does not claim a
cost saving, routing accuracy result, or physical voice-quality result.

Phase 0 may only be considered physically complete after representative
current-build sessions have been measured on both an iPhone and parked CarPlay.
Simulator and fixture results are useful implementation checks; they are not
evidence of physical audio, pairing, latency, or billing behaviour.

### Physical deployment preparation — 19 September 2026

The owner authorized deployment to an iPhone 15 Plus. It is connected by USB,
paired with the development Mac, and has Developer Mode enabled. Device
inspection reports iOS 27.0; Xcode 26.5 built the app successfully using the
iOS 26.5 SDK. Installation and process launch subsequently succeeded on this
device; this does not establish voice or lifecycle compatibility.

A private build copy produced version 1.8.2, build 29 with Phase 0 measurement
instrumentation. Both the app and Live Activity extension passed signature
verification, and their embedded profiles include this phone and match their
signed application identities. The original generated signing project remains
unchanged. Existing local signing is phone-only: neither the app profile nor
signed app includes the CarPlay entitlement. This build will not appear in
CarPlay; physical CarPlay validation requires appropriately entitled signing.

The initial device-lock blocker was resolved when the owner unlocked the phone.
Installed-app inspection confirmed version 1.8.2, build 28 with the matching
bundle identity. An in-place installation succeeded, a separate inspection
confirmed build 29, and the app launched successfully. No uninstall, pairing,
account, host, selected-task or task-permission changes were performed.
Retained connection state and audible Voice still require human verification.
Apple Intelligence is not required for this Phase 0 build or baseline.

### Authentication recovery follow-up — build 30

The owner reported HTTP 401 in build 29 setup; rereading saved state repeated
the rejection. A separate `paired-environment-auth-recovery` change adds explicit
refresh/browser recovery for confirmed-pairing environment GET401, retaining
account/host checks and durable setup. Build 30 passed 95 Simulator tests,
signing checks and in-place installation; installed version and process launch
were independently verified on the iPhone 15 Plus. Owner authentication and
audible Voice remain pending. This does not complete the Phase 0 baseline.

## Current pipeline and known baseline

Inspection began from clean source commit `349ecc9` on `setup/simulator-kitt`.
The tracked app manifest specifies version 1.8.2, build 28. The iPhone 15 Plus
now has the privately numbered instrumented build 30 described above. Effective
voice-task configuration has not been independently inspected or changed.

The current path remains the working direct Realtime voice pipeline. There is
no production local router, on-device STT, Foundation Models response path,
local KITT voice engine, or text-first GPT Live path. KITT's character prompt
is 7,850 bytes and compact delegated-reply instructions currently apply only to
NightBlood. The existing startup safeguards remain enabled:

- `includeStartupContext = false`
- `initialItems = []`
- `flushTranscriptTailOnSessionEnd = false`

The transport already observes protocol evidence. It distinguishes raw and
unique `turn/started` observations, treats transcript events as transcript
parts rather than user turns, and keeps source-task and native-created-task
scopes separate. Those counters are transport-lifetime evidence, not a
guaranteed one-voice-session total. Notification replay is possible.

Phase 0 instrumentation now adds validated selected-task token snapshots, a
cumulative observed-window delta and an observed Realtime-open exposure proxy.
This describes implemented measurement capability, not a collected live baseline.

### Reading aggregate diagnostics

The existing diagnostics trace emits the following terminal records once per
transport. Group records by their random `sample` label, which is unrelated to
account, host or task identity. Every detail record fits the existing
160-character limit; the existing ring still retains at most 80 records.
Collect the complete group promptly after each session because later lifecycle
events can evict it. A missing record means incomplete evidence.

| Record suffix (`voice.measure.`) | Meaning |
| --- | --- |
| `aggregate` | Transport lifetime, category count, and overall capping flag. |
| `rpc` | Realtime-start and explicit turn-start attempts; attempts do not prove execution. |
| `sourceTurns`, `createdTurns` | Separate observed/unique started (`sObs`, `sUnique`) and completed (`cObs`, `cUnique`) turns. |
| `parts`, `partStatus`, `bytes` | Valid user/assistant finalized parts, raw final observations, invalid parts and UTF-8 byte counts. These are proxies, not user turns or tokens. |
| `tokenTotal`, `tokenSubsets` | Selected-source-task observed-window tokens and coverage status. Cached/reasoning values are subsets; do not add them to totals again. |
| `realtime` | Monotonic exposure from observed Realtime start to terminal observation; billable audio remains unavailable. |

Token status is `unavailable`, `baselineOnly`, `observedWindow`, `discontinuous`
or `capped`. Only `observedWindow` publishes numeric token deltas, including a
valid zero between unchanged snapshots. The first snapshot is excluded.
Decreases or capping invalidate the window for the rest of that transport.
Use the overall `capped` flag when interpreting any protocol counts.

`closure=clean` means the server's closed notification followed a local Stop
attempt. Unexpected server closure, an error or transport loss is `interrupted`;
no observed start yields unavailable exposure. These are measurement labels,
not changes to the existing stop/start outcome state machine.

## Evidence available today

| Evidence | Result | What it establishes | What it does not establish |
| --- | --- | --- | --- |
| Pre-change unsigned isolated Simulator suite | 73 tests, 0 failures; iOS 26.5 / Xcode 26.5 | Existing lifecycle and focused simulated behaviour | iPhone microphone/media, physical latency, pairing or CarPlay acceptance |
| Instrumented unsigned isolated Simulator suite | 87 tests, 0 failures, including 14 new usage tests; same OS/Xcode | Instrumentation, replay, malformed input, privacy, saturation and existing regressions | Current physical Voice cost, audio reliability or quality |
| Synthetic benchmark preparation | 80 routing cases, 40 voice phrases; 13 evaluator tests pass | Fixture validity and evaluator behavior | Production routing accuracy, human label approval, voice quality or savings |
| Desktop transcript-helper tests | 11 tests, 0 failures | Helper integration checks | A real selected task or current desktop host attachment |
| Public-source audit | Source-content checks pass | Public source remains free of checked sensitive content | Physical voice behaviour or a clean historical Git-author-metadata audit |
| Current local desktop schema inspection | Desktop 26.915.31029 (9771), bundled CLI 0.155.0-alpha.9 | The local experimental schema can be used to implement a strict observer | That an actual selected task emits the notification or that the current host is physically accepted |
| Historical physical documentation | Voice and CarPlay were previously documented on desktop 26.908.70816 (9275) | A past tested combination existed | Compatibility or acceptance for the current desktop/app/device combination |

The public-source audit's historical Git author-metadata finding is pre-existing
repository history. It is unrelated to the Phase 0 baseline and must not be
changed as part of this work.

### Reproducible verification

Completed on 19 September 2026:

```sh
python3 scripts/kitt_benchmark.py
python3 -m unittest discover -s scripts -p 'test_kitt_benchmark.py'
python3 -m unittest discover -s ios/NightBloodRemote/DesktopTranscript -p 'test_*.py'
npm --prefix app/ui run typecheck
openspec validate kitt-phase0-baseline --strict
make audit
```

The corpus, tests, typecheck and OpenSpec validation pass. `make audit` exits
nonzero solely for the pre-existing historical author-metadata finding; all
source-content checks pass. History was not rewritten.

The documented `make simulator-test SIMULATOR='iPhone 17 Pro'` command ran in
a disposable copy, including the web build and project generation. After fixing
the new test's module import, all 87 tests passed. Tested Swift sources and the
manifest were byte-for-byte equal to the working tree. The original generated
Xcode project's checksum stayed unchanged; no physical app was installed and
no selected-task request or permission change was made.

The documented `make simulator-build` also passed in the disposable copy for
the generic unsigned Simulator destination, compiling arm64 and x86_64.

The new Swift file is explicitly listed in `project.yml`. Future device builds
must include it while preserving local signing as described in [Setup](SETUP.md);
the original ignored generated project was deliberately not regenerated here.

### Token schema provenance

The installed App Server's offline `app-server generate-json-schema --experimental`
command produced `v2/ThreadTokenUsageUpdatedNotification.json`. No live task or
network listener was opened. Its required envelope contains `threadId`, `turnId`
and `tokenUsage`, with required `last` and `total` breakdowns. Each breakdown
requires integer `inputTokens`, `cachedInputTokens`, `outputTokens`,
`reasoningOutputTokens` and `totalTokens`; `cacheWriteInputTokens` defaults to
zero when absent. These camelCase wire fields differ from internal snake_case
types visible in binary strings. The observer must use the verified wire shape.

The current schema is implementation evidence, not a promise that every paired
host emits it. Keep absent/unsupported evidence unavailable. Neither `last` nor
`total` is a price, and token subcategories must not be added twice.

## Measurements that are currently unavailable

Missing data is **unavailable**, never zero.

| Measurement | Current value | Required collection method / limit |
| --- | --- | --- |
| True user utterances | Unavailable | Manually tally aggregate finalized spoken requests; transcript parts are not utterances. |
| Selected-task backing turns | Unavailable | Record aggregate observed and unique backing turns from the instrumented transport, with scope and saturation status. |
| Codex text tokens | Unavailable | Use only validated upstream selected-task cumulative snapshots. The first snapshot is a baseline; monotonic differences form an observed window. The window may include concurrent task work and excludes work before its first snapshot. |
| Realtime input/output audio seconds | Unavailable | Do not infer from transcript events or socket duration. Collect only if direct media evidence becomes available. |
| Billed audio or monetary cost | Unavailable | Do not derive billing from connection duration, character counts, or token totals. |
| Response latency | Unavailable | Time the end of each utterance to first audible answer with the procedure below. |
| Routing necessity/accuracy | Unavailable | Label each sampled request manually after the session; synthetic benchmark labels are not runtime evidence. |
| iPhone and CarPlay voice quality | Unavailable | Record a human review per surface/language after physical playback. |

Cloud connection duration, when Phase 0 records it, is only an observed
Realtime-open exposure proxy. It is neither transmitted audio duration nor a
billing unit.

## Physical collection procedure

Perform this only with the owner's existing paired iPhone, exact selected task,
and unchanged task permissions, sandbox, approvals, host binding, and signing
configuration. Do not inject diagnostic requests into the working task. Do not
record transcripts, identifiers, paths, credentials, pairing data, or audio.

1. Record a safe run label, date, app build, iOS version, desktop build, surface
   (`iPhone` or `parked CarPlay`), language, and whether Phase 0 instrumentation
   is present. Keep real identifiers in private owner notes only.
2. Start a fresh Voice session through the normal connection. Note whether the
   session reaches audible two-way Voice. Capture only the numeric aggregate
   diagnostics after the session; identify their scope as transport lifetime.
3. Run representative synthetic-style requests in both pt-PT and English:
   a short conversation, a project-aware question, a project follow-up, and an
   explicit topic change. Add one current-information request only when the
   available path can actually obtain current information. Label the perceived
   minimum needed tier after the session, but do not treat the label as a router
   result.
4. For one owner-authorized disposable workspace only, perform a small
   reversible mutation. Keep the selected working task and its permissions
   unchanged. Do not repeat an action with an unknown outcome.
5. For every request, manually increment the true-user-utterance tally and use
   a stopwatch from the end of the spoken utterance to the first audible answer.
   Record the elapsed milliseconds, or mark the row unavailable if either
   boundary was unclear. Do not reuse transport age as latency.
6. On each surface, exercise Stop, a second conversation, Settings open/close,
   foreground return, explicit Reconnect, mute/unmute, and an interruption or
   barge-in. Record each as pass, fail, or unavailable with a short non-sensitive
   reason code. Reconcile an uncertain start/stop/mutation instead of replaying
   it.
7. Repeat sessions in each surface/language combination. Report the number of
   valid latency samples and the median. For this initial collection, report
   nearest-rank p95 only with at least 20 valid samples in the reported group;
   otherwise report `insufficient sample`. This minimum is a reporting rule,
   not proof of statistical stability. Keep individual times in private
   collection notes and publish only aggregates.
8. Repeat the representative path on parked CarPlay. A phone-only result does
   not complete the CarPlay portion of the gate.

## Safe aggregate report template

Use numeric values or `unavailable`; do not replace unknown data with `0`.

```text
Run label: <non-identifying label>
Surface: iPhone | parked CarPlay
Language: pt-PT | English | mixed
Current-build physical session: yes | no
Audible two-way Voice: pass | fail | unavailable

True user utterances (manual): <n | unavailable>
Observed backing turns: raw=<n | unavailable>, unique=<n | unavailable>
Measurement scope: <transport lifetime | unavailable>
Evidence capped/saturated: yes | no | unavailable

Token evidence: unavailable | baseline-only | observed-window | discontinuous | capped
Observed token window: <n | unavailable>
Token provenance: validated selected-task upstream snapshot | unavailable
Concurrent selected-task work excluded: no; caveat recorded

Realtime-open exposure proxy: <milliseconds | unavailable>
Closure: clean | interrupted | unavailable
Actual sent/received audio seconds: unavailable
Billable audio/cost: unavailable

Latency samples: <n>
Latency median: <milliseconds | insufficient sample | unavailable>
Latency p95: <milliseconds | insufficient sample | unavailable>
Manual route-need labels: local=<n>, apple=<n>, live=<n>, codex=<n>, unavailable=<n>

Lifecycle checks: stop=<pass/fail/unavailable>; reconnect=<...>; settings=<...>;
foreground=<...>; mute=<...>; interruption=<...>
Voice review: intelligibility=<rating/unavailable>; PT-PT=<rating/unavailable>;
English=<rating/unavailable>; KITT fit=<rating/unavailable>
Limitations: <aggregate-only, non-sensitive statement>
```

## Phase 0 exit gate

Keep the gate pending until all of the following exist:

- representative current-build iPhone and parked-CarPlay measurements;
- pt-PT and English conversational, project, and contextual-follow-up samples;
- aggregate manual utterance and latency observations with stated sample counts;
- observed backing-turn and cloud-exposure provenance, including limitations;
- lifecycle/fallback outcomes for Stop, Reconnect, Settings, foreground,
  mute, and interruption; and
- explicit confirmation that unknown token/audio/cost measures remain
  unavailable rather than estimated.

The pending gate blocks claims of savings and any default routing change. It
does not block the isolated implementation and test work that prepares the
measurement contract.

## First physical observations and build 31 follow-up

The owner confirmed authentication recovery with build 30. Two iPhone sessions
recorded approximately 67.4 and 77.0 seconds of realtime-open exposure, each
with one unique observed source turn and one realtime-start attempt. Both
closed as interrupted; no native realtime-stop attempt was observed. These are
partial diagnostic samples, not completed benchmark runs or billed audio.

Inspection found WebView idle shutdown closed media before native signalling,
and the native bridge could acknowledge Stop without owning an actual stop.
The idle timer also failed to recheck activity. Build 31 repairs these paths,
keeps unknown outcomes non-retryable, records fixed diagnostic markers and uses
the owner's requested 30-second idle timeout. It passed 99 Swift tests and
focused web tests, was installed in place and launched on the iPhone 15 Plus.
Physical idle/active-work/Stop retesting remains pending; these defects are a
plausible explanation, not proof of every observed audio interruption.
