## 1. Explicit native recovery

- [x] 1.1 Add narrowly scoped confirmed-pairing GET401 classification and clear only in-memory controller readiness; verify a focused test enters recovery with no OAuth request, no pairing write and no mutation replay, while GET403 retains ordinary failure.
- [x] 1.2 Keep explicit refresh/browser recovery actionable on failure, cancellation or unavailable presenter while preserving ordinary sign-in behavior; verify one refresh per action, no cancellation relookup/retry, successful same-account reconciliation and account-mismatch refusal.
- [ ] 1.3 Expose refresh and browser fallback with same-account guidance in Settings; verify the recovery controls are visible and healthy Settings inspection still does not trigger reconciliation.

## 2. Regression and delivery evidence

- [x] 2.1 Extend lifecycle fixtures/tests for confirmed host preservation, selected-task retention, unknown pairing outcomes and foreground/cancellation behavior; verify focused and existing Simulator tests pass.
- [x] 2.2 Document recovery steps and limits; run required build/audit checks with preserved signing and independent security review; verify no OAuth backend/storage, permission, routing or audio changes and report pre-existing audit exceptions truthfully.
- [ ] 2.3 Validate the recovery build on the already authorized physical installation without resetting enrolment/pairing; record the actual stage reached and leave owner-completed browser authentication or audible Voice checks pending if unavailable.
