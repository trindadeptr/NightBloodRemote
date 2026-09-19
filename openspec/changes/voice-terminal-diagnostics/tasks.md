## 1. Bound native and web Stop

- [ ] 1.1 Add synchronous source-bound native Stop capture using the existing sole owner; verify wrong-face, captured-session, concurrent Stop, known no-op and unknown-outcome tests.
- [x] 1.2 Await native Stop before JavaScript media teardown in finally; verify deferred signalling, failure cleanup, duplicate Stop, next-Start serialization and no cleanup deadlock.
- [x] 1.3 Cancel idle timers when backing work starts and recheck current activity/session at expiry; verify work/speech after arming suppress Stop and true idle uses the owner-requested 30-second timeout.

## 2. Evidence and delivery

- [x] 2.1 Record fixed idle-stop, native-stop-accepted and terminal-server-observed markers through the existing bounded diagnostics; verify arbitrary error/detail is not persisted and markers add no mutation authority.
- [x] 2.2 Run focused and existing web/native tests, build checks and independent security review; record results and preserve signing, pairing, selected task and permissions.
- [ ] 2.3 Deploy through the authorized workflow and record physical idle/active-work/explicit-Stop behavior; distinguish repaired defects from remaining audio uncertainty and the separate Phase 0 gate.
