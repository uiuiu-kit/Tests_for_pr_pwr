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
const response = await fetch("./src/script.py");
const code = await response.text();

async function updateOutput(text: string) {
  console.log(text);
}

async function handleInput(question: string) {
  const answer = prompt(question)
  return answer
}

async function handleMain() {
  let result = null;
  console.log('Main thread running');
  taskClient.writeMessage(result);
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
