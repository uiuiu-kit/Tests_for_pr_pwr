// main.ts
import {PyodideClient} from "pyodide-worker-runner";
import {makeChannel} from "sync-message";
import * as Comlink from "comlink";


// Setup the channel to communicat between the main thread and the worker thread
let channel = makeChannel();
let pyodideWorker: Worker;
let taskClient: any;

// Setup The PyodideClient with my own worker
pyodideWorker = new Worker(new URL("./pyodide-worker.ts", import.meta.url), {
  type: "module",
});
taskClient = new PyodideClient(() => pyodideWorker, channel);

await taskClient.call(
  taskClient.workerProxy.initPyodideRunner,
);

// get the code to execute
const response = await fetch("./src/pyodide_runner_example.py");
const code = await response.text();

function updateOutput(text: string) {
  console.log(text);
}

function handleInput(question: string) {
  prompt(question)
}

function handleMain() {
  console.log('Main thread running');
}

// pass code to webworker and run it
const resultPromise = 
  await taskClient.call(
    taskClient.workerProxy.runCode,
    code,
    Comlink.proxy(updateOutput),
    Comlink.proxy(handleInput),
    Comlink.proxy(handleMain),
);

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
