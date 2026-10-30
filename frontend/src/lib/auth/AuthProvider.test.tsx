import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AuthProvider } from "./AuthProvider";
import { SessionManager } from "./sessionManager";
import { TokenStorage } from "./tokenStorage";
import type { JsonTransport } from "../api/transport";

describe("session cache isolation", () => {
  it("removes the previous user's data on expiry and before another account logs in", async () => {
    sessionStorage.clear(); localStorage.clear();
    let userId = 1;
    const transport: JsonTransport = async <T,>() => ({ usuario: { id: userId, nome: "Pessoa " + userId, email: `pessoa${userId}@example.test` }, accessToken: "access", refreshToken: "refresh" }) as T;
    const manager = new SessionManager(transport, new TokenStorage());
    const cache = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000 } } });
    render(<QueryClientProvider client={cache}><AuthProvider manager={manager}><span>Sessão</span></AuthProvider></QueryClientProvider>);
    await act(() => manager.login({ email: "pessoa1@example.test", senha: "senha1234", remember: false }));
    cache.setQueryData(["account", "profile"], { id: 1, nome: "Pessoa 1" });
    cache.setQueryData(["assignments", "mine"], [{ titulo: "Dados da pessoa 1" }]);
    act(() => manager.expire());
    expect(cache.getQueryData(["account", "profile"])).toBeUndefined();
    expect(cache.getQueryData(["assignments", "mine"])).toBeUndefined();
    cache.setQueryData(["tasks", 1], { titulo: "Resposta antiga" });
    userId = 2;
    await act(() => manager.login({ email: "pessoa2@example.test", senha: "senha1234", remember: false }));
    expect(manager.getSnapshot().user?.id).toBe(2);
    expect(cache.getQueryData(["tasks", 1])).toBeUndefined();
  });
});
