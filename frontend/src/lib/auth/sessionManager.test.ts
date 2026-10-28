import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "../api/errors";
import type { JsonTransport, RequestJsonOptions } from "../api/transport";
import type { AuthResponse, RefreshResponse, Usuario } from "../api/types";
import {
  PostRegistrationLoginError,
  SessionManager,
} from "./sessionManager";
import { TokenStorage } from "./tokenStorage";

const user: Usuario = { id: 4, nome: "Ana Lima", email: "ana@empresa.com" };

describe("SessionManager", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  it("logs in, keeps access in memory and persists refresh by preference", async () => {
    const transport: JsonTransport = async <T>(path: string) => {
      expect(path).toBe("/auth/login");
      return {
        usuario: user,
        accessToken: "access-1",
        refreshToken: "refresh-1",
      } as T;
    };
    const manager = new SessionManager(transport, new TokenStorage());

    await expect(
      manager.login({ email: user.email, senha: "segredo123", remember: true }),
    ).resolves.toEqual(user);
    expect(manager.getAccessToken()).toBe("access-1");
    expect(manager.getSnapshot()).toEqual({ status: "authenticated", user });
    expect(localStorage.getItem("taskflow.refresh-token")).toBe("refresh-1");
    expect(sessionStorage.getItem("taskflow.refresh-token")).toBeNull();
  });

  it("registers and automatically logs in with in-memory credentials", async () => {
    const calls: string[] = [];
    const transport: JsonTransport = async <T>(
      path: string,
      options: RequestJsonOptions = {},
    ) => {
      calls.push(path);
      if (path === "/users/register") {
        expect(options.json).toEqual({
          nome: user.nome,
          email: user.email,
          senha: "segredo123",
        });
        return user as T;
      }
      return {
        usuario: user,
        accessToken: "access-2",
        refreshToken: "refresh-2",
      } as T;
    };
    const manager = new SessionManager(transport, new TokenStorage());

    await expect(
      manager.register({
        nome: user.nome,
        email: user.email,
        senha: "segredo123",
        remember: false,
      }),
    ).resolves.toEqual(user);
    expect(calls).toEqual(["/users/register", "/auth/login"]);
    expect(sessionStorage.getItem("taskflow.refresh-token")).toBe("refresh-2");
  });

  it("exposes a typed error when post-registration login fails", async () => {
    const transport: JsonTransport = async <T>(path: string) => {
      if (path === "/users/register") return user as T;
      throw new ApiError(401, { erro: "Credenciais inválidas" });
    };
    const manager = new SessionManager(transport, new TokenStorage());

    await expect(
      manager.register({
        nome: user.nome,
        email: user.email,
        senha: "segredo123",
        remember: false,
      }),
    ).rejects.toMatchObject({
      name: "PostRegistrationLoginError",
      email: user.email,
    } satisfies Partial<PostRegistrationLoginError>);
  });

  it("bootstraps by rotating refresh and loading the user profile", async () => {
    const storage = new TokenStorage();
    storage.write("refresh-old", "session");
    const transport: JsonTransport = async <T>(
      path: string,
      options: RequestJsonOptions = {},
    ) => {
      if (path === "/auth/refresh") {
        expect(options.json).toEqual({ refreshToken: "refresh-old" });
        return {
          accessToken: "access-new",
          refreshToken: "refresh-new",
        } satisfies RefreshResponse as T;
      }
      expect(new Headers(options.headers).get("Authorization")).toBe(
        "Bearer access-new",
      );
      return user as T;
    };
    const manager = new SessionManager(transport, storage);

    await manager.bootstrap();

    expect(manager.getSnapshot()).toEqual({ status: "authenticated", user });
    expect(storage.read()).toBe("refresh-new");
  });

  it("shares one rotating refresh across concurrent callers", async () => {
    const storage = new TokenStorage();
    storage.write("refresh-old", "session");
    let refreshCalls = 0;
    const transport: JsonTransport = async <T>(path: string) => {
      expect(path).toBe("/auth/refresh");
      refreshCalls += 1;
      await Promise.resolve();
      return {
        accessToken: "new-access",
        refreshToken: "new-refresh",
      } satisfies RefreshResponse as T;
    };
    const manager = new SessionManager(transport, storage);

    const results = await Promise.all([
      manager.refresh(),
      manager.refresh(),
      manager.refresh(),
    ]);

    expect(refreshCalls).toBe(1);
    expect(results).toEqual(["new-access", "new-access", "new-access"]);
  });

  it("clears the local session even when logout revocation fails", async () => {
    const storage = new TokenStorage();
    storage.write("refresh", "local");
    const transport: JsonTransport = async <T>(path: string) => {
      if (path === "/auth/login") {
        return {
          usuario: user,
          accessToken: "access",
          refreshToken: "refresh",
        } satisfies AuthResponse as T;
      }
      throw new TypeError("offline");
    };
    const manager = new SessionManager(transport, storage);
    await manager.login({ email: user.email, senha: "segredo123", remember: true });

    await expect(manager.logout()).resolves.toBeUndefined();
    expect(manager.getSnapshot()).toEqual({ status: "anonymous", user: null });
    expect(storage.read()).toBeNull();
  });

  it("expires cleanly when a stored refresh token is revoked", async () => {
    const storage = new TokenStorage();
    storage.write("revoked", "session");
    const transport = vi.fn().mockRejectedValue(
      new ApiError(401, { erro: "Refresh token revogado" }),
    ) as JsonTransport;
    const manager = new SessionManager(transport, storage);

    await expect(manager.refresh()).resolves.toBeNull();
    expect(manager.getSnapshot()).toEqual({ status: "anonymous", user: null });
    expect(storage.read()).toBeNull();
  });
});
