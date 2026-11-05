import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { inspectLocalRuntime, localProjectId } from "./local-runtime.mjs";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const frontendRoot = resolve(scriptDirectory, "..");
const viteCli = resolve(frontendRoot, "node_modules", "vite", "bin", "vite.js");
const bridgeScript = resolve(scriptDirectory, "api-bridge.mjs");
const mode = process.argv[2] === "preview" ? "preview" : "dev";
const viteArguments =
  mode === "preview"
    ? [viteCli, "preview"]
    : [viteCli];

const runtime = await inspectLocalRuntime({ uiPort: 3000, apiPort: 3001, projectId: localProjectId, mode });
if (runtime.state === "already-running") {
  console.log("[TaskFlow] Este projeto já está em execução. Acesse http://localhost:3000 (frontend + API).");
  console.log("[TaskFlow] Para encerrá-lo, use Ctrl+C no terminal que iniciou o servidor.");
  process.exit(0);
}
if (runtime.state === "conflict") {
  console.error(`[TaskFlow] Não foi possível iniciar: porta(s) ${runtime.occupied.join(", ")} em uso.`);
  console.error("[TaskFlow] Encerre a execução anterior com Ctrl+C e rode npm run dev na raiz do projeto.");
  console.error("[TaskFlow] Se as portas pertencem a outro programa, libere-as primeiro. Nenhum processo foi encerrado automaticamente.");
  process.exit(1);
}

const children = [
  spawn(process.execPath, [bridgeScript], {
    cwd: frontendRoot,
    stdio: "inherit",
    windowsHide: true,
  }),
  spawn(process.execPath, viteArguments, {
    cwd: frontendRoot,
    stdio: "inherit",
    windowsHide: true,
  }),
];

let stopping = false;

/** @param {number} exitCode */
function stop(exitCode) {
  if (stopping) return;
  stopping = true;

  for (const child of children) {
    if (!child.killed) child.kill("SIGTERM");
  }

  process.exitCode = exitCode;
}

for (const child of children) {
  child.once("error", (error) => {
    console.error("[TaskFlow] Falha ao iniciar um processo local.", error);
    stop(1);
  });
  child.once("exit", (code, signal) => {
    if (!stopping) {
      stop(code ?? (signal ? 1 : 0));
    }
  });
}

process.once("SIGINT", () => stop(0));
process.once("SIGTERM", () => stop(0));
