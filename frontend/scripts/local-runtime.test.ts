// @vitest-environment node
import { createServer, type Server } from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import { inspectLocalRuntime } from "./local-runtime.mjs";

const servers: Server[] = [];
async function serve(payload: object) {
  const server = createServer((_req, res) => {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(payload));
  });
  servers.push(server);
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("No test port");
  return address.port;
}
afterEach(async () => {
  await Promise.all(servers.splice(0).map(server => new Promise<void>(resolve => {
    server.closeAllConnections(); server.close(() => resolve());
  })));
});
describe("local startup", () => {
  it("allows startup when the UI and service ports are free", async () => {
    const result = await inspectLocalRuntime({ uiPort: 0, apiPorts: [0, 0, 0, 0], projectId: "project-a", mode: "dev" });
    expect(result.state).toBe("available");
  });
  it("recognizes a complete instance of this project instead of starting a duplicate", async () => {
    const uiPort = await serve({ app: "taskflow-local-ui", projectId: "project-a", mode: "dev" });
    const apiPorts = await Promise.all([
      serve({ app: "taskmanager-api", projectId: "project-a" }),
      serve({ app: "auth-service" }),
      serve({ app: "user-service" }),
      serve({ app: "task-service" }),
    ]);
    expect((await inspectLocalRuntime({ uiPort, apiPorts, projectId: "project-a", mode: "dev" })).state).toBe("already-running");
  });
  it("does not reuse another project or a different runtime mode", async () => {
    const uiPort = await serve({ app: "taskflow-local-ui", projectId: "project-b", mode: "preview" });
    const apiPorts = await Promise.all([
      serve({ app: "taskmanager-api", projectId: "project-a" }),
      serve({ app: "auth-service" }),
      serve({ app: "user-service" }),
      serve({ app: "task-service" }),
    ]);
    const result = await inspectLocalRuntime({ uiPort, apiPorts, projectId: "project-a", mode: "dev" });
    expect(result.state).toBe("conflict");
    expect(result.occupied).toContain(uiPort);
  });
  it("does not claim everything works when only the UI is running", async () => {
    const uiPort = await serve({ app: "taskflow-local-ui", projectId: "project-a", mode: "dev" });
    expect((await inspectLocalRuntime({ uiPort, apiPorts: [0, 0, 0, 0], projectId: "project-a", mode: "dev" })).state).toBe("conflict");
  });
  it("refuses to reuse an unrelated service on a service port", async () => {
    const uiPort = await serve({ app: "taskflow-local-ui", projectId: "project-a", mode: "dev" });
    const apiPorts = [await serve({ app: "another-service" }), 0, 0, 0];
    expect((await inspectLocalRuntime({ uiPort, apiPorts, projectId: "project-a", mode: "dev" })).state).toBe("conflict");
  });
  it("refuses another checkout's API even when it is also a Task Manager", async () => {
    const uiPort = await serve({ app: "taskflow-local-ui", projectId: "project-a", mode: "dev" });
    const apiPorts = [await serve({ app: "taskmanager-api", projectId: "project-b" }), 0, 0, 0];
    expect((await inspectLocalRuntime({ uiPort, apiPorts, projectId: "project-a", mode: "dev" })).state).toBe("conflict");
  });
});
