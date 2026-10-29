import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ToastProvider } from "../../components/feedback/ToastProvider";
import type { ListaComTarefas, Quadro } from "../../lib/api/types";
import { AuthContext } from "../../lib/auth/AuthProvider";
import { BoardsApi } from "../dashboard/boardsApi";
import { TasksApi } from "../tasks/tasksApi";
import { BoardApi } from "./boardApi";
import { BoardPage } from "./BoardPage";

vi.mock("../dashboard/boardsApi", () => ({
  BoardsApi: { get: vi.fn() },
}));

vi.mock("./boardApi", () => ({
  BoardApi: {
    listLists: vi.fn(),
    createList: vi.fn(),
    renameList: vi.fn(),
    moveList: vi.fn(),
    removeList: vi.fn(),
  },
}));

vi.mock("../tasks/tasksApi", () => ({
  TasksApi: {
    create: vi.fn(),
    remove: vi.fn(),
  },
}));

const board: Quadro = {
  id: 7,
  nome: "Portal Corporativo",
  descricao: "Lançamento do novo portal",
  criadoEm: "2026-10-20T12:00:00.000Z",
};

function list(id: number, nome: string, posicao: number, tasks = 0): ListaComTarefas {
  return {
    id,
    nome,
    posicao,
    quadroId: 7,
    tarefas: Array.from({ length: tasks }, (_, index) => ({
      id: id * 100 + index,
      titulo: `Tarefa ${index + 1}`,
      prazo: null,
      posicao: index,
      status: "A_FAZER" as const,
    })),
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

function renderBoard() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false },
    },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider
        value={{
          status: "authenticated",
          user: { id: 1, nome: "Klaus Wolff", email: "klaus@dominio.com" },
          login: vi.fn(),
          register: vi.fn(),
          logout: vi.fn(),
        }}
      >
        <ToastProvider>
          <MemoryRouter initialEntries={["/quadros/7"]}>
            <Routes>
              <Route element={<BoardPage />} path="/quadros/:quadroId" />
            </Routes>
          </MemoryRouter>
        </ToastProvider>
      </AuthContext.Provider>
    </QueryClientProvider>,
  );

  return queryClient;
}

