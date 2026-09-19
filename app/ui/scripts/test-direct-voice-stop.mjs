import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

async function loadTypeScript(relativePath) {
  const source = await readFile(new URL(relativePath, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
  });
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);
}

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

const { DirectRealtimeVoice } = await loadTypeScript("../src/directRealtime.ts");

{
  const nativeStop = deferred();
  const order = [];
  let stopCalls = 0;
  const microphone = { enabled: true };
  const voice = Object.create(DirectRealtimeVoice.prototype);
  Object.assign(voice, {
    generation: 0,
    stopPromise: null,
    stream: { getAudioTracks: () => [microphone] },
    signalling: {
      stop: async () => {
        stopCalls += 1;
        assert.equal(microphone.enabled, false);
        order.push("native-stop-started");
        await nativeStop.promise;
        order.push("native-stop-confirmed");
      },
    },
    cb: { onState: (state) => order.push(`state-${state}`) },
  });
  voice.closeLocal = async () => order.push("local-closed");

  const first = voice.stop();
  const duplicate = voice.stop();
  await Promise.resolve();
  assert.equal(stopCalls, 1);
  assert.deepEqual(order, ["native-stop-started"]);
  nativeStop.resolve();
  await Promise.all([first, duplicate]);
  assert.deepEqual(order, [
    "native-stop-started",
    "native-stop-confirmed",
    "local-closed",
    "state-idle",
  ]);
}

{
  const nativeStop = deferred();
  const order = [];
  let stopCalls = 0;
  const voice = Object.create(DirectRealtimeVoice.prototype);
  Object.assign(voice, {
    generation: 0,
    stopPromise: null,
    signalling: {
      stop: async () => {
        stopCalls += 1;
        order.push("native-stop-started");
        await nativeStop.promise;
      },
    },
    cb: { onState: (state) => order.push(`state-${state}`) },
  });
  voice.closeLocal = async () => order.push("local-closed");

  const first = voice.stop();
  const duplicate = voice.stop();
  nativeStop.reject(new Error("outcome unknown"));
  const results = await Promise.allSettled([first, duplicate]);
  assert.equal(stopCalls, 1);
  assert.deepEqual(results.map(({ status }) => status), ["rejected", "rejected"]);
  assert.deepEqual(order, ["native-stop-started", "local-closed", "state-error"]);
}

{
  const nativeStop = deferred();
  const order = [];
  const voice = Object.create(DirectRealtimeVoice.prototype);
  Object.assign(voice, {
    generation: 0,
    stopPromise: null,
    peer: {},
    stream: null,
    signalling: { stop: () => nativeStop.promise },
    cb: { onState: (state) => order.push(`state-${state}`) },
    options: {},
    inputMuted: false,
    outputMuted: false,
    uplinkBaselinePending: false,
  });
  voice.closeLocal = async () => {
    order.push("local-closed");
    voice.peer = null;
  };
  voice.connect = async () => order.push("new-start-connected");

  const stopping = voice.stop();
  const starting = voice.start();
  await Promise.resolve();
  assert.deepEqual(order, []);
  nativeStop.resolve();
  await stopping;
  await starting;
  assert.deepEqual(order, [
    "local-closed",
    "state-idle",
    "state-starting",
    "new-start-connected",
  ]);
}

console.log("PASS: native-first Stop ordering, failure cleanup, deduplication and start waiting");
