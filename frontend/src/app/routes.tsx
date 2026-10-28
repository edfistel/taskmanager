import { Navigate, Route, Routes } from "react-router";

import { AppShell } from "../components/layout/AppShell";
import { AuthPage } from "../features/auth/AuthPage";
import { ProtectedRoute } from "../features/auth/ProtectedRoute";
import { DashboardPage } from "../features/dashboard/DashboardPage";

function ProtectedPage({ title, eyebrow, children }: React.PropsWithChildren<{ title: string; eyebrow?: string }>) {
  return (
    <ProtectedRoute>
      <AppShell eyebrow={eyebrow} title={title}>{children}</AppShell>
    </ProtectedRoute>
  );
}

function ComingSoon({ text }: { text: string }) {
  return (
    <section style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "2rem", background: "var(--color-bg-elevated)" }}>
      <p style={{ margin: 0, color: "var(--color-text-soft)" }}>{text}</p>
    </section>
  );
}

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AuthPage />} path="/login" />
      <Route path="/" element={<ProtectedPage eyebrow="Seu espaço" title="Visão geral"><DashboardPage /></ProtectedPage>} />
      <Route path="/quadros/:quadroId" element={<ProtectedPage eyebrow="Quadro" title="Kanban"><ComingSoon text="O quadro Kanban será conectado aos dados reais." /></ProtectedPage>} />
      <Route path="/atribuicoes" element={<ProtectedPage eyebrow="Colaboração" title="Minhas atribuições"><ComingSoon text="Suas tarefas atribuídas aparecerão aqui." /></ProtectedPage>} />
      <Route element={<Navigate replace to="/" />} path="*" />
    </Routes>
  );
}