describe("BoardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(BoardsApi.get).mockResolvedValue(board);
    vi.mocked(BoardApi.listLists).mockResolvedValue([
      list(1, "A Fazer", 0),
      list(2, "Em Andamento", 1),
    ]);
    vi.mocked(BoardApi.createList).mockResolvedValue(list(3, "Revisão", 2));
    vi.mocked(BoardApi.renameList).mockResolvedValue(list(1, "Backlog", 0));
    vi.mocked(BoardApi.moveList).mockResolvedValue(list(1, "A Fazer", 1));
    vi.mocked(BoardApi.removeList).mockResolvedValue(undefined);
    vi.mocked(TasksApi.create).mockResolvedValue({
      id: 99,
      titulo: "Nova tarefa",
      descricao: null,
      prazo: null,
      posicao: 0,
      status: "A_FAZER",
      listaId: 1,
    });
    vi.mocked(TasksApi.remove).mockResolvedValue(undefined);
  });

  it("starts board metadata and list loading in parallel", async () => {
    const boardRequest = deferred<Quadro>();
    const listRequest = deferred<ListaComTarefas[]>();
    vi.mocked(BoardsApi.get).mockReturnValue(boardRequest.promise);
    vi.mocked(BoardApi.listLists).mockReturnValue(listRequest.promise);

    renderBoard();

    expect(BoardsApi.get).toHaveBeenCalledWith(7);
    expect(BoardApi.listLists).toHaveBeenCalledWith(7);

    boardRequest.resolve(board);
    expect(await screen.findByRole("heading", { name: board.nome, level: 1 })).toBeVisible();
    expect(screen.getByText("Visão do projeto")).toBeVisible();
    expect(screen.queryByText("Quadro Kanban")).not.toBeInTheDocument();
    listRequest.resolve([list(1, "A Fazer", 0)]);
    expect(await screen.findByRole("heading", { name: "A Fazer", level: 2 })).toBeVisible();
  });

  it("renders columns ordered by backend position", async () => {
    vi.mocked(BoardApi.listLists).mockResolvedValue([
      list(3, "Concluído", 2),
      list(1, "A Fazer", 0, 2),
      list(2, "Em Andamento", 1, 1),
    ]);

    renderBoard();

    const columns = await screen.findByRole("region", { name: /listas do quadro/i });
    expect(
      within(columns).getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent),
    ).toEqual(["A Fazer", "Em Andamento", "Concluído"]);
    expect(within(columns).getByText("2 tarefas")).toBeVisible();
  });

  it("creates a new list from the composer at the end", async () => {
    const user = userEvent.setup();
    renderBoard();

    await user.click(await screen.findByRole("button", { name: /adicionar lista/i }));
    await user.type(screen.getByLabelText(/nome da nova lista/i), "Revisão");
    await user.click(screen.getByRole("button", { name: /^criar lista$/i }));

    await waitFor(() => expect(BoardApi.createList).toHaveBeenCalledWith(7, "Revisão"));
  });

  it("renames a list through its action menu", async () => {
    const user = userEvent.setup();
    renderBoard();

    await user.click(await screen.findByRole("button", { name: /opções da lista a fazer/i }));
    await user.click(screen.getByRole("menuitem", { name: /renomear lista/i }));
    const input = screen.getByLabelText(/novo nome da lista/i);
    await user.clear(input);
    await user.type(input, "Backlog");
    await user.click(screen.getByRole("button", { name: /salvar nome/i }));

    await waitFor(() => expect(BoardApi.renameList).toHaveBeenCalledWith(1, "Backlog"));
  });

  it("warns about task cascade before deleting a list", async () => {
    const user = userEvent.setup();
    renderBoard();

    await user.click(await screen.findByRole("button", { name: /opções da lista a fazer/i }));
    await user.click(screen.getByRole("menuitem", { name: /excluir lista/i }));

    const dialog = screen.getByRole("dialog", { name: /excluir lista a fazer/i });
    expect(within(dialog).getByText(/todas as tarefas desta lista também serão excluídas/i)).toBeVisible();
    await user.click(within(dialog).getByRole("button", { name: /^excluir lista$/i }));

    await waitFor(() => expect(BoardApi.removeList).toHaveBeenCalledWith(1));
  });

  it("prevents deleting the last list and explains the backend rule", async () => {
    const user = userEvent.setup();
    vi.mocked(BoardApi.listLists).mockResolvedValue([list(1, "A Fazer", 0)]);
    renderBoard();

    await user.click(await screen.findByRole("button", { name: /opções da lista a fazer/i }));

    expect(screen.getByRole("menuitem", { name: /excluir lista/i })).toBeDisabled();
    expect(screen.getByText("O quadro precisa ter ao menos uma lista")).toBeVisible();
  });

  it("creates a task in the selected list with backend-supported fields", async () => {
    const user = userEvent.setup();
    renderBoard();

    const firstColumn = (await screen.findByRole("heading", { name: "A Fazer" })).closest("article");
    expect(firstColumn).not.toBeNull();
    await user.click(within(firstColumn!).getByRole("button", { name: /adicionar tarefa/i }));
    await user.type(screen.getByLabelText(/título da tarefa/i), "Nova tarefa");
    await user.click(screen.getByRole("button", { name: /^criar tarefa$/i }));

    await waitFor(() => expect(TasksApi.create).toHaveBeenCalledWith(1, {
      titulo: "Nova tarefa",
      descricao: null,
      prazo: null,
      status: "A_FAZER",
    }));
  });

  it("deletes a task only after the cascade warning is confirmed", async () => {
    const user = userEvent.setup();
    vi.mocked(BoardApi.listLists).mockResolvedValue([
      list(1, "A Fazer", 0, 1),
      list(2, "Em Andamento", 1),
    ]);
    renderBoard();

    await user.click(await screen.findByRole("button", { name: /opções da tarefa tarefa 1/i }));
    await user.click(screen.getByRole("menuitem", { name: /excluir tarefa/i }));
    const dialog = screen.getByRole("dialog", { name: /excluir tarefa tarefa 1/i });
    await user.click(within(dialog).getByRole("button", { name: /^excluir tarefa$/i }));

    await waitFor(() => expect(TasksApi.remove).toHaveBeenCalledWith(100));
  });
});
