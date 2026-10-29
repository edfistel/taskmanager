import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const frontendRoot = resolve(scriptDirectory, "..");
const viteCli = resolve(frontendRoot, "node_modules", "vite", "bin", "vite.js");
const bridgeScript = resolve(scriptDirectory, "api-bridge.mjs");
const mode = process.argv[2] === "preview" ? "preview" : "dev";
const viteArguments =
  mode === "preview"
    ? [viteCli, "preview"]
    : [viteCli];

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
