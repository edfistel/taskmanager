import { describe, expect, it } from "vitest";

import {
  PROXY_PREFIXES,
  makeProxyConfig,
  repoRootFrom,
} from "./paths.mjs";

describe("local bridge paths", () => {
  it("resolves the repository root from the frontend script URL", () => {
    expect(repoRootFrom(import.meta.url)).toMatch(/taskmanager$/);
  });

  it("proxies every existing API prefix and keeps SPA routes in Vite", () => {
    expect(PROXY_PREFIXES).toEqual([
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
  });

  it("targets the internal API consistently", () => {
    expect(makeProxyConfig("http://127.0.0.1:3001")["/auth"].target).toBe(
      "http://127.0.0.1:3001",
    );
  });
});
