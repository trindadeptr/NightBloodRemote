# Verification — diagnostic continuation

## Observed defect and scope

Build 31's physical interruption is established by owner report, screenshot
and safe aggregate trace. Its original trigger is not recoverable from the
existing ring: reader/heartbeat cleanup replaced the triggering error with
Start-outcome-unknown. A started session could therefore get misleading Start
wording. The new message corrects that description, while retaining the same
unknown state, retry prohibition and Stop priority.

The diagnosis-first build keeps the original 30-second inactivity timer. The
owner's fallback removal patch is private and excluded. No runtime routing,
voice preference, prompt, credentials, host/task selection, permissions or
protocol validation changed.

## Independent review

Bounded Astra/High review passed after two diagnostic-only corrections:

- A heartbeat waiter failed by existing reader/transport cleanup must not
  claim to be an independent heartbeat failure. Emission now checks whether
  the connection was still open when that failure boundary was reached.
- A local close can observe confirmed remote closure during an await. Its
  diagnostic is therefore captured only in the late branch that actually
  selects an unknown outcome, rather than before cleanup.

Only fixed origin/category and booleans are persisted; associated strings
are ignored. New diagnostic awaits follow existing terminal state/cleanup.
No new mutation owner, automatic retry or weaker validation was introduced.

## Automated evidence

The existing disposable build copy was updated with the current native/web
sources without regenerating the original local signing project.

- iPhone 17 Pro / iOS 26.5 Simulator: **102 tests, zero failures** (99 prior
  tests plus three focused diagnostic/privacy/uncertainty tests).
- Original web idle timer, native-first Stop and Unicode tests: pass.
- TypeScript checking and bundled UI build: pass.
- Public-source content audit: pass; the historical author/committer email
  metadata exception remains unchanged and keeps `make audit` nonzero.
- Strict OpenSpec and whitespace/diff validation: pass at this snapshot.

The new tests verify category/privacy bounds, heartbeat attribution conditions
and unknown-state retry restrictions. They do not inject failures through a
complete live reader/heartbeat/native-transport integration, and do not prove
physical continuity or the original failure's cause.

## Delivery gate

Generic Simulator/device build and new-device signing/installation evidence
are recorded below when complete. The owner selected iPhone 18 Pro Max for
all future installs. Do not install on the old iPhone 15 Plus. Initial device
discovery only listed the old phone; new-device trust, provisioning inclusion,
installation, sign-in/enrolment/pairing and physical retest are pending.

## Build 32 and new-device blocker

Generic Simulator build and signed iOS device build both passed. Version 1.8.2,
build 32 app and extension signatures validate; bundle identities match the
previous signed artifact and signing teams match their embedded profiles.
The original generated project checksum is unchanged. Signing remains
phone-only, with no CarPlay entitlement.

The new iPhone 18 Pro Max is now connected/paired, with Developer Mode enabled
and iOS 27.0. Device services cannot mount the development image: CoreDevice
12040 wraps `kAMDMobileImageMounterPersonalizedBundleMissingVariantError`
(0xe800010f). The installed Xcode is 26.5 (17F42). Its documented
`xcodebuild -runFirstLaunch -checkForNewerComponents` check completed with
`No new updates for 17F42`. No image files or system configuration were patched.

The current app and extension profiles do not include the new device.
Installed-app inspection failed at the image-mount stage; do not infer that
no app is installed from the empty/error response. No installation was
attempted on either phone. Xcode 27 cannot run on this Intel host. Resolve a compatible deployment route, then resolve
new-device registration/profile inclusion with the existing team and identities
before installation. Correction: macOS 26.6.2 meets only the OS requirement. Xcode 27 also requires
Apple silicon; local hardware inspection confirms this Mac is Intel. The earlier
macOS-only recommendation was incomplete. See:
https://developer.apple.com/xcode/system-requirements

Build success does not remove these deployment blockers or establish the
original interruption's cause. Physical validation remains pending.


Apple documents IPA installation on registered devices through Apple Configurator.
Compatibility with this exact Intel/iPhone 18 Pro Max combination remains untested;
Configurator is not installed. The existing build does not yet have profiles
including that phone. No installation, host retargeting or credentials transfer
was attempted while investigating alternatives.


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

## Build 33 — inactivity removal delivered

After the owner rejected the perceived silence timing and explicitly requested
removal, the web idle timer file and all integration hooks were deleted. The
obsolete native idle-marker handler and its test were also removed. The web
regression now mounts the actual FaceApp effect with bounded fake dependencies
and advances a fake clock beyond 60 seconds through ready/speech/delegation/
backing-work/assistant/background-resume scenarios. No automatic Stop occurs;
explicit Stop reaches the existing bridge once. This is a behavioral wiring
fixture, not real WebRTC or physical audio proof.

Verification passed:

- 101 Swift tests, zero failures on iPhone 17 Pro / iOS 26.5 Simulator (102
  minus the obsolete idle-marker test).
- Behavioral no-inactivity-stop test; native-first Stop ordering/concurrency;
  Unicode; TypeScript checking; UI build; generic Simulator and signed iOS builds.
- Independent bounded review: manual Stop, activity presentation, native
  30-minute session guard, heartbeat, startup watchdog and unknown-outcome
  semantics preserved. New transport diagnostics are retained unchanged.
- Source audit checks, strict OpenSpec and diff checks pass. The pre-existing
  historical author/committer email audit failure remains unchanged.

App and extension signatures, original bundle identities and profiles including
the exact iPhone 15 Plus were verified. One in-place installation succeeded;
independent installed-app inspection confirmed version 1.8.2, build 33. A
before/after private preferences comparison confirmed the selected task,
character, voice preferences and ready sound were unchanged. Temporary full
preference copies were removed. The original signing project checksum is
unchanged; no pairing/host/permission/authentication configuration was edited.
The new iPhone remains untouched.

Physical continuity beyond silence and manual Stop/restart remain pending.
Removing the inactivity path does not prove the distinct build31 transport
failure fixed. The owner's fleeting Face ID observation remains unattributed;
source and compile flags confirm the app's development launch gate is disabled,
and this build does not modify authentication.
