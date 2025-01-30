// pyodide-worker.ts
import {
  pyodideExpose,
  makeRunnerCallback,
  loadPyodideAndPackage,
  PyodideFatalErrorReloader,
  // @ts-ignore
} from "pyodide-worker-runner";

import * as Comlink from "comlink";

const reloader = new PyodideFatalErrorReloader(() => loadPyodideAndPackage({
  url: "/package.tar.gz", 
  format: "gztar",
}));

const runCode = pyodideExpose(async function runCode(
  extras: any,
  code: string,
  updateOutput: (text: Array<Object>) => void,
  handleInput: (prompt: string, type?: string) => Promise<void>,
  handleMain: (type: string, data : any) => void,
) {
  const callback = makeRunnerCallback(extras, {
    output: (outputText: Array<Object>) => updateOutput(outputText),
    input(prompt: string) {
      handleInput(prompt);
    },
    other: (type: string, data: unknown) => {
      handleMain(type, data);
      return extras.readMessage();
    },
  });

  return await reloader.withPyodide(async (pyodide) => {
    const runner = pyodide.pyimport("runner");
    runner.set_callback(callback);

    //load packages if needed
    await pyodide.loadPackagesFromImports(code);

    if (extras.interruptBuffer) {
      pyodide?.setInterruptBuffer(extras.interruptBuffer);
    }
    await runner.run_async(code);
  });
});

const initPyodideRunner = pyodideExpose(async function initPyodideRunner(){}) // default Implementierung wahrscheinlich schrott

Comlink.expose({
  runCode,
  initPyodideRunner
});