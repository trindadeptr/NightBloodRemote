> Historical experiment, withdrawn at the owner's request. Build 34 was tested and its voice delivery was not preferred; build 35 restores the exact build 33 source. The proposal and requirements below describe the reverted experiment, not current application behaviour. Do not apply or merge these requirements into the baseline.

# Verification — build 34

- Bundled KITT prompt: 5,845 UTF-8 bytes, within the existing 8 KiB protocol limit.
- Four DirectCharacterPromptTests passed on iPhone 17 Pro / iOS 26.5 Simulator. Tests verify bundled prompt loading, exact character-specific instructions across Sol and Ember, unchanged execution prefix, wire voice and prompt validation.
- Signed iOS build 34 succeeded. App/extension signatures verified; embedded profiles byte-identical to the previously validated original-phone profiles. Bundled Kitt.txt matches source.
- Strict OpenSpec validation and git diff whitespace checks passed.
- Installed once on iPhone 15 Plus; independent inspection confirmed build 34. A transient before/after preference comparison confirmed selected task, voice and matched face/host/ready-sound preferences unchanged. Temporary preference copies removed. No automatic app launch or Voice restart.
- Original generated signing project remains unchanged. No transport lifecycle, routing, timer, authentication or permission changes.

Physical listening in PT-PT and English, short replies, a repository request and contextual follow-up remain pending. Prompt delivery cannot guarantee the service's produced timbre or suppress service-owned acknowledgements. Ember remains selected. iPhone 18 Pro Max deployment and CarPlay validation remain pending. No commit or push performed for this change.

## Owner-requested rollback

The owner preferred the prior audible delivery after testing build 34 and explicitly requested returning to it. Restored the exact build 33 KITT prompt, delegated reply instructions and associated test to commit 517314f. Ember is unchanged. The inactivity removal and diagnostics remain intact. Build 35 packages this rollback; installation must wait until the active voice call has ended. Physical listening acceptance remains pending.

Build 35 delivery: signed iOS build succeeded in the established disposable verification checkout. An initial build against the original stale generated project failed because it omits CodexVoiceUsageMeasurement; that project was not regenerated or changed. App/extension signatures and identical validated profiles passed. Bundled KITT prompt exactly matches commit 517314f. One in-place install on iPhone 15 Plus succeeded and independent installed-app inspection confirmed build 35. Transient before/after preference comparison preserved selected task, voice and matched settings. No automatic launch, task retarget, signing change, commit or push. Existing build 33 test evidence applies to the restored exact source; no new test run was claimed. Owner listening confirmation remains pending.

The owner resumed an English conversation on build 35 and authorized committing this historical record. The experiment is withdrawn, with no application source diff. No transcript is retained here.
