import { createConnection } from "node:net";
import { createHash } from "node:crypto";
import { repoRootFrom } from "./paths.mjs";

const root = repoRootFrom(import.meta.url);
export const localProjectId = createHash("sha256")
  .update(process.platform === "win32" ? root.toLowerCase() : root)
  .digest("hex");

/** @param {number} port @returns {Promise<boolean>} */
function portBusy(port) {
  return new Promise((resolve) => {
    const socket = createConnection({ host: "127.0.0.1", port });
    const finish = (busy) => {
      socket.destroy();
      resolve(busy);
    };
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

/** @param {{uiPort:number; apiPorts:number[]; projectId:string; mode:"dev"|"preview"}} options */
export async function inspectLocalRuntime({ uiPort, apiPorts, projectId, mode }) {
  const ports = [uiPort, ...apiPorts];
  const busy = await Promise.all(ports.map(portBusy));
  const occupied = ports.filter((_port, index) => busy[index]);
  if (occupied.length === 0) return { state: "available", occupied };

  if (busy.every(Boolean)) {
    try {
      const [ui, api] = await Promise.all([
        jsonAt(`http://127.0.0.1:${uiPort}/__taskflow/local-runtime`),
        jsonAt(`http://127.0.0.1:${apiPorts[0]}/__taskflow/local-runtime`),
      ]);
      if (
        ui?.app === "taskflow-local-ui" &&
        ui.projectId === projectId &&
        ui.mode === mode &&
        api?.app === "taskmanager-api" &&
        api.projectId === projectId
      ) {
        return { state: "already-running", occupied };
      }
    } catch {
      // Never stop or silently reuse processes that do not identify this project.
    }
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

  return {
    name: "taskflow-local-runtime",
    configureServer(server) {
      install(server, "dev");
    },
    configurePreviewServer(server) {
      install(server, "preview");
    },
  };
}
