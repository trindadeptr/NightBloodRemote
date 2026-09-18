import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const source = await readFile(new URL("../src/directRealtime.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
});
const { DirectRealtimeVoice } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);
const voice = Object.create(DirectRealtimeVoice.prototype);
voice.inputTranscriptParts = [];
assert.equal(voice.mergeTranscriptPart("A Luísa também está aqui"), "A Luísa também está aqui");
assert.equal(voice.mergeTranscriptPart("está aqui com o João."), "A Luísa também está aqui com o João.");
voice.inputTranscriptParts = [];
assert.equal(voice.mergeTranscriptPart("café e coração"), "café e coração");
assert.equal(voice.mergeTranscriptPart("corac\u0327a\u0303o e maçã"), "café e coração e maçã");
assert.equal(DirectRealtimeVoice.sameTranscript("café", "cafe\u0301"), true);
voice.inputTranscriptParts = [];
assert.equal(voice.mergeTranscriptPart("Hello 123 世界"), "Hello 123 世界");
console.log("PASS: accented transcripts, overlapping chunks, Unicode normalization and other languages");
