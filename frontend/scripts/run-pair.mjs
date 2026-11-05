import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { inspectLocalRuntime, localProjectId } from "./local-runtime.mjs";
import { repoRootFrom } from "./paths.mjs";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const frontendRoot = resolve(scriptDirectory, "..");
const repoRoot = repoRootFrom(import.meta.url);
const viteCli = resolve(frontendRoot, "node_modules", "vite", "bin", "vite.js");
const servicesScript = resolve(repoRoot, "services", "run-all-apis.cjs");
const mode = process.argv[2] === "preview" ? "preview" : "dev";
const uiPort = mode === "preview" ? 4173 : 5173;
const servicesMode = mode === "preview" ? "start" : "dev";
const viteArguments = mode === "preview" ? [viteCli, "preview"] : [viteCli];
const apiPorts = [3000, 3001, 3002, 3003];

const runtime = await inspectLocalRuntime({
  uiPort,
  apiPorts,
  projectId: localProjectId,
  mode,
});

if (runtime.state === "already-running") {
  console.log(`[TaskFlow] Este projeto ja esta em execucao. Acesse http://localhost:${uiPort}.`);
  console.log("[TaskFlow] Para encerra-lo, use Ctrl+C no terminal que iniciou o servidor.");
  process.exit(0);
}

if (runtime.state === "conflict") {
  console.error(`[TaskFlow] Nao foi possivel iniciar: porta(s) ${runtime.occupied.join(", ")} em uso.`);
  console.error("[TaskFlow] Encerre a execucao anterior com Ctrl+C no terminal que a iniciou.");
  console.error("[TaskFlow] Nenhum processo foi encerrado automaticamente.");
  process.exit(1);
}

const env = { ...process.env, TASKFLOW_PROJECT_ID: localProjectId };
const children = [
  spawn(process.execPath, [servicesScript, servicesMode], {
    cwd: repoRoot,
    stdio: "inherit",
    env,
    windowsHide: true,
  }),
  spawn(process.execPath, viteArguments, {
    cwd: frontendRoot,
    stdio: "inherit",
    env,
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
    if (!stopping) stop(code ?? (signal ? 1 : 0));
  });
}

process.once("SIGINT", () => stop(0));
process.once("SIGTERM", () => stop(0));
