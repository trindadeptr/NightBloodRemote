## Purpose

Allow an already paired installation to recover explicitly from rejected ordinary sign-in while preserving its identity, host binding and unknown-operation safeguards.

## ADDED Requirements

### Requirement: Confirmed environment authentication rejection is actionable

When restoring an existing confirmed pairing, HTTP 401 from the read-only environment listing SHALL expose explicit sign-in recovery rather than only a saved-state reread. The system SHALL withhold controller readiness, preserve durable enrolment/pairing/task state and leave unrelated errors on their existing paths.

#### Scenario: Unexpired saved bearer is rejected
- **WHEN** a saved token passes local expiry checks but confirmed-pairing environment lookup returns HTTP 401
- **THEN** setup offers explicit refresh and browser sign-in actions without automatically invoking either or altering durable pairing

#### Scenario: Environment lookup fails for another reason
- **WHEN** the lookup returns HTTP 403, a transport failure or malformed data
- **THEN** the existing error handling remains in effect and the failure is not reclassified as token expiry

### Requirement: Authentication recovery is explicit and bounded

Refresh SHALL perform one OAuth refresh attempt per accepted user action and then use normal reconciliation. Failure or another 401 SHALL leave actionable recovery visible with a safe error. Browser sign-in SHALL be available as an explicit fallback. Cancellation or backgrounding MUST NOT produce automatic authentication retries or stale readiness.

#### Scenario: Refresh fails or does not repair authentication
- **WHEN** explicit refresh fails, or succeeds but the subsequent read-only lookup returns 401
- **THEN** recovery remains available and no second automatic refresh is sent

#### Scenario: Browser recovery is cancelled
- **WHEN** the owner cancels browser sign-in or the application backgrounds
- **THEN** no pairing, enrolment or Voice mutation is started and readiness is not granted from a cancelled result

### Requirement: Recovery preserves binding and mutation uncertainty

Recovered credentials SHALL pass existing account/enrolment validation and exact confirmed-host selection before readiness. Recovery MUST NOT reset pairing, change the selected task or permissions, or resend an enrolment, pairing, start, stop or other mutation whose outcome is unknown.

#### Scenario: Same-account recovery succeeds
- **WHEN** explicit authentication succeeds for the enrolled account and the exact confirmed host is available
- **THEN** reconciliation restores that binding without requiring a new code claim or changing the selected task

#### Scenario: Browser selects another account
- **WHEN** recovered credentials fail the existing enrolment-account check
- **THEN** setup retains review-required handling and does not grant readiness or rebind the saved pairing

#### Scenario: Stored setup has an uncertain mutation
- **WHEN** authentication recovery encounters an existing unknown enrolment or pairing outcome
- **THEN** the outcome remains unresolved and no mutation is automatically replayed
