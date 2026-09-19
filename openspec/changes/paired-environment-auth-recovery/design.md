## Context

See proposal.md. `DirectCodexRemoteSetupModel.reconcilePersistedState` already handles locally expired access tokens as `signInRefreshRequired`, but a locally valid token rejected by the confirmed-pairing environment GET falls into generic failure. Re-reading stores repeats the same GET with the same bearer. `refreshSignIn` exists and uses the existing OAuth refresh service, but its error branch also enters generic failure. Settings exposes only token refresh in the recovery phase, so an expired/revoked refresh grant has no browser fallback there.

OAuth tokens are device-only native state. Enrolment metadata and confirmed pairing have independent durable stores. Existing reconciliation validates the newly parsed account against enrolment metadata, restores only the exact confirmed environment and requires it online. The selected task and its permissions are outside this recovery operation.

## Goals / Non-Goals

**Goals:** Make rejected sign-in actionable without resetting a working installation or replaying an operation. Keep recovery visibly under user control and reuse existing account and pairing validation.

**Non-Goals:** General HTTP interception, automatic token refresh/retry, new OAuth semantics/storage, re-pairing, changing account identity rules, recovering mutation HTTP failures, or altering the active Voice path.

## Decisions

1. Catch `CodexRemoteControllerError.responseRejected(401)` immediately around `environmentClient.list()` in the confirmed pairing branch of reconciliation. Enter sign-in recovery and discard stale in-memory controller/account readiness using existing clearing behavior; do not modify durable tokens, enrolment, pairing or task reference merely because of the GET rejection. All non-401 errors retain their current handling. A generic outer catch would accidentally reinterpret mutation/unknown outcomes and is rejected.
2. Reuse `signInRefreshRequired` with copy that covers both local expiry and server rejection. Provide “Refresh ChatGPT sign-in” and “Sign in again” actions, with same-account guidance. No browser opens automatically and simply opening Settings continues to preserve a healthy prepared connection.
3. Each explicit refresh starts at most one existing OAuth refresh operation. On success, normal reconciliation rebuilds clients from the current stored token and performs its existing read-only lookup. If it still receives 401, recovery remains visible; there is no refresh loop. On refresh failure, retain recovery controls and a safe error message rather than generic reread-only failure. OAuth transport/storage remains unchanged.
4. Browser sign-in fallback is necessary because a saved refresh grant can fail permanently. Reuse the existing Safari/PKCE flow on an explicit tap. After success, reconciliation must apply the existing account match and exact-host rules before readiness. A different account enters existing review-required handling; it must never claim the saved pairing for that identity. Capture whether sign-in/refresh began in recovery; failed/cancelled recovery and unavailable browser presentation restore recovery controls directly without another GET or OAuth attempt. Preserve existing behavior for ordinary first-time sign-in outside recovery.
5. Preserve operation ownership, foreground/cancellation checks and late-result rejection. Do not add authentication work on launch, foreground or Settings appearance. Keep unresolved enrolment/pairing/start/stop outcomes unresolved. No existing mutation is resent by authentication recovery.

## Risks / Trade-offs

- HTTP 401 can have causes beyond token expiry → describe sign-in as rejected, offer recovery, and retain failure if authentication does not resolve it.
- Browser authentication chooses another account → existing metadata/account and exact-host checks block readiness; do not clear pairing to make it work.
- Token refresh failure may be transient or involve a rotated grant → no automatic repeats; browser fallback remains explicitly available.
- Recovery races with backgrounding → reuse existing single-operation and foreground guards, with focused regression tests.

## Migration Plan

No data migration. Change only setup classification, explicit recovery actions and UI copy. Run focused setup/lifecycle tests plus the existing Simulator suite, audit and build checks while preserving signing. Deploy only through the already authorized device workflow and record the actual stage reached: visible recovery, successful authentication, restored exact host/task, then audible Voice if tested. Physical authentication is completed by the owner; no credentials enter diagnostics. The Phase 0 measurement gate remains separate.
