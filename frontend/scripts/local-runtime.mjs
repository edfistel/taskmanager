import { createConnection } from "node:net";
import { createHash } from "node:crypto";
import { repoRootFrom } from "./paths.mjs";

const root = repoRootFrom(import.meta.url);
export const localProjectId = createHash("sha256").update(process.platform === "win32" ? root.toLowerCase() : root).digest("hex");

/** @param {number} port @returns {Promise<boolean>} */
function portBusy(port) {
  return new Promise(resolve => {
    const socket = createConnection({ host: "127.0.0.1", port });
    const finish = (/** @type {boolean} */ busy) => { socket.destroy(); resolve(busy); };
    socket.once("connect", () => finish(true));
    socket.once("error", () => finish(false));
    socket.setTimeout(1500, () => finish(true));
  });
}

/** @param {string} url */
async function jsonAt(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(2000), redirect: "error" });
  if (!response.ok) throw new Error("Runtime identity unavailable");
  return response.json();
}

/** @param {{uiPort:number; apiPort:number; projectId:string; mode:"dev"|"preview"}} options */
export async function inspectLocalRuntime({ uiPort, apiPort, projectId, mode }) {
  const [uiBusy, apiBusy] = await Promise.all([portBusy(uiPort), portBusy(apiPort)]);
  const occupied = [uiBusy ? uiPort : null, apiBusy ? apiPort : null].filter(port => port !== null);
  if (!uiBusy && !apiBusy) return { state: "available", occupied };
  if (uiBusy && apiBusy) {
    try {
      const [ui, api] = await Promise.all([
        jsonAt(`http://127.0.0.1:${uiPort}/__taskflow/local-runtime`),
        jsonAt(`http://127.0.0.1:${apiPort}/__taskflow/local-runtime`),
      ]);
      if (ui && typeof ui === "object" && api && typeof api === "object" &&
          Reflect.get(ui, "app") === "taskflow-local-ui" && Reflect.get(ui, "projectId") === projectId &&
          Reflect.get(ui, "mode") === mode && Reflect.get(api, "app") === "Api - Task Manager" && Reflect.get(api, "projectId") === projectId) {
        return { state: "already-running", occupied };
      }
    } catch { /* Another application must never be stopped or silently reused. */ }
  }
  return { state: "conflict", occupied };
}

/** @returns {import("vite").Plugin} */
export function localRuntimePlugin() {
  /** @param {import("vite").ViteDevServer | import("vite").PreviewServer} server @param {"dev"|"preview"} mode */
  function install(server, mode) {
    server.middlewares.use("/__taskflow/local-runtime", (_req, res) => {
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Cache-Control", "no-store");
      res.end(JSON.stringify({ app: "taskflow-local-ui", projectId: localProjectId, mode }));
    });
  }
  return { name: "taskflow-local-runtime", configureServer(server) { install(server, "dev"); }, configurePreviewServer(server) { install(server, "preview"); } };
}
