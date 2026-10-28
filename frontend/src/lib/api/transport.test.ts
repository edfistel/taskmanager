import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "./errors";
import {
  createAuthenticatedTransport,
  requestJson,
  type JsonTransport,
  type RequestJsonOptions,
  type SessionPort,
} from "./transport";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("requestJson", () => {
  it("unwraps successful API envelopes", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ success: true, body: { id: 7, nome: "Produto" } }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(requestJson<{ id: number; nome: string }>("/quadros/7")).resolves.toEqual({
      id: 7,
      nome: "Produto",
    });
  });

  it("rejects with normalized status and message", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ erro: "Token inválido" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    await expect(requestJson("/quadros")).rejects.toMatchObject({
      status: 403,
      message: "Token inválido",
    });
  });

  it("uses a useful fallback for a non-JSON server error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("Gateway indisponível", {
          status: 500,
          statusText: "Internal Server Error",
          headers: { "Content-Type": "text/plain" },
        }),
      ),
    );

    await expect(requestJson("/health")).rejects.toMatchObject({
      status: 500,
      message: "Não foi possível concluir a solicitação.",
    });
  });
});

describe("authenticated transport", () => {
  it("adds a bearer token, refreshes once after 401 and retries once", async () => {
    const calls: Array<{ path: string; authorization: string | null }> = [];
    const base: JsonTransport = async <T>(
      path: string,
      options: RequestJsonOptions = {},
    ) => {
      const authorization = new Headers(options.headers).get("Authorization");
      calls.push({ path, authorization });
      if (calls.length === 1) {
        throw new ApiError(401, { erro: "Expirado" }, "Expirado");
      }
      return { id: 9 } as T;
    };
    const session: SessionPort = {
      getAccessToken: vi
        .fn()
        .mockReturnValueOnce("access-antigo")
        .mockReturnValue("access-novo"),
      refresh: vi.fn().mockResolvedValue("access-novo"),
      expire: vi.fn(),
    };
    const authenticated = createAuthenticatedTransport(base, session);

    await expect(authenticated<{ id: number }>("/quadros/9")).resolves.toEqual({ id: 9 });
    expect(calls).toEqual([
      { path: "/quadros/9", authorization: "Bearer access-antigo" },
      { path: "/quadros/9", authorization: "Bearer access-novo" },
    ]);
    expect(session.refresh).toHaveBeenCalledTimes(1);
    expect(session.expire).not.toHaveBeenCalled();
  });

  it("never retries a second 401 and expires the session", async () => {
    const base = vi.fn().mockRejectedValue(
      new ApiError(401, { erro: "Expirado" }, "Expirado"),
    ) as JsonTransport;
    const session: SessionPort = {
      getAccessToken: () => "access",
      refresh: vi.fn().mockResolvedValue("novo-access"),
      expire: vi.fn(),
    };

    const authenticated = createAuthenticatedTransport(base, session);

    await expect(authenticated("/quadros")).rejects.toMatchObject({ status: 401 });
    expect(base).toHaveBeenCalledTimes(2);
    expect(session.refresh).toHaveBeenCalledTimes(1);
    expect(session.expire).toHaveBeenCalledTimes(1);
  });

  it("does not refresh authorization errors other than 401", async () => {
    const base = vi.fn().mockRejectedValue(
      new ApiError(403, { message: "Sem permissão" }, "Sem permissão"),
    ) as JsonTransport;
    const session: SessionPort = {
      getAccessToken: () => "access",
      refresh: vi.fn(),
      expire: vi.fn(),
    };

    const authenticated = createAuthenticatedTransport(base, session);

    await expect(authenticated("/quadros")).rejects.toMatchObject({ status: 403 });
    expect(base).toHaveBeenCalledTimes(1);
    expect(session.refresh).not.toHaveBeenCalled();
  });
});
