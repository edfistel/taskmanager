import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ToastProvider } from "../../components/feedback/ToastProvider";
import type { Quadro, QuadroCriado } from "../../lib/api/types";
import { BoardsApi } from "./boardsApi";
import { DashboardPage } from "./DashboardPage";

vi.mock("./boardsApi", () => ({
  BoardsApi: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

const alpha: Quadro = {
  id: 11,
  nome: "Projeto Alpha",
  descricao: "Lançamento do novo portal",
  criadoEm: "2026-10-20T12:00:00.000Z",
};

const beta: Quadro = {
  id: 22,
  nome: "Operação Beta",
  descricao: null,
  criadoEm: "2026-10-21T12:00:00.000Z",
};

function renderDashboard() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false },
    },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  );

  return queryClient;
}

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(BoardsApi.list).mockResolvedValue([]);
    vi.mocked(BoardsApi.create).mockResolvedValue({} as QuadroCriado);
    vi.mocked(BoardsApi.update).mockResolvedValue(alpha);
    vi.mocked(BoardsApi.remove).mockResolvedValue(undefined);
  });

  it("shows a lightweight loading skeleton while boards are requested", () => {
    vi.mocked(BoardsApi.list).mockReturnValue(new Promise(() => undefined));

    renderDashboard();

    expect(screen.getByRole("status", { name: /carregando quadros/i })).toBeVisible();
  });

  it("offers a retry after a board request fails", async () => {
    const user = userEvent.setup();
    vi.mocked(BoardsApi.list)
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce([]);

    renderDashboard();

    expect(await screen.findByText(/não foi possível carregar seus quadros/i)).toBeVisible();
    await user.click(screen.getByRole("button", { name: /tentar novamente/i }));

    expect(await screen.findByRole("button", { name: /criar primeiro quadro/i })).toBeVisible();
    expect(BoardsApi.list).toHaveBeenCalledTimes(2);
  });

  it("renders an honest board grid and filters it locally", async () => {
    const user = userEvent.setup();
    vi.mocked(BoardsApi.list).mockResolvedValue([alpha, beta]);

    renderDashboard();

    expect(await screen.findByRole("heading", { name: "Projeto Alpha" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Operação Beta" })).toBeVisible();
    expect(screen.queryByText(/tarefas no quadro/i)).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /atribuídas a mim/i })).toBeVisible();

    await user.type(screen.getByRole("searchbox", { name: /buscar quadros/i }), "alpha");

    expect(screen.getByRole("heading", { name: "Projeto Alpha" })).toBeVisible();
    expect(screen.queryByRole("heading", { name: "Operação Beta" })).not.toBeInTheDocument();
    expect(BoardsApi.list).toHaveBeenCalledTimes(1);
  });

  it("creates a board with the backend-supported fields", async () => {
    const user = userEvent.setup();
    vi.mocked(BoardsApi.create).mockResolvedValue({
      ...alpha,
      nome: "Projeto Website",
      descricao: "Novo site institucional",
      listas: [{ id: 1, nome: "A Fazer", posicao: 0 }],
    });

    renderDashboard();

    await user.click(await screen.findByRole("button", { name: /criar primeiro quadro/i }));
    expect(screen.getByText(/lista “A Fazer” será criada automaticamente/i)).toBeVisible();
    await user.type(screen.getByLabelText(/nome do quadro/i), "Projeto Website");
    await user.type(screen.getByLabelText(/descrição.*opcional/i), "Novo site institucional");
    await user.click(screen.getByRole("button", { name: /^criar quadro$/i }));

    await waitFor(() => {
      expect(BoardsApi.create).toHaveBeenCalledWith({
        nome: "Projeto Website",
        descricao: "Novo site institucional",
      });
    });
    expect(screen.queryByRole("dialog", { name: /novo quadro/i })).not.toBeInTheDocument();
  });

  it("updates a board from its card actions", async () => {
    const user = userEvent.setup();
    vi.mocked(BoardsApi.list).mockResolvedValue([alpha]);
    vi.mocked(BoardsApi.update).mockResolvedValue({
      ...alpha,
      nome: "Projeto Renovado",
      descricao: null,
    });

    renderDashboard();

    await user.click(await screen.findByRole("button", { name: /editar projeto alpha/i }));
    const nameInput = screen.getByLabelText(/nome do quadro/i);
    await user.clear(nameInput);
    await user.type(nameInput, "Projeto Renovado");
    await user.clear(screen.getByLabelText(/descrição.*opcional/i));
    await user.click(screen.getByRole("button", { name: /salvar alterações/i }));

    await waitFor(() => {
      expect(BoardsApi.update).toHaveBeenCalledWith(11, {
        nome: "Projeto Renovado",
        descricao: null,
      });
    });
  });

  it("requires the exact board name before deletion", async () => {
    const user = userEvent.setup();
    vi.mocked(BoardsApi.list).mockResolvedValue([alpha]);

    renderDashboard();

    await user.click(await screen.findByRole("button", { name: /excluir projeto alpha/i }));
    const confirmButton = screen.getByRole("button", { name: /excluir quadro/i });
    expect(confirmButton).toBeDisabled();

    await user.type(
      screen.getByLabelText(/digite projeto alpha para confirmar/i),
      "Projeto Website",
    );
    expect(confirmButton).toBeDisabled();
    await user.clear(screen.getByLabelText(/digite projeto alpha para confirmar/i));
    await user.type(screen.getByLabelText(/digite projeto alpha para confirmar/i), "Projeto Alpha");
    expect(confirmButton).toBeEnabled();
    await user.click(confirmButton);

    await waitFor(() => expect(BoardsApi.remove).toHaveBeenCalledWith(11));
  });
});
