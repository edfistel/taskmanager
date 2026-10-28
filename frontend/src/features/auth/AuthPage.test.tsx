import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { describe, expect, it, vi } from "vitest";

import { AuthContext, type AuthContextValue } from "../../lib/auth/AuthProvider";
import { PreferencesProvider } from "../../lib/preferences/PreferencesProvider";
import { AuthPage } from "./AuthPage";
import { ProtectedRoute } from "./ProtectedRoute";

function renderAuth(
  overrides: Partial<AuthContextValue> = {},
  initialEntry = "/login",
) {
  const value: AuthContextValue = {
    status: "anonymous",
    user: null,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    ...overrides,
  };

  render(
    <PreferencesProvider>
      <AuthContext.Provider value={value}>
        <MemoryRouter initialEntries={[initialEntry]}>
          <Routes>
            <Route path="/login" element={<AuthPage />} />
            <Route path="/" element={<div>Painel principal</div>} />
            <Route
              path="/protegida"
              element={
                <ProtectedRoute>
                  <div>Conteúdo privado</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    </PreferencesProvider>,
  );

  return value;
}

describe("AuthPage", () => {
  it("uses a neutral email example and keeps the hero free of a secondary slogan", () => {
    renderAuth();

    expect(screen.getByPlaceholderText("seunome@dominio.com")).toBeVisible();
    expect(screen.queryByText(/trabalho em movimento/i)).not.toBeInTheDocument();
  });

  it("submits the exact login payload and navigates on success", async () => {
    const user = userEvent.setup();
    const login = vi.fn().mockResolvedValue({});
    renderAuth({ login });

    await user.type(screen.getByLabelText(/e-mail/i), "ana@empresa.com");
    await user.type(screen.getByLabelText(/^senha$/i), "segredo123");
    await user.click(screen.getByLabelText(/manter conectado/i));
    await user.click(screen.getByRole("button", { name: /entrar/i }));

    expect(login).toHaveBeenCalledWith({
      email: "ana@empresa.com",
      senha: "segredo123",
      remember: true,
    });
    expect(await screen.findByText("Painel principal")).toBeVisible();
  });

  it("keeps registration local when password confirmation differs", async () => {
    const user = userEvent.setup();
    const register = vi.fn();
    renderAuth({ register });

    await user.click(screen.getByRole("tab", { name: /criar conta/i }));
    await user.type(screen.getByLabelText(/nome de exibição/i), "Ana Lima");
    await user.type(screen.getByLabelText(/e-mail/i), "ana@empresa.com");
    await user.type(screen.getByLabelText(/^senha$/i), "segredo123");
    await user.type(screen.getByLabelText(/confirmar senha/i), "diferente123");
    await user.click(screen.getByRole("button", { name: /criar minha conta/i }));

    expect(register).not.toHaveBeenCalled();
    expect(screen.getByText(/senhas não coincidem/i)).toBeVisible();
  });

  it("redirects anonymous users away from protected routes", async () => {
    renderAuth({}, "/protegida");

    expect(await screen.findByRole("heading", { name: /bem-vindo/i })).toBeVisible();
    expect(screen.queryByText("Conteúdo privado")).not.toBeInTheDocument();
  });
});
