# KITT continuation — build 31

## Read first

Read current AGENTS.md, setup/architecture/connections documents and the three
KITT Project references. Inspect branch and status before editing. Synced Project
sources are read-only. Continue Phase 0; do not enable routing optimization yet.

## Repository and delivered state

- Local branch: `setup/simulator-kitt`; upstream:
  `origin/claude/chatgpt-carplay-project-review-vy1rqd`.
- The parent of the build 31 repair commit is `99daecc`. Another owner-authorized task committed/pushed
  authentication recovery (`990ef45`), Phase 0 instrumentation (`a8f823d`) and
  workflow/model strategy (`99daecc`). Those were independently verified.
- The owner authorized committing the idle/Stop repair, tests and this handoff.
  They are included together in the build 31 repair commit. Inspect current
  status/history rather than assuming a clean tree. Push was not requested.
- iPhone 15 Plus, iOS 27.0, connected by USB, Developer Mode enabled. Owner set
  screen not to sleep and authorized builds/installations. Apple Intelligence
  is unnecessary for Phase 0. Build 31, version 1.8.2, installed in place and
  independently verified and launched. Original local signing project intact.
- Existing signing is phone-only, without CarPlay entitlement. Do not silently
  change team, app identity, signing, pairing, host, selected task or permissions.
- Build 30 authentication recovery worked according to the owner.

## Current investigation

Owner reported microphone/processing stopped while Listening remained visible,
then app returned to Ready to talk. Two retrieved aggregate traces show ~67/77s
realtime intervals, one source Codex turn each, interrupted closure and no native
Stop request. This does not establish every interruption's cause.

Build 31 repairs concrete defects:

- Web Stop now synchronously captures its exact native source/session owner,
  joins the sole existing stop operation or creates one, and awaits confirmation.
- Microphone transmission is disabled immediately; WebRTC teardown follows
  native Stop, including cleanup on failure. Unknown outcomes remain unknown.
- Late web errors cannot turn an unknown native outcome into a retryable failure.
- Idle timeout is **30 seconds**, explicitly requested by the owner. Current
  activity is checked at expiry; work cancels the timer; old queued callbacks
  cannot affect a newer timer/session.
- Fixed idle/native/server-close markers are recorded without raw reason text.

OpenSpec: `voice-terminal-diagnostics`. Read its proposal/design/spec/tasks and
verification. Broad unexpected-close UI changes were deferred to avoid confusing
normal teardown with remote failure. Existing Phase 0 remains pending.

## Validation and remaining work

99 Swift tests passed on iPhone 17 Pro Simulator / iOS 26.5, plus focused web
idle/Stop tests, Unicode test, typecheck and builds. Bounded independent security
review passed. Audit content checks pass; pre-existing historical author-email
failure remains. Full active native transport/concurrent-stop integration has
no deterministic fixture; do not claim it does.

Next: ask owner to test build 31 before further changes. Test a short PT-PT/English
conversation, a read-only Codex request and follow-up, activity before 30 seconds,
then 35 seconds of silence, then explicit Stop/restart. Capture diagnostics promptly
and distinguish expected idle shutdown from interruptions during speech/work.
Do not call physical voice or CarPlay acceptance complete from Simulator results.
If unstable, investigate that before resuming the representative Phase 0 benchmark.

When asked for usage, report **weekly Codex usage only**, per owner preference.
Never interpret account-wide quota changes as exact voice-session cost.

## Local engineering artifacts

Private ignored `.build/kitt-phase0-preservation/` contains preservation notes,
device-install evidence, safe aggregate traces and build/test logs. Its
`verification-directory.txt` points to the disposable build copy; its generated
project preserves signing and uses private build 31. Do not regenerate the real
checkout's project and lose signing. Build artifact is in
`/tmp/kitt-phase0-signed-derived-data/Build/Products/Debug-iphoneos/NightBlood.app`.
Do not expose private identifiers or credentials from these artifacts.

Phone trace retrieval used a targeted copy of its preferences file into ignored
storage, extracted only the bounded `nightblood.carplay.lifecycle-events.v1`
diagnostics, then removed the temporary preferences copy. No transcript content
was persisted for measurement. The ring retains only 80 events.

Creating a new development task does not retarget the phone. Keep its selected
task unchanged unless the owner explicitly chooses to move voice testing;
preserve exact host binding and effective permissions if they do.
