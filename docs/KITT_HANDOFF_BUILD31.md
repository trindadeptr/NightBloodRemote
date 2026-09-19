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


## Ember investigation — continuation on 19 September 2026

The owner reports that selected Ember sounds feminine whereas earlier output
sounded masculine. Source inspection establishes the requested voice path only:

- `DirectVoiceSessionModel` reads the KITT-specific preference
  `nightblood.direct.voice.kitt`, falling back to `.ember`, and captures the
  selected voice in the immutable start grant.
- Both iPhone and CarPlay start paths pass that value to
  `codexRemoteRealtimeStartParameters`, which serializes `voice.rawValue`.
- `CodexRemoteVoiceStartResult.voice` is populated from the local
  `requestedVoice`, **not** an effective voice field returned by the service.
- The inspected local experimental schema accepts Ember in the start request.
  Its start response has no fields; started/SDP notifications expose no
  effective-voice confirmation. The existing WebRTC event consumer reads none.

Do not interpret a successful start or the result's `voice` property as proof
of the voice actually synthesized. There is no demonstrated cause for the
perceived timbre change. Keep Ember and the character prompt unchanged.
Listening observations remain necessary, and an authoritative service voice
identity would require evidence the current protocol does not expose. A future
bounded requested-voice diagnostic could establish request provenance but
would still not confirm the produced voice. Do not log raw service events,
audio, or transcripts to investigate this.


A read-only device snapshot at 06:39:58 UTC confirmed the saved character is
KITT and its saved voice enum is `ember`. This confirms the stored preference,
not an effective service voice. The selected task reference differed between
the two device snapshots; the agent did not write phone preferences or send
any task resume/prompt. The owner had requested this continuation task's UUID.
Do not automatically restore or replace the phone selection, and do not treat
measurements spanning different selected tasks as one comparable baseline.
Effective selected-task permissions were not independently inspected.

## Physical retest interruption and current direction

The owner reported initial PT-PT/English conversation working and Ember again
sounding masculine. Step 2 (read-only Codex request plus branch follow-up)
then interrupted. A screenshot shows Start-outcome-unknown despite prior
audible conversation. The safe trace records 201,372 ms exposure and three
completed source turns with interrupted closure. No idle/native Stop or
server-close marker for this session was retained. The current error handling
can relabel established-session transport loss as unknown Start and erase its
underlying error category; this explains the message, not the failure trigger.

Continue with OpenSpec `voice-connection-continuity`. The owner first asked to
remove silence shutdown, then clarified diagnosis first and removal if the
cause remains unresolved. The prepared web removal patch is stored privately
and excluded from the working source/diagnostic build. Preserve the 30-second
behavior for that comparison, explicit Stop, protocol validation and all
unknown-outcome/no-retry rules. Do not treat the previous 250-second clean
sample or the spoken claim of completed replies as passing this failed test.

## Installation target changed by owner

The owner has enabled Developer Mode on a new iPhone 18 Pro Max and directed
all future installations to that device. Preserve the existing iPhone 15 Plus
installation; do not deploy diagnostic builds to it automatically. The first
Mac discovery still listed only the older phone, so the new device's connection,
trust, signing-profile inclusion and app installation remain to be verified.
A new device requires its own native sign-in/enrolment/pairing; never copy
credentials or automatically select a host/task. Preserve the existing app
identity and local signing team unless a specific signing blocker is resolved
with the owner. CarPlay remains a separate capability/profile/physical gate.

## Build 32 diagnostic artifact and pending installation

`voice-connection-continuity` now has an independently reviewed native patch:
fixed receive/frame/heartbeat/local-close origin and error-category diagnostics,
and truthful interruption wording after observed Start. Unknown state and
no-retry semantics remain unchanged. The 30-second timer is unchanged, following
the owner's diagnosis-first clarification. 102 Swift tests, focused web tests,
typecheck, UI build and generic Simulator/device builds passed. Build 32
(version 1.8.2) signatures/identities were checked for app and extension.
See that change's verification document for test limitations and evidence.

