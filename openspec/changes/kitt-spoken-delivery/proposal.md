> Historical experiment, withdrawn at the owner's request. Build 34 was tested and its voice delivery was not preferred; build 35 restores the exact build 33 source. The proposal and requirements below describe the reverted experiment, not current application behaviour. Do not apply or merge these requirements into the baseline.

# KITT spoken delivery

## Why
The owner requests closer KITT-like delivery and short replies. The current prompt encourages stiff acknowledgements; delegated KITT replies lack character-specific instructions. Produced timbre cannot be verified from text.

## What Changes
- Refine native KITT delivery for fluent, precise speech, short answers and restrained wit.
- Carry character style into delegated replies while retaining execution rules.
- Preserve Ember, routing, identity, permissions and connection behaviour.

## Capabilities
### New Capabilities
- `kitt-spoken-delivery`: consistent character style across live and delegated replies.

## Impact
Bundled native prompt, delegated style selection and focused tests. No voice cloning or guaranteed performer timbre. Requires physical listening after installation.
