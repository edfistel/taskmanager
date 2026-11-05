import type { PropsWithChildren } from "react";
import { Navigate, useLocation } from "react-router";

import { TaskFlowLogo } from "../../components/brand/TaskFlowLogo";
import { useAuth } from "../../lib/auth/useAuth";
import styles from "./auth.module.css";

export function ProtectedRoute({ children }: PropsWithChildren) {
  const auth = useAuth();
  const location = useLocation();

  if (auth.status === "bootstrapping") {
    return (
      <main aria-busy="true" className={styles.splash}>
        <TaskFlowLogo />
        <span>Preparando seu espaço…</span>
      </main>
    );
  }

  if (auth.status === "anonymous") {
    return <Navigate replace state={{ from: location.pathname }} to="/login" />;
  }

  return children;
}
