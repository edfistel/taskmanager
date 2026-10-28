import {
  createContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type PropsWithChildren,
} from "react";

import type { Usuario } from "../api/types";
import {
  sessionManager,
  type AuthStatus,
  type LoginInput,
  type RegisterInput,
  type SessionManager,
} from "./sessionManager";

export interface AuthContextValue {
  status: AuthStatus;
  user: Usuario | null;
  login(input: LoginInput): Promise<Usuario>;
  register(input: RegisterInput): Promise<Usuario>;
  logout(): Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps extends PropsWithChildren {
  manager?: SessionManager;
}

export function AuthProvider({
  children,
  manager = sessionManager,
}: AuthProviderProps) {
  const snapshot = useSyncExternalStore(
    manager.subscribe,
    manager.getSnapshot,
    manager.getSnapshot,
  );

  useEffect(() => {
    void manager.bootstrap();
  }, [manager]);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...snapshot,
      login: (input) => manager.login(input),
      register: (input) => manager.register(input),
      logout: () => manager.logout(),
    }),
    [manager, snapshot],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
