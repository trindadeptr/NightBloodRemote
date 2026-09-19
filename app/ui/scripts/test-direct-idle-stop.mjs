import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const source = await readFile(new URL("../src/directIdleStop.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
});
const { DirectIdleStopTimer } = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
);

class FakeScheduler {
  next = 1;
  callbacks = new Map();
  delays = new Map();

  setTimeout(callback, delay) {
    const handle = this.next++;
    this.callbacks.set(handle, callback);
    this.delays.set(handle, delay);
    return handle;
  }

  clearTimeout(handle) {
    this.callbacks.delete(handle);
    this.delays.delete(handle);
  }

  fireAll() {
    const callbacks = [...this.callbacks.values()];
    this.callbacks.clear();
    this.delays.clear();
    callbacks.forEach((callback) => callback());
  }
}

const idle = () => ({
  sessionEligible: true,
  userSpeaking: false,
  assistantSpeaking: false,
  awaitingAssistant: false,
  backingWork: false,
});

{
  const scheduler = new FakeScheduler();
  const events = [];
  let stopCalls = 0;
  const timer = new DirectIdleStopTimer(
    idle,
    async () => { stopCalls += 1; },
    (event) => events.push(event),
    scheduler,
  );
  timer.arm();
  assert.deepEqual([...scheduler.delays.values()], [30_000]);
  scheduler.fireAll();
  await Promise.resolve();
  assert.equal(stopCalls, 1);
  assert.deepEqual(events.map(({ kind }) => kind), [
    "idle-stop-started",
    "idle-stop-completed",
  ]);
  assert.equal(events[0].detail.idleSeconds, 30);
}

{
  const scheduler = new FakeScheduler();
  let stopCalls = 0;
  const timer = new DirectIdleStopTimer(
    idle,
    async () => { stopCalls += 1; },
    () => {},
    scheduler,
  );
  timer.arm();
  const staleCallback = [...scheduler.callbacks.values()][0];
  timer.reset();
  timer.arm();
  assert.equal(scheduler.callbacks.size, 1);
  staleCallback();
  assert.equal(stopCalls, 0);
  assert.equal(scheduler.callbacks.size, 1);
  scheduler.fireAll();
  await Promise.resolve();
  assert.equal(stopCalls, 1);
}

for (const change of [
  { backingWork: true },
  { userSpeaking: true },
  { assistantSpeaking: true },
  { awaitingAssistant: true },
  { sessionEligible: false },
]) {
  const scheduler = new FakeScheduler();
  let activity = idle();
  let stopCalls = 0;
  const timer = new DirectIdleStopTimer(
    () => activity,
    async () => { stopCalls += 1; },
    () => {},
    scheduler,
  );
  timer.arm();
  activity = { ...activity, ...change };
  scheduler.fireAll();
  await Promise.resolve();
  assert.equal(stopCalls, 0);
}

{
  const scheduler = new FakeScheduler();
  let stopCalls = 0;
  const timer = new DirectIdleStopTimer(
    idle,
    async () => { stopCalls += 1; },
    () => {},
    scheduler,
  );
  timer.arm();
  timer.clear();
  scheduler.fireAll();
  assert.equal(stopCalls, 0);
}

console.log("PASS: idle duration, expiry recheck and activity cancellation");
