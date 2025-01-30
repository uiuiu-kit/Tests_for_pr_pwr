// main.ts
import {PyodideClient} from "pyodide-worker-runner";
import {makeChannel} from "sync-message";
import * as Comlink from "comlink";

// get the code to execute
const response = await fetch("./src/pyodide_runner_example.py");
const code = await response.text();

console.log('Cross-Origin Isolated:', crossOriginIsolated);

// get InterruptBuffer
const InterruptBuffer = new SharedArrayBuffer(1024);


// Setup the channel to communicat between the main thread and the worker thread
const channel = makeChannel();

// Setup The PyodideClient with my own worker
const pyClient = new PyodideClient(() => new Worker(new URL('./pyodide-worker.ts', import.meta.url), { type: 'module' }), channel);

const resultPromise = // pass code to webworker and run it
await pyClient.call(
  pyClient.workerProxy.runCode,
  code,
  Comlink.proxy(updateOutput),
  Comlink.proxy(handleInput),
  Comlink.proxy(handleMain),
);

function updateOutput(text: string) {
  console.log(text);
}

function handleInput(question: string) {
  prompt(question)
}

function handleMain() {
  console.log('Main thread running');
}

const interruptedDefault = "interruptedDefault"

// Get the final result:
let result: String;
try {
  result = await resultPromise;
} catch (e) {
  if (e.type === "InterruptError") {
    // The worker was terminated by client.interrupt()
    result = interruptedDefault;
  } else {
    throw e;
  }
}

console.log(result)
