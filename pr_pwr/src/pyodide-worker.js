// pyodide-worker.js
import {pyodideExpose, PyodideFatalErrorReloader, loadPyodideAndPackage} from "pyodide-worker-runner";
import * as Comlink from "comlink";

const reloader = new PyodideFatalErrorReloader(() => loadPyodideAndPackage({
  url: "/package.tar.gz", 
  format: "gztar",
}));

await reloader.withPyodide(async (pyodide) => {
  console.log(`Pyodide Version: ${pyodide.version}`);
  pyodide.setStdin({ stdin: () => prompt() })
  const result = pyodide.runPython(code)
  console.log("Python Result:", result);
})

Comlink.expose({
  runCode: pyodideExpose((extras, code) => {
      if (extras.interruptBuffer) {  // i.e. if SharedArrayBuffer is available so this could be sent by the client
        pyodide.setInterruptBuffer(extras.interruptBuffer);
      }
      pyodide.runPython(code);
    },
  ),
});