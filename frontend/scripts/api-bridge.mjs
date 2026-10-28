import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { repoRootFrom } from "./paths.mjs";

const API_HOST = "127.0.0.1";
const API_PORT = 3001;
const REQUIRED_DATABASE_VARIABLES = [
  "DB_DATABASE",
  "DB_HOST",
  "DB_PORT",
  "DB_USER",
  "DB_PASSWORD",
];

async function startBridge() {
  const repositoryRoot = repoRootFrom(import.meta.url);
  process.chdir(repositoryRoot);

  await import("dotenv/config");

  const missingVariables = REQUIRED_DATABASE_VARIABLES.filter(
    (variable) => !process.env[variable],
  );

  if (missingVariables.length > 0) {
    throw new Error(
      `Configure o .env na raiz do projeto. Variáveis ausentes: ${missingVariables.join(", ")}`,
    );
  }

  const appModuleUrl = pathToFileURL(resolve(repositoryRoot, "src", "app.js"));
  const { default: app } = await import(appModuleUrl.href);
  const server = app.listen(API_PORT, API_HOST, () => {
    console.log(`[TaskFlow] API interna em http://${API_HOST}:${API_PORT}`);
  });

  /** @param {Error} error */
  const handleServerError = (error) => {
    console.error("[TaskFlow] Não foi possível iniciar a API interna.", error);
    process.exitCode = 1;
  };

  server.on("error", handleServerError);

  const stop = () => {
    server.close(() => process.exit(0));
  };

  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
}

startBridge().catch((error) => {
  console.error(`[TaskFlow] ${error.message}`);
  process.exitCode = 1;
});
