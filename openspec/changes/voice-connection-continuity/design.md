## Context

The failing physical sample had six accepted desktop heartbeat writes, with the last at 06:44:59 UTC. Closure was at 06:45:24, before the next expected 30-second heartbeat. This timing does not establish a heartbeat failure. A pending long-lived command/exec failure can be cleanup fallout. The 80-event ring was full; no absent event is conclusive proof of non-occurrence.

Transport loss after a successful start can be represented internally as startOutcomeUnknown. The screenshot therefore cannot establish a startup failure. The reader loop handles both receive and protocol-processing errors, while existing code replaces those errors with an unknown-outcome description. Preserve the conservative behavior and add evidence first.

## Decisions

1. The owner has now explicitly requested removal after the build 32 retest. Delete the inactivity timer and all arming/reset wiring, plus obsolete native idle marker handling. Do not replace it with a longer timeout or a disabled timer. Preserve speech/activity rendering, manual Stop ordering, Start serialization, native startup watchdog, 30-minute session guard, heartbeat and foreground rules.
2. Emit only fixed local failure source/category and bounded booleans at existing failure boundaries. Never persist associated error messages, identifiers, URLs, payloads or transcript text. Capture evidence before cleanup erases it; do not create a new operation owner or change retry eligibility.
3. For an already observed server start, use truthful interruption/unknown remote closure wording while retaining the same conservative state and no-retry behavior. Pending Start and Stop retain their existing wording and priority. Keep source/build verification separate from physical acceptance. An owner request to remove inactivity shutdown is not proof it caused the interruption.
4. Do not modify the original generated signing project. Build in the existing disposable verification copy. The owner subsequently selected the new iPhone 18 Pro Max for all future installations; verify its profile inclusion and app identity first, preserve the iPhone 15 Plus installation, and leave new-device enrolment/pairing to the owner.

## Risks / Trade-offs

After removal, silence leaves the session open until manual Stop or an existing native/remote termination and may increase cloud exposure. Exposure is not billable audio. Existing transport failures can still interrupt the session. Diagnostics must remain non-authoritative and must not delay state transitions or enable replay.

## Validation

Use a behavioral fake-clock integration test to exercise silent active sessions beyond 30/60 seconds, activity transitions and explicit Stop. Re-run native-first Stop regressions; only inactivity shutdown is removed. Run existing Stop/Unicode tests, web typecheck/build, relevant Swift tests and Simulator build. Validate the new fixed diagnostic classification against arbitrary associated error strings and ensure unknown-state protections stay intact. Verify signatures and installation independently; ask the owner to repeat continuity, silence, Stop/restart on the physical iPhone. CarPlay remains pending.


## Owner retest and removal decision

Build 32 recorded an idle Stop at 07:15:29 UTC, native owner acceptance,
server close with nativeStopAttempted=true, idle-stop-completed and return to
Ready. This establishes the shutdown path, not an independently measured
30 seconds since the last audible answer. The owner subsequently reported
another shutdown after approximately 20 seconds and did not accept the test.
Do not override that observation with a claim of physical success. The owner
explicitly requested deleting the inactivity feature. Retain the new transport
diagnostics because the separate build31 failure trigger remains unproven.
