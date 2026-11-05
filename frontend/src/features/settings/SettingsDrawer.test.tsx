import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "../../components/feedback/ToastProvider";
import { AuthContext } from "../../lib/auth/AuthProvider";
import { PreferencesProvider } from "../../lib/preferences/PreferencesProvider";
import { SettingsDrawer } from "./SettingsDrawer";
import { AccountApi } from "./accountApi";

vi.mock("./accountApi", () => ({ AccountApi: { profile: vi.fn(), changePassword: vi.fn(), deleteAccount: vi.fn() } }));
const profile = { id: 1, nome: "Ana Lima", email: "ana@example.com" };

function setup() {
  const logout = vi.fn().mockResolvedValue(undefined);
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  queryClient.setQueryData(["private-board"], { title: "Segredo" });
  render(<QueryClientProvider client={queryClient}><PreferencesProvider><AuthContext.Provider value={{ status: "authenticated", user: profile, login: vi.fn(), register: vi.fn(), logout }}><ToastProvider><SettingsDrawer open onClose={vi.fn()} /></ToastProvider></AuthContext.Provider></PreferencesProvider></QueryClientProvider>);
  return { logout, queryClient, user: userEvent.setup() };
}

beforeEach(() => {
  localStorage.clear();
  vi.mocked(AccountApi.profile).mockResolvedValue(profile);
  vi.mocked(AccountApi.changePassword).mockResolvedValue(undefined);
  vi.mocked(AccountApi.deleteAccount).mockResolvedValue(undefined);
});

describe("SettingsDrawer", () => {
  it("persists appearance controls and displays a read-only profile", async () => {
    const { user } = setup();
    expect(await screen.findByLabelText("Nome")).toHaveAttribute("readonly");
    expect(screen.getByLabelText("E-mail")).toHaveValue(profile.email);
    await user.selectOptions(screen.getByLabelText("Tema"), "dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
    await user.selectOptions(screen.getByLabelText("Tema"), "system");
    await user.selectOptions(screen.getByLabelText("Densidade"), "compact");
    await user.click(screen.getByLabelText("Reduzir movimentos"));
    expect(document.documentElement.dataset.density).toBe("compact");
    expect(JSON.parse(localStorage.getItem("taskflow.preferences")!)).toEqual({ theme: "system", density: "compact", reduceMotion: true });
  });

  it("validates passwords locally and submits only the real API fields", async () => {
    const { user } = setup();
    await user.type(screen.getByLabelText("Senha atual"), "antiga123");
    await user.type(screen.getByLabelText("Nova senha"), "curta");
    await user.type(screen.getByLabelText("Confirmar nova senha"), "curta");
    await user.click(screen.getByRole("button", { name: "Alterar senha" }));
    expect(screen.getByRole("alert")).toHaveTextContent(/8 caracteres/);
    expect(AccountApi.changePassword).not.toHaveBeenCalled();
    await user.clear(screen.getByLabelText("Nova senha"));
    await user.type(screen.getByLabelText("Nova senha"), "nova12345");
    await user.click(screen.getByRole("button", { name: "Alterar senha" }));
    expect(screen.getByRole("alert")).toHaveTextContent(/não coincidem/);
    await user.clear(screen.getByLabelText("Confirmar nova senha"));
    await user.type(screen.getByLabelText("Confirmar nova senha"), "nova12345");
    await user.click(screen.getByRole("button", { name: "Alterar senha" }));
    expect(AccountApi.changePassword).toHaveBeenCalledWith({ senhaAtual: "antiga123", novaSenha: "nova12345" });
    expect(await screen.findByText("Senha alterada com sucesso.")).toBeVisible();
    expect(screen.getByLabelText("Senha atual")).toHaveValue("");
  });

  it("uses the real logout and removes cached private data", async () => {
    const { user, logout, queryClient } = setup();
    await user.click(screen.getByRole("button", { name: "Sair da conta" }));
    await waitFor(() => expect(logout).toHaveBeenCalledOnce());
    expect(queryClient.getQueryData(["private-board"])).toBeUndefined();
  });

  it("requires typed account deletion with a single active modal and clears the session only after success", async () => {
    const { user, logout, queryClient } = setup();
    await user.click(screen.getByRole("button", { name: "Excluir minha conta" }));
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Excluir definitivamente" })).toBeDisabled();
    await user.type(screen.getByLabelText("Digite EXCLUIR para confirmar"), "EXCLUIR");
    vi.mocked(AccountApi.deleteAccount).mockRejectedValueOnce(new Error("Falha ao excluir"));
    await user.click(screen.getByRole("button", { name: "Excluir definitivamente" }));
    expect(await screen.findByText("Falha ao excluir")).toBeVisible();
    expect(logout).not.toHaveBeenCalled();
    expect(queryClient.getQueryData(["private-board"])).toBeDefined();
    await user.click(screen.getByRole("button", { name: "Excluir definitivamente" }));
    await waitFor(() => expect(logout).toHaveBeenCalledOnce());
    expect(queryClient.getQueryData(["private-board"])).toBeUndefined();
  });

  it("returns from deletion on Escape without closing settings", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "Excluir minha conta" }));
    await user.keyboard("{Escape}");
    expect(screen.getByRole("dialog", { name: "Configurações" })).toBeVisible();
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
  });

  it("keeps a pending deletion modal open on Escape and prevents duplicate requests", async () => {
    const { user } = setup();
    let complete!: () => void;
    vi.mocked(AccountApi.deleteAccount).mockReturnValueOnce(new Promise<void>((resolve) => { complete = resolve; }));
    await user.click(screen.getByRole("button", { name: "Excluir minha conta" }));
    await user.type(screen.getByLabelText("Digite EXCLUIR para confirmar"), "EXCLUIR");
    await user.click(screen.getByRole("button", { name: "Excluir definitivamente" }));
    await user.keyboard("{Escape}");
    expect(screen.getByRole("dialog", { name: "Excluir minha conta" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Processando…" })).toBeDisabled();
    expect(AccountApi.deleteAccount).toHaveBeenCalledOnce();
    complete();
    await waitFor(() => expect(screen.queryByRole("button", { name: "Processando…" })).not.toBeInTheDocument());
  });
});
