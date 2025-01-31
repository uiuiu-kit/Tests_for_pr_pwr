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

async function updateOutput(outputArr: Array<Object>) {
  for (const part of outputArr) {
    const type = part["type"]
    const text = part["text"]
    if (["stderr", "traceback", "syntax_error"].includes(type)) {
      console.error(text);
    } else {
      console.log(text);
    }
  }
}

async function handleInput(question: string, type: string = "string") {
  const answer = prompt(question)
  taskClient.writeMessage(answer)
}

async function handleMain() {
  let result = NaN;
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

async function abortPyodide() {
  await taskClient.interrupt();
}