import { afterEach, describe, expect, it, vi } from "vitest";
import { installDemo } from "./installDemo";
import { requestJson } from "../lib/api/transport";
import { SessionManager } from "../lib/auth/sessionManager";
import { TokenStorage } from "../lib/auth/tokenStorage";

afterEach(() => {document.querySelector('[data-taskflow-demo]')?.remove(); sessionStorage.clear(); localStorage.clear(); vi.unstubAllGlobals();});
describe("demo bootstrap", () => {
 it("authenticates through the real session manager using a fake session token and labels the UI", async () => {
  const remote = vi.fn<typeof fetch>(); vi.stubGlobal("fetch", remote);
  installDemo();
  const manager = new SessionManager(requestJson, new TokenStorage());
  await manager.bootstrap();
  expect(manager.getSnapshot()).toMatchObject({status: "authenticated", user: {email: "marina@example.test"}});
  expect(sessionStorage.getItem("taskflow.refresh-token")).toBe("taskflow-demo-refresh");
  expect(localStorage.getItem("taskflow.refresh-token")).toBeNull();
  expect(document.querySelector('[aria-label="Modo de demonstração"]')).toHaveTextContent("dados fictícios");
  expect(remote).not.toHaveBeenCalled();
  await manager.logout();
  expect(manager.getSnapshot().status).toBe("anonymous");
  await manager.login({email: "demo@example.test", senha: "demo12345", remember: false});
  expect(manager.getSnapshot().status).toBe("authenticated");
 });
});
