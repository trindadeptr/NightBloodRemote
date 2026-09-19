# Verification: voice-terminal-diagnostics

Native security review, 19 September 2026. Final scope is the bounded idle/Stop repair and fixed diagnostic markers; broad terminal-reason classification and unexpected-close UI are deferred.

## Native review result

No unresolved substantive issue found in the reviewed native diff:

- The trusted web bridge calls `beginBridgeStop(from:)` synchronously before creating asynchronous reply work. Source identity is checked against the owning session face before joining or creating an active stop owner. The returned task captures the existing transport, so later execution does not look up a replacement Voice session.
- Accepted work still uses `beginStop` as its single mutation owner. Same-session requests join it; unknown outcomes cannot start another Stop or receive a fabricated success. No-owned active/unknown state throws; a known inactive acknowledgement captures no mutable session lookup.
- Native state/grant invalidation occurs before the accepted task is returned. Credentials, task/host checks, permissions and pairing are unchanged.
- A late web `session/error` acknowledgement returns immediately while native state is `outcomeUnknown`, preserving both the native error and the disabled retry action. It cannot turn an uncertain Stop into a retryable failure.
- New idle diagnostics persist only fixed event names. The server-close observation uses a fixed origin and boolean after exact-task validation and existing terminal state/signals; it does not persist raw reason text or infer root cause.

Four new native regressions cover no-owned active/unknown rejection, an old no-op acknowledgement not changing later state, omission of arbitrary idle error details, and preservation of native uncertainty after a late web error. They do **not** exercise a complete active-transport/wrong-face/concurrent-stop integration; that path was inspected statically. No broad dependency-injection redesign was introduced solely for tests.

The reviewed JavaScript Stop path disables microphone tracks immediately, awaits the captured native Stop before closing the peer, and cleans local media in `finally`. Success alone emits idle; failure emits error and remains rejected. JavaScript timer integration and automated execution evidence remain pending below.

## Pending evidence

- Review and run the JavaScript native-first teardown, failure cleanup, Stop deduplication/Start serialization and idle-activity timer tests when the worker finishes.
- Run focused/new and existing native tests, required web/native build checks and preservation checks; record actual counts and any pre-existing audit exception.
- Record physical idle, active-work and explicit-Stop behavior after authorized installation. Do not claim all silent audio or connection interruptions resolved based on these code repairs.

The change is not fully verified or physically accepted at this snapshot. Broader unexpected-close presentation remains deferred because absence of a native Stop request alone does not prove an unsolicited failure.

## Coordinator evidence addendum

Pending final JavaScript review, automated results and physical installation observations. Existing Phase 0 and authentication evidence remain separate.

## Final automated and installation evidence

Final full iPhone 17 Pro / iOS 26.5 Simulator run: **99 tests, zero failures**
(95 existing plus four native regressions). Both focused JavaScript scripts,
TypeScript and Unicode tests passed. Signed iPhone build and bundled UI build
passed. The final timer uses the owner-requested 30 seconds and rejects queued
callbacks from an earlier timer epoch. Independent bounded security review
found no unresolved substantive defect. Strict OpenSpec/diff validation passes.
Audit source checks passed; existing historical author-email exception remains.

Build 31 (version 1.8.2) signatures, matching app/profile identity and target
phone inclusion were verified for app and extension. It was installed in place
over build 30 on iPhone 15 Plus and independently verified and launched.
Original generated signing project checksum is unchanged. Phone-only signing
remains; no CarPlay entitlement. Pairing/task/permission settings were not edited.

Physical validation of the 30-second idle timeout, active-work continuity and
explicit Stop remains pending. The full active-native-transport/concurrent-stop
integration lacks a deterministic fixture; existing owner logic was inspected,
while JavaScript ordering/concurrency and native unknown-state guards were tested.
Do not claim all reported interruptions fixed or archive this change yet.
