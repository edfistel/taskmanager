export type TokenPersistence = "session" | "local";

const REFRESH_TOKEN_KEY = "taskflow.refresh-token";

export class TokenStorage {
  constructor(
    private readonly session: Storage = window.sessionStorage,
    private readonly local: Storage = window.localStorage,
  ) {}

  read(): string | null {
    return this.session.getItem(REFRESH_TOKEN_KEY) ?? this.local.getItem(REFRESH_TOKEN_KEY);
  }

  getPersistence(): TokenPersistence | null {
    if (this.session.getItem(REFRESH_TOKEN_KEY)) return "session";
    if (this.local.getItem(REFRESH_TOKEN_KEY)) return "local";
    return null;
  }

  write(token: string, persistence: TokenPersistence): void {
    this.clear();
    const target = persistence === "local" ? this.local : this.session;
    target.setItem(REFRESH_TOKEN_KEY, token);
  }

  clear(): void {
    this.session.removeItem(REFRESH_TOKEN_KEY);
    this.local.removeItem(REFRESH_TOKEN_KEY);
  }
}
