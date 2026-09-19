## Why

An already paired installation can receive HTTP 401 from the read-only paired-environment lookup while its saved access token still parses as unexpired. Setup currently falls into a generic failure whose only action rereads the same token, leaving no effective recovery path.

## What Changes

- Classify only HTTP 401 from confirmed-pairing environment lookup during setup reconciliation as sign-in recovery required.
- Offer an explicit token refresh and browser sign-in fallback, with actionable same-account guidance. Failed refresh retains those recovery actions.
- Reuse existing OAuth and reconciliation after explicit authentication; preserve durable enrolment, pairing and selected task, and existing account/host checks.
- Add regression tests for 401 recovery, failures/cancellation, unrelated errors, and preserved binding/unknown outcomes.

Non-goals: automatic OAuth refresh, automatic request replay, endpoint/schema changes, credential-store changes, re-enrolment, re-pairing, permission changes or routing/audio changes.

## Capabilities

### New Capabilities

- `paired-environment-auth-recovery`: Explicit recovery from authentication rejection while restoring an already confirmed pairing.

### Modified Capabilities

None; the main OpenSpec capability inventory is empty.

## Impact

Changes are limited to native setup reconciliation/actions, its Settings controls, relevant lifecycle tests and recovery documentation. Existing OAuth network/storage behavior and mutation state machines remain unchanged. The independent Phase 0 baseline change and its physical acceptance gate remain intact.
