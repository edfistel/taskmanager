const path = require("node:path");
const { spawn } = require("node:child_process");

const mode = process.argv[2];
if (mode !== "dev" && mode !== "start") {
  console.error("Uso: node services/run-all-apis.cjs <dev|start>");
  process.exit(1);
}

const root = path.resolve(__dirname, "..");
const services = ["api-gateway", "auth-service", "user-service", "task-service"];
const npmCli = process.env.npm_execpath;
const children = services.map((service) => {
  const args = ["--prefix", path.join(root, "services", service), "run", mode];
  const command = npmCli ? process.execPath : process.platform === "win32" ? "npm.cmd" : "npm";
  const commandArgs = npmCli ? [npmCli, ...args] : args;
  return {
    service,
    child: spawn(command, commandArgs, {
      cwd: root,
      env: process.env,
      stdio: "inherit",
      shell: !npmCli && process.platform === "win32",
    }),
  };
});

let stopping = false;
function stopAll(signal = "SIGTERM", exitCode = 1) {
  if (stopping) return;
  stopping = true;
  process.exitCode = exitCode;
  for (const { child } of children) {
    if (child.exitCode === null && !child.killed) child.kill(signal);
  }
}

for (const { service, child } of children) {
  child.on("error", (error) => {
    console.error(`[${service}] ${error.message}`);
    stopAll();
  });
  child.on("exit", (code, signal) => {
    if (!stopping) {
      console.error(`[${service}] encerrou (código ${code ?? signal ?? "desconhecido"}); encerrando os demais serviços.`);
      stopAll("SIGTERM", code ?? 1);
    }
  });
}

process.on("SIGINT", () => stopAll("SIGINT", 130));
process.on("SIGTERM", () => stopAll("SIGTERM", 143));
