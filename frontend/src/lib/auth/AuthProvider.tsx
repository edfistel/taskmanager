import {
  createContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type PropsWithChildren,
} from "react";
import { useQueryClient } from "@tanstack/react-query";

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
  const queryClient = useQueryClient();
  const subscribe = useMemo(() => {
    let identity = manager.getSnapshot().user?.id ?? null;
    return (listener: () => void) => manager.subscribe(() => {
      const nextIdentity = manager.getSnapshot().user?.id ?? null;
      if (nextIdentity !== identity) {
        // Clear before publishing the new session so another account cannot render cached private data.
        identity = nextIdentity;
        void queryClient.cancelQueries();
        queryClient.clear();
      }
      listener();
    });
  }, [manager, queryClient]);
  const snapshot = useSyncExternalStore(
    subscribe,
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
