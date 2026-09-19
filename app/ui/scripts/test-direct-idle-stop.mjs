import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const source = await readFile(new URL("../src/iosDirect.tsx", import.meta.url), "utf8");
const sourceFile = ts.createSourceFile(
  "iosDirect.tsx", source, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TSX,
);
let executableSource = source;
for (const statement of [...sourceFile.statements].reverse()) {
  if (ts.isImportDeclaration(statement)) {
    executableSource = executableSource.slice(0, statement.getFullStart())
      + executableSource.slice(statement.getEnd());
  }
}
const { outputText } = ts.transpileModule(executableSource, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.None,
    jsx: ts.JsxEmit.React,
  },
});

class FakeClock {
  now = 0;
  nextHandle = 1;
  intervals = new Map();
  timeouts = new Map();

  setInterval(callback, delay) {
    const handle = this.nextHandle++;
    this.intervals.set(handle, { callback, delay });
    return handle;
  }
  clearInterval(handle) { this.intervals.delete(handle); }
  setTimeout(callback, delay) {
    const handle = this.nextHandle++;
    this.timeouts.set(handle, { callback, dueAt: this.now + delay });
    return handle;
  }
  clearTimeout(handle) { this.timeouts.delete(handle); }
  advance(milliseconds) {
    this.now += milliseconds;
    const due = [...this.timeouts.entries()]
      .filter(([, timer]) => timer.dueAt <= this.now);
    for (const [handle, timer] of due) {
      this.timeouts.delete(handle);
      timer.callback();
    }
  }
}

const effects = [];
const React = {
  StrictMode: Symbol("StrictMode"),
  createElement(type, props, ...children) {
    return { type, props: { ...props, children } };
  },
  useEffect(effect) { effects.push(effect); },
  useMemo(factory) { return factory(); },
  useRef(value) { return { current: value }; },
  useState(initial) {
    let value = typeof initial === "function" ? initial() : initial;
    return [value, (next) => {
      value = typeof next === "function" ? next(value) : next;
    }];
  },
};

function renderElement(element) {
  if (!element || typeof element !== "object") return;
  if (typeof element.type === "function") {
    renderElement(element.type(element.props));
    return;
  }
  for (const child of element.props?.children ?? []) renderElement(child);
}
const ReactDOM = { createRoot: () => ({ render: renderElement }) };

class FakeDirectRealtimeVoice {
  static instance;
  running = true;
  stopCalls = 0;
  closeLocalOnlyCalls = 0;
  resumeCalls = 0;

  constructor(callbacks, signalling) {
    this.callbacks = callbacks;
    this.signalling = signalling;
    FakeDirectRealtimeVoice.instance = this;
  }
  async start() {}
  async stop() {
    this.stopCalls += 1;
    await this.signalling.stop();
  }
  async closeLocalOnly() { this.closeLocalOnlyCalls += 1; }
  async resumeAfterBackground() {
    this.resumeCalls += 1;
    return true;
  }
  setInputMuted(muted) { return muted; }
  setOutputMuted(muted) { return muted; }
}

const clock = new FakeClock();
const nativeMessages = [];
const emittedEvents = [];
const window = {
  setInterval: clock.setInterval.bind(clock),
  clearInterval: clock.clearInterval.bind(clock),
  setTimeout: clock.setTimeout.bind(clock),
  clearTimeout: clock.clearTimeout.bind(clock),
  webkit: { messageHandlers: {
    nightbloodDirect: {
      async postMessage(message) {
        nativeMessages.push(message);
        return message.operation === "stop"
          ? { stopped: true }
          : { sdp: "answer", serverStarted: true };
      },
    },
    nightbloodEvents: {
      postMessage(message) { emittedEvents.push(message); },
    },
  } },
};
const performance = { now: () => clock.now };
const document = { getElementById: () => ({}) };

const execute = new Function(
  "React", "ReactDOM", "FaceSurface", "parseFaceSkin",
  "resolveVisualState", "DirectRealtimeVoice", "randomStartupCue",
  "window", "performance", "document",
  `"use strict";
   const { useEffect, useMemo, useRef, useState } = React;
   ${outputText}`,
);
execute(
  React,
  ReactDOM,
  () => null,
  (candidate) => ["nightblood", "marshmallow", "kitt"].includes(candidate)
    ? candidate : null,
  (value) => value,
  FakeDirectRealtimeVoice,
  () => null,
  window,
  performance,
  document,
);

const cleanups = effects.map((effect) => effect()).filter(Boolean);
const realtime = FakeDirectRealtimeVoice.instance;
assert.ok(realtime, "the direct realtime controller must be created");
assert.ok(window.NightBloodDirect, "the native bridge must be installed");
assert.equal(clock.timeouts.size, 0, "mounting must not schedule an inactivity timeout");

const stopCount = () => nativeMessages
  .filter(({ operation }) => operation === "stop").length;
const advanceSilence = (label) => {
  clock.advance(60_001);
  assert.equal(realtime.stopCalls, 0, `${label} must not call realtime Stop`);
  assert.equal(stopCount(), 0, `${label} must not request native Stop`);
};

realtime.callbacks.onState("live");
realtime.callbacks.onEvent("session-ready");
advanceSilence("a silent ready session beyond 60 seconds");
realtime.callbacks.onEvent("speech-started");
advanceSilence("user speech activity");
realtime.callbacks.onEvent("speech-stopped");
advanceSilence("awaiting an assistant response");
realtime.callbacks.onEvent(
  "delegation-started", { marker: "conversation.handoff.requested" },
);
advanceSilence("delegated backing work");
window.NightBloodDirect.setWorking(true);
advanceSilence("active native backing work");
window.NightBloodDirect.setWorking(false);
realtime.callbacks.onEvent("assistant-speaking");
advanceSilence("assistant speech activity");
realtime.callbacks.onEvent("assistant-done");
advanceSilence("silence after assistant completion");

for (const state of ["listening", "thinking", "speaking"]) {
  assert.equal(await window.NightBloodDirect.resumeAfterBackground(state), true);
  advanceSilence(`background resume in ${state}`);
}
assert.equal(realtime.resumeCalls, 3);
assert.equal(
  emittedEvents.some(({ kind }) => typeof kind === "string" && kind.startsWith("idle-stop-")),
  false,
  "activity callbacks must not emit obsolete idle-stop diagnostics",
);

await window.NightBloodDirect.stop();
assert.equal(realtime.stopCalls, 1, "explicit bridge Stop must call realtime exactly once");
assert.equal(stopCount(), 1, "explicit bridge Stop must request native Stop exactly once");
assert.equal(nativeMessages.at(-1).operation, "stop");
assert.ok(emittedEvents.some(({ type }) => type === "ready"));

for (const cleanup of cleanups.reverse()) cleanup();

console.log("PASS: silence/activity/resume never auto-stop; explicit bridge Stop remains wired once");
