const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const services = {
  gateway: "api-gateway",
  auth: "auth-service",
  user: "user-service",
  task: "task-service",
};
const requestedService = process.argv[2];

if (requestedService !== "all" && !services[requestedService]) {
  console.error("Uso: node services/run-db-studio.cjs <gateway|auth|user|task|all>");
  process.exit(1);
}

const candidates = requestedService === "all" ? Object.values(services) : [services[requestedService]];
let connection;
let selectedService;

for (const service of candidates) {
  const serviceDir = path.join(root, "services", service);
  const dotenv = require(path.join(serviceDir, "node_modules", "dotenv"));
  const envPath = path.join(serviceDir, ".env");
  const fileEnv = fs.existsSync(envPath) ? dotenv.parse(fs.readFileSync(envPath)) : {};
  const rawUrl = process.env.DATABASE_URL || fileEnv.DATABASE_URL;

  if (rawUrl) {
    connection = { service, serviceDir, env: { ...fileEnv, ...process.env }, rawUrl };
    selectedService = service;
    break;
  }
}

if (!connection) {
  console.error("DATABASE_URL não foi encontrado no ambiente nem nos arquivos .env dos serviços.");
  process.exit(1);
}

let databaseUrl;
try {
  databaseUrl = new URL(connection.rawUrl);
} catch {
  console.error(`DATABASE_URL inválido para o serviço ${selectedService}.`);
  process.exit(1);
}

// `schema` is a Prisma-only URL parameter; Prisma Studio v7 expects a standard PostgreSQL URL.
databaseUrl.searchParams.delete("schema");

const prismaCli = path.join(connection.serviceDir, "node_modules", "prisma", "build", "index.js");
if (!fs.existsSync(prismaCli)) {
  console.error(`Prisma não está instalado em services/${selectedService}. Execute npm install nesse serviço.`);
  process.exit(1);
}

const studio = spawn(process.execPath, [prismaCli, "studio", "--port", "5555", "--url", databaseUrl.toString()], {
  cwd: connection.serviceDir,
  env: connection.env,
  stdio: "inherit",
});

let stopping = false;
function forwardSignal(signal) {
  if (stopping) return;
  stopping = true;
  if (studio.exitCode === null && !studio.killed) studio.kill(signal);
}

studio.on("error", (error) => {
  console.error(`Não foi possível iniciar o Prisma Studio: ${error.message}`);
  process.exitCode = 1;
});
studio.on("exit", (code, signal) => {
  process.exitCode = code ?? (signal ? 1 : 0);
});

process.on("SIGINT", () => forwardSignal("SIGINT"));
process.on("SIGTERM", () => forwardSignal("SIGTERM"));
