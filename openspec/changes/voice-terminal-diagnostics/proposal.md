## Why

Inspection of physical Voice interruptions found a concrete idle-stop defect: JavaScript closes media before signalling Stop, while the native bridge does nothing without an existing native stop owner. The idle timer can also expire after work becomes active, leaving native Voice state inconsistent with local media.

## What Changes

- Route web Stop through the existing sole native stop owner, bound synchronously to its owning face/session, before local media teardown.
- Recheck activity at idle expiry and cancel timers when backing work starts.
- Record only fixed existing idle-stop event markers in the bounded native diagnostics.
- Add concurrency/ordering regressions and validate on the authorized physical installation without claiming all audio interruptions are fixed.

## Capabilities

### New Capabilities

- `voice-terminal-diagnostics`: Correct, bounded native ownership and diagnostic markers for idle Voice stopping.

### Modified Capabilities

None; the main spec inventory is empty. Existing Phase 0 and authentication changes remain separate.

## Impact

Native session/bridge stop entry, JavaScript stop order and idle timer, focused tests and delivery notes. No general reason taxonomy, unexpected-close UI change, routing, prompts, authentication, permissions, pairing or automatic restart.
