import { Navigate, Route, Routes } from "react-router";
import { lazy, Suspense } from "react";

import { AppShell } from "../components/layout/AppShell";
import { AuthPage } from "../features/auth/AuthPage";
import { ProtectedRoute } from "../features/auth/ProtectedRoute";
const BoardPage = lazy(() => import("../features/boards/BoardPage").then((module) => ({ default: module.BoardPage })));
const DashboardPage = lazy(() => import("../features/dashboard/DashboardPage").then((module) => ({ default: module.DashboardPage })));
const AssignmentsPage = lazy(() => import("../features/assignments/AssignmentsPage").then((module) => ({ default: module.AssignmentsPage })));

function ProtectedPage({ title, eyebrow, children }: React.PropsWithChildren<{ title: string; eyebrow?: string }>) {
  return (
    <ProtectedRoute>
      <AppShell eyebrow={eyebrow} title={title}>{children}</AppShell>
    </ProtectedRoute>
  );
}

export function AppRoutes() {
  return (
    <Suspense fallback={<p role="status" style={{ padding: "2rem" }}>Carregando página…</p>}><Routes>
      <Route element={<AuthPage />} path="/login" />
      <Route path="/" element={<ProtectedPage eyebrow="Seu espaço" title="Visão geral"><DashboardPage /></ProtectedPage>} />
      <Route path="/quadros/:quadroId" element={<ProtectedRoute><BoardPage /></ProtectedRoute>} />
      <Route path="/atribuicoes" element={<ProtectedPage eyebrow="Colaboração" title="Minhas atribuições"><AssignmentsPage /></ProtectedPage>} />
      <Route element={<Navigate replace to="/" />} path="*" />
    </Routes></Suspense>
  );
}
