import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const PROXY_PREFIXES = Object.freeze([
  "/health",
  "/auth",
  "/users",
  "/quadros",
  "/listas",
  "/tarefas",
  "/subtarefas",
  "/comentarios",
  "/atribuicoes",
]);

/**
 * @param {string} importMetaUrl
 * @returns {string}
 */
export function repoRootFrom(importMetaUrl) {
  const scriptDirectory = dirname(fileURLToPath(importMetaUrl));
  return resolve(scriptDirectory, "..", "..");
}

/**
 * @param {string} target
 * @returns {Record<string, { target: string; changeOrigin: boolean; bypass: (req: { url?: string; headers: { accept?: string } }) => string | undefined }>}
 */
export function makeProxyConfig(target) {
  return Object.fromEntries(
    PROXY_PREFIXES.map((prefix) => [
      prefix,
      {
        target,
        changeOrigin: true,
        bypass(req) {
          if (req.headers.accept?.includes("text/html")) return req.url;
        },
      },
    ]),
  );
}
