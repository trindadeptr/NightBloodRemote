# Verification report: kitt-phase0-baseline

Reviewed 19 September 2026 using the generated `openspec-verify-change` workflow, the proposal, design, both capability specs, implementation checklist and final implementation diff. This review covers Phase 0 instrumentation and offline tooling, not physical acceptance or later optimization phases.

## Summary

| Dimension | Result |
| --- | --- |
| Completeness | 13 of 14 tasks complete. Instrumentation, corpora, tooling, documentation and automated verification are complete. Physical task 5.1 remains incomplete. |
| Correctness | All 9 spec requirements have identifiable implementation or documented evidence handling. No unresolved substantive code defect found in the final reviewed diff. Final Simulator rerun passed 87 tests with zero failures. |
| Coherence | The implementation follows the bounded, native, aggregate-only design. No production router, prompt revision, local speech pipeline, new network service or permission change was introduced. |

## Requirement mapping and scenario coverage

| Requirement | Implementation/evidence | Verification |
| --- | --- | --- |
| Distinguish protocol evidence from executions | `CodexVoiceUsageMeasurement.swift:138`, `:156`, `:263` | Focused Swift tests cover raw versus unique turns, identifier/category/counter limits, valid/invalid transcript parts and privacy. Parts remain explicitly separate from user turns. |
| Validated upstream token accounting | `CodexVoiceUsageMeasurement.swift:179` and transport token observer | Exact selected source-task scope; required supported camelCase fields; nonnegative integer and subset bounds; first snapshot excluded; repeated snapshots give a measured zero window; decreases, inconsistent deltas and capping hide incomplete values. Focused tests cover these conditions, wrong scope and malformed/overflow numeric forms. |
| Privacy and unchanged behavior | Measurement summaries, `CodexRemoteVoiceTransport.swift` diff, `PRIVACY.md` | No transcript/audio persistence or identifier output added. IDs remain bounded native state. Synthetic tests check omitted content/IDs and diagnostic detail limits. Request dispatch, credentials, task/host binding, permission checks and retry policy are unchanged. |
| Cloud exposure and lifecycle uncertainty | `CodexVoiceUsageMeasurement.swift:227`, `:242`, `:263` and terminal transport hooks | Tests cover repeated starts, duplicate terminal flushing, interrupted/clean intervals and invalid/regressing clocks. Time is explicitly an exposure proxy. Terminal persistence follows existing state publication/signals/cleanup rather than introducing an earlier actor suspension. |
| Honest physical baseline status | `docs/KITT_PHASE0_BASELINE.md` | Physical evidence remains pending, true utterances/latency have a manual method, missing tokens/media/billing remain unavailable, and old documented physical acceptance is separated from the current build. |
| Bilingual routing corpus | `benchmarks/kitt/routing_cases.json`, `scripts/kitt_benchmark.py:96` | 80 synthetic cases validate. Fresh-information cases require verified tool capability; arithmetic allows local execution; contextual chains distinguish first-turn state, active work and topic/language changes. Labels remain pending human review. |
| Explicit prediction evaluation | `scripts/kitt_benchmark.py:272` | 13 Python tests pass, including unsafe downgrade, critical action/clarification error, context correctness, over-escalation, missing/duplicate/extra IDs, invalid tier, independent corpus version and CLI exit codes. Metrics disclose numerator/denominator and null empty subsets. |
| No fabricated runtime baseline | `scripts/kitt_benchmark.py:448`, benchmark README | Validation-only output has `evaluation: null` and false runtime/baseline/savings claims. Supplied predictions require provenance; controlled oracle predictions are explicitly evaluator tests. |
| Fixed voice corpus | `benchmarks/kitt/voice_phrases.json`, benchmark README | 40 bilingual phrases validate, including literal digits/units/versions, technical words, summaries, pronunciation and playback scenarios. Synthesis/listening and physical voice quality remain unmeasured. |

## Review corrections verified

- First-turn routing context now describes the state before the request; starting project work no longer claims an already active turn.
- Language-change chains use an actual language change, and fallback/drafting cases supply the referent needed by their expected action.
- Numeric voice phrases now exercise actual percent/decimal/unit/version notation as well as written-out numbers.
- Corpus content version is separate from schema version, and malformed coverage cannot publish a complete score.
- Measurement retains a safe sample correlation label, bounded event/identifier state, split summaries and unavailable-value semantics. Token coverage cannot silently become complete after a capped/discontinuous window.
- Native measurement hooks add no calls to the host and no automatic retry. They do not change the selected task or a mutation's outcome classification.

## Executed evidence

Independently executed during this final review:

```text
python3 -m unittest scripts/test_kitt_benchmark.py -v
  13 tests passed
python3 scripts/kitt_benchmark.py
  80 routing cases and 40 voice phrases valid; no runtime score
openspec validate kitt-phase0-baseline --strict
  passed
git diff --check
  passed
```

The coordinator recorded a pre-change isolated Simulator baseline of 73 tests with zero failures. The final isolated rerun then passed **87 Swift tests with zero failures**, comprising the 73 existing tests and 14 new measurement tests, on iPhone 17 Pro Simulator / iOS 26.5 / Xcode 26.5. Desktop-helper tests passed 11/11, the web build/typecheck passed, all four changed Swift/manifest files matched the tested copy, and the original generated project's SHA remained unchanged. The documented `make simulator-build` also passed for the generic unsigned Simulator destination (arm64 and x86_64). No duplicate Simulator run was launched by this reviewer.

## Outstanding findings

### CRITICAL — physical exit gate remains incomplete

Task 5.1 has no representative current-build iPhone and parked CarPlay measurements. Follow the baseline procedure, collect aggregate backing-turn/exposure and manual utterance/latency/quality/lifecycle evidence on both surfaces and record limitations. Do not mark this task complete, archive the change, claim savings or enable default routing changes using fixture/Simulator success.

### WARNING — pre-existing audit history finding

The public-source audit has a known pre-existing Git author-metadata finding. All nine source-content checks passed according to the coordinator's final evidence; the whole audit must not be described as clean. Preserve repository history and report the exception rather than rewriting unrelated history in Phase 0.

## Final assessment

No unresolved substantive code/security finding in the reviewed Phase 0 implementation. The final test rerun and generic Simulator build passed. The physical Phase 0 gate remains pending. This change is **not archive-ready**.

## Coordinator completion addendum

Generic Simulator build completed successfully. Tasks 1.1–4.3 are checked against the evidence above (13/14 complete). Branch remains `setup/simulator-kitt`, original generated project checksum is unchanged, and no commits, pushes, device installs or voice-task configuration changes were made. Physical task 5.1 remains pending until its real-device evidence exists.

## Subsequent authorized device deployment — 19 September 2026

The owner authorized installation on an iPhone 15 Plus and unlocked it after
the initial device-lock blocker. A private build copy preserved local signing
and produced version 1.8.2, build 29. App and extension signatures passed
verification; both embedded profiles include the target phone. The existing
phone-only signing has no CarPlay entitlement, as explained before deployment.
An in-place upgrade from build 28 succeeded, installed build 29 was separately
verified, and process launch succeeded on iOS 27.0 using Xcode 26.5 tooling.
Original generated signing settings remain unchanged. No account, pairing,
host, task or permission settings were changed. Audible Voice, retained
connection state and physical baseline measurements remain unverified;
task 5.1 is still pending, including separately entitled physical CarPlay tests.
