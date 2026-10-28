import {
  createAuthenticatedTransport,
  requestJson,
  type JsonTransport,
  type SessionPort,
} from "../api/transport";
import type {
  AuthResponse,
  RefreshResponse,
  Usuario,
} from "../api/types";
import { TokenStorage, type TokenPersistence } from "./tokenStorage";

export type AuthStatus = "bootstrapping" | "authenticated" | "anonymous";

export interface AuthSnapshot {
  status: AuthStatus;
  user: Usuario | null;
}

export interface LoginInput {
  email: string;
  senha: string;
  remember: boolean;
}

export interface RegisterInput extends LoginInput {
  nome: string;
}

export class PostRegistrationLoginError extends Error {
  readonly email: string;
  readonly cause: unknown;

  constructor(email: string, cause: unknown) {
    super(
      "Sua conta foi criada, mas o login automático não foi concluído. Entre com seus dados.",
    );
    this.name = "PostRegistrationLoginError";
    this.email = email;
    this.cause = cause;
  }
}

export class SessionManager implements SessionPort {
  private accessToken: string | null = null;
  private snapshot: AuthSnapshot = { status: "bootstrapping", user: null };
  private refreshPromise: Promise<string | null> | null = null;
  private readonly listeners = new Set<() => void>();

  constructor(
    private readonly transport: JsonTransport,
    private readonly tokenStorage: TokenStorage,
  ) {}

  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  readonly getSnapshot = (): AuthSnapshot => this.snapshot;

  getAccessToken(): string | null {
    return this.accessToken;
  }

  async bootstrap(): Promise<void> {
    if (!this.tokenStorage.read()) {
      this.setSnapshot({ status: "anonymous", user: null });
      return;
    }

    const accessToken = await this.refresh();
    if (!accessToken) return;

    try {
      const user = await this.transport<Usuario>("/users/buscarMeuPerfil", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      this.setSnapshot({ status: "authenticated", user });
    } catch {
      this.expire();
    }
  }

  async login(input: LoginInput): Promise<Usuario> {
    const response = await this.transport<AuthResponse>("/auth/login", {
      method: "POST",
      json: { email: input.email, senha: input.senha },
    });

    this.acceptAuthentication(
      response,
      input.remember ? "local" : "session",
    );
    return response.usuario;
  }

  async register(input: RegisterInput): Promise<Usuario> {
    await this.transport<Usuario>("/users/register", {
      method: "POST",
      json: { nome: input.nome, email: input.email, senha: input.senha },
    });

    try {
      return await this.login(input);
    } catch (error) {
      throw new PostRegistrationLoginError(input.email, error);
    }
  }

  refresh(): Promise<string | null> {
    if (this.refreshPromise) return this.refreshPromise;

    const activeRefresh = this.rotateRefresh();
    this.refreshPromise = activeRefresh;
    void activeRefresh.finally(() => {
      if (this.refreshPromise === activeRefresh) this.refreshPromise = null;
    });
    return activeRefresh;
  }

  async logout(): Promise<void> {
    const refreshToken = this.tokenStorage.read();
    try {
      if (refreshToken) {
        await this.transport("/auth/logout", {
          method: "POST",
          json: { refreshToken },
        });
      }
    } catch {
      // A limpeza local é obrigatória mesmo quando a revogação está offline.
    } finally {
      this.expire();
    }
  }

  expire(): void {
    this.accessToken = null;
    this.tokenStorage.clear();
    this.setSnapshot({ status: "anonymous", user: null });
  }

  private async rotateRefresh(): Promise<string | null> {
    const refreshToken = this.tokenStorage.read();
    const persistence = this.tokenStorage.getPersistence();
    if (!refreshToken || !persistence) {
      this.expire();
      return null;
    }

    try {
      const response = await this.transport<RefreshResponse>("/auth/refresh", {
        method: "POST",
        json: { refreshToken },
      });
      this.accessToken = response.accessToken;
      this.tokenStorage.write(response.refreshToken, persistence);
      return response.accessToken;
    } catch {
      this.expire();
      return null;
    }
  }

  private acceptAuthentication(
    response: AuthResponse,
    persistence: TokenPersistence,
  ): void {
    this.accessToken = response.accessToken;
    this.tokenStorage.write(response.refreshToken, persistence);
    this.setSnapshot({ status: "authenticated", user: response.usuario });
  }

  private setSnapshot(snapshot: AuthSnapshot): void {
    this.snapshot = snapshot;
    for (const listener of this.listeners) listener();
  }
}

export const sessionManager = new SessionManager(requestJson, new TokenStorage());
export const authenticatedRequest = createAuthenticatedTransport(
  requestJson,
  sessionManager,
);
