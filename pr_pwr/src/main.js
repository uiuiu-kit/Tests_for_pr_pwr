// main.js
import {PyodideClient, SharedArrayBuffer} from "pyodide-worker-runner";
import {makeChannel} from "sync-message";

// get the code to execute
const response = await fetch("./src/script.py");
const code = await response.text();

console.log('Cross-Origin Isolated:', crossOriginIsolated);

// get InterruptBuffer
const InterruptBuffer = new SharedArrayBuffer(1024);


// Setup the channel to communicat between the main thread and the worker thread
const channel = makeChannel();

// Setup The PyodideClient with my own worker
const pyClient = new PyodideClient(() => new Worker(new URL('./pyodide-worker.js', import.meta.url), { type: 'module' }), channel);

const resultPromise = pyClient.call(pyClient.workerProxy.runCode, InterruptBuffer, code)

await pyClient.writeMessage(message)

await pyClient.interrupt();

// Get the final result:
let result;
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

