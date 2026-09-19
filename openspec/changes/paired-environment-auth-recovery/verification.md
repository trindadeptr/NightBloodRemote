# Verification: paired-environment-auth-recovery

Security/design review on 19 September 2026 against the proposal, design and three capability requirements. This report covers the native setup and Settings diff; final automated and physical evidence is pending below.

| Dimension | Review result |
| --- | --- |
| Completeness | Recovery implementation and controls are present. All six checklist tasks remain unverified at this snapshot while tests and delivery are in progress. |
| Correctness | The narrow GET401 classification and explicit recovery paths match the spec. One cancellation issue was found and corrected; final tests remain pending. |
| Coherence | Existing native OAuth/storage, account validation, host binding and mutation behavior remain unchanged. No broad HTTP retry layer was introduced. |

## Reviewed behavior

- `DirectCodexRemoteSetupModel.swift` catches only `CodexRemoteControllerError.responseRejected(statusCode: 401)` immediately around the confirmed-pairing environment listing. Other errors rethrow through their existing handling. No mutation error is reclassified or resent.
- Recovery clears only in-memory controller context. Durable credentials, enrolment, pairing and selected-task storage remain untouched by the classification helper; readiness must be rebuilt through existing reconciliation.
- Explicit refresh and browser sign-in each reuse the existing single-operation flow. Authentication success still passes the enrolment-account check and restores only the exact confirmed host. A mismatched account cannot become ready through this change.
- Failure, unavailable browser presentation and browser cancellation preserve recovery controls when recovery was the operation's origin. Foreground/result guards remain in place; no automatic OAuth request or cancellation-triggered environment lookup was added.
- `DirectSettingsView.swift` exposes both recovery actions with same-account guidance. Settings appearance still does not reconcile healthy setup merely to display it.

## Finding resolved before delivery

The first draft handled Safari cancellation but not explicit setup **Cancel**: cancelling the operation made the catch branch fail its result guard, then completion left `.checking` with no operation. The final draft passes a recovery-origin flag to `startOperation`. After the owned operation completes, it restores recovery only when phase is still `.cancelling` and the app remains active; background `.inactive` behavior and ordinary non-recovery flows are preserved. This restoration sends no network request and cannot grant readiness. A focused suspended-operation cancellation regression is required in the pending tests.

## Outstanding verification

- **CRITICAL before completion:** run focused authentication/lifecycle regressions and the existing Simulator suite, including explicit Cancel versus Safari cancellation, background/late result handling, 401 versus 403, single refresh, same-account success, mismatch, unknown pairing state and retained task/host binding.
- **CRITICAL before completion:** record required build/audit/signing-preservation checks and the actual installed physical recovery stage. Simulator success cannot prove restored authentication or audible Voice. The owner completes browser authentication if needed.
- **WARNING:** retain the known pre-existing audit Git author-metadata exception if it still occurs; do not describe the whole audit as clean or rewrite unrelated history.

No unresolved substantive defect was found in the final reviewed production diff. The implementation is ready for the pending validation; this report does not claim successful tests, installation, authentication or physical Voice.

## Coordinator evidence addendum

Pending automated results, checkbox reconciliation and physical installation/recovery observations. Keep any owner-dependent authentication or Voice result explicitly pending rather than inferring it from deployment.

## Coordinator validation and deployment evidence

The final implementation passed the full iPhone 17 Pro / iOS 26.5 Simulator
suite: **95 tests, zero failures**, including eight added authentication
recovery tests. Tests cover explicit refresh, repeated rejection, account
mismatch, preserved confirmed/unknown pairing, unavailable browser presentation,
and explicit/background cancellation. The generic Simulator build passed before
the final cancellation adjustment; the final adjusted source passed the full
Simulator test build and signed physical-device build. Bundled web compilation
passed as part of both builds. Strict OpenSpec validation and diff checks pass.
The audit again passed all nine content checks and failed only on the recorded
pre-existing Git author-metadata exception. No history was rewritten.

Independent security review accepted the cancellation fix with no remaining
substantive production finding. Version 1.8.2, private build 30, was signed with
the existing phone-only identity. App and extension signatures and inclusion of
the target phone in both profiles were verified. Original generated signing
project checksum remains unchanged. An in-place upgrade from build 29 succeeded
on the iPhone 15 Plus; a separate installed-app query confirmed build 30 and
process launch succeeded. No uninstall, pairing reset, account change, host/task
change or permission change was performed.

Owner verification of visible recovery controls, renewed authentication,
retained task/host and audible Voice remains pending. Browser success/cancel
with real credentials is not proven by Simulator or unavailable-presenter tests.
Physical CarPlay remains pending and this phone-only build has no CarPlay
entitlement. Keep physical validation task 2.3 open; do not claim the underlying
service rejection is resolved merely because the recovery build is installed.
