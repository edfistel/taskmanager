import { describe, expect, it } from "vitest";
import { makeProxyConfig } from "./paths.mjs";

describe("shared API and page paths", () => {
  it.each(["/quadros/12", "/atribuicoes"])("serves HTML navigation for %s", (url) => {
    const proxy = makeProxyConfig("http://127.0.0.1:3001")[url.startsWith("/quadros") ? "/quadros" : "/atribuicoes"];
    expect(proxy.bypass?.({ url, headers: { accept: "text/html,application/xhtml+xml" } })).toBe(url);
  });

  it("continues proxying JSON board requests", () => {
    const proxy = makeProxyConfig("http://127.0.0.1:3001")["/quadros"];
    expect(proxy.bypass?.({ url: "/quadros/12", headers: { accept: "application/json" } })).toBeUndefined();
  });
});
