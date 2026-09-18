# Short voice usage comparison

Use one task, host, model/effort and phone build throughout a sample. Preserve
pairing, signing and the task's effective permissions. Do not import old
transcripts. Other tasks and development work share account quota, so pause
those activities during the timed interval where possible.

1. Record the build, desktop version, model/effort and effective task policy in
   private notes. Read account quota immediately before the sample, including
   bucket ID, used percentage, window length and reset timestamp.
2. With voice stopped, reopen the phone app and complete Face ID. Verify it
   becomes ready without visiting Settings. Record this separately from voice.
3. Start once, speak two ordinary short exchanges, then stop after 30–60 seconds.
   Record UTC start/stop times and whether another task was active.
4. Read quota again after stopping. Compare the same bucket and reset window;
   a changed reset timestamp invalidates a simple percentage subtraction.
5. Inspect the app's local diagnostic trace. `voice.measure` records contain
   timestamps, fixed event names and counts, never speech or account/task IDs.
   The random `sample` label identifies one transport, not an account/session ID.

Interpret the counters separately:

- `rpc.attempted.*`, `rpc.sent.*`, `rpc.accepted.*`: client attempts, successful
  transport writes and successful server responses. A sent request alone does
  not prove execution. `rpc.failedOrUnknown.*` is not proof of non-execution.
- `thread/realtime/start`: voice-session start, not a Codex turn per sentence.
- `source.turn/started` and `created.turn/started`: authoritative App Server
  turn notifications for the selected task and tasks created by this session.
  `observed` counts notifications; `unique` deduplicates turn IDs in memory.
  IDs are never persisted. At 4096 unique IDs, `capped=true` makes the unique
  count a lower bound. Completed notifications have independent counts.
- `voice.measure.marker`: raw WebRTC handoff/delegation markers. Two marker
  types may describe the same delegation; do not add them to execution counts.
- `transcript.delta` and `transcript.done`: native transcript notifications,
  not executions, utterance counts or all WebRTC transcript events.

A confirmed session close writes final transcript, request-attempt and turn
summaries, including zero counts. The lifecycle trace retains only its most
recent 80 events; collect it immediately after a short sample. Missing events,
a crash, a disconnect without a close notification, or a truncated trace make
the sample incomplete. Turn notifications prove observed turns, not billing or
causal attribution to voice: concurrent typed work can use the same task.
A voice delegation can also steer an already-running turn without producing
another `turn/started` notification. Zero new turns does not mean zero Codex
work; compare handoff markers with received delegations and task activity.
Quota percentages are account-wide and coarse; zero change does not prove free
usage. This trace does not expose server-side audio token billing.

Repeat the same utterances and duration for another model/effort only after
recording the first sample. Keep results and real identifiers out of Git.
