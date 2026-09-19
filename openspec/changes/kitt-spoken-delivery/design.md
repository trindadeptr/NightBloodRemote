> Historical experiment, withdrawn at the owner's request. Build 34 was tested and its voice delivery was not preferred; build 35 restores the exact build 33 source. The proposal and requirements below describe the reverted experiment, not current application behaviour. Do not apply or merge these requirements into the baseline.

# Design

Use the existing native prompt and realtimeStartInstructions extension point. Select style by captured character independently of voice. Execution instructions remain the exact prefix, and all protocol fields remain unchanged.

Prefer one or two sentences, fluent phrasing and occasional dry wit. Avoid duplicate voluntary acknowledgements. Service-generated filler and higher-priority instructions are outside this prompt's control. Never infer audible quality from text.

Rollback: revert the prompt and KITT style branch. A new session after installing updated resources is required. No DSP, routing or voice substitution.