The iPhone 18 Pro Max is connected/paired with Developer Mode enabled. Installation
is blocked by Xcode 26.5's missing developer-image hardware variant (CoreDevice
12040 / 0xe800010f). The official newer-components check returned no updates.
Correction: Xcode 27 requires Apple silicon. This iMac is Intel, so its macOS
26.6.2 version alone does not make that toolchain installable. Do not recommend
installing Xcode 27 on this host.
The current profiles also exclude this phone, so registration/profile inclusion
must be resolved using the existing signing team and identities. No install was
attempted on either phone. The original project and iPhone 15 Plus are intact.


The owner identified the Xcode 27 processor restriction, confirmed against
Apple's release notes and local `x86_64`/Intel CPU inspection. The previous
macOS-only compatibility advice was incomplete. Build 32 remains valid build
evidence from Xcode 26.5; deployment to the new phone is still blocked.
Apple documents registered-device IPA installation using Apple Configurator,
but this exact Intel/new-iPhone combination has not been verified. Configurator
and its CLI are not installed here. That route still requires profiles including
the new phone, and must not involve erasing/supervising it or copying credentials.
An Apple-silicon Mac is another possible deployment host; it does not authorize
changing the selected Codex host/task or moving the existing account setup.
References:
- https://developer.apple.com/forums/thread/829619
- https://developer.apple.com/documentation/xcode/distributing-your-app-to-registered-devices


## Owner-authorized interim installation — iPhone 15 Plus

The owner explicitly requested installing build 32 on the old phone while
preparing an Apple-silicon laptop for Xcode 27. This is an interim exception
to the new-phone target preference. The app and extension signatures and
profile inclusion for the exact original phone were checked first. Read-only
inspection confirmed build 31 before installation. One in-place install
completed successfully; independent installed-app inspection then confirmed
version 1.8.2, build 32 with the same bundle identity on iPhone 15 Plus.
The original generated signing project SHA-256 remains unchanged.

No uninstall, pairing reset, host/task selection, permission change or automatic
Voice restart was performed. App launch/audible Voice and physical diagnostic
retest remain owner actions. The 30-second inactivity timer is unchanged in
this diagnostic build. The iPhone 18 Pro Max installation remains pending.

## Latest owner instruction — remove inactivity shutdown

After build 32 retesting, the owner reported another unwanted shutdown after
roughly 20 seconds and explicitly requested deleting the inactivity feature.
The retained trace confirms two idle-Stop paths, but does not measure silence
from the last audible answer. Build 33 work therefore removes the web timer,
all arming/reset hooks and obsolete native idle-marker handling. Manual Stop,
startup watchdog, 30-minute native session guard, heartbeat and unknown-outcome
protections remain. Interim installation target remains the original iPhone
15 Plus until new-phone deployment from an Apple-silicon Mac is ready.

The owner also reports occasional Face ID prompts on entry. Source inspection
confirms `DeviceAccessGate.requiresFaceID` is false under DEBUG, as in build32;
it was not re-enabled by the diagnostic change. The exact prompt/source still
needs identification. Do not modify key protection, enrolment, pairing or
release authentication based solely on that report.

## Current installed state — build 33

Build 33 (1.8.2) is installed and independently verified on the iPhone 15 Plus
under the owner's interim old-phone authorization. Automatic inactivity Stop
has been fully removed, including timer source, wiring and obsolete native
markers. Manual Stop, native safety limits and build32 transport diagnostics
remain. 101 Swift tests and focused behavioral web tests/typecheck/builds passed;
independent removal review found no defect. See `voice-connection-continuity`
verification for detailed evidence and fixture limitations.

Original signing checksum and selected task/character/voice/ready-sound
preferences were verified unchanged after installation. No pairing, host,
permission or authentication changes were made. Next physical check: converse,
wait over 60 seconds in silence, resume speech, then explicit Stop/restart.
Capture new diagnostics immediately if any interruption recurs. No commits or
pushes were performed; new-phone deployment from an Apple-silicon Mac and
CarPlay acceptance remain pending.
