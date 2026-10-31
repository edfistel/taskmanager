import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { ToastProvider } from "../../components/feedback/ToastProvider";
import type { TarefaDetalhe } from "../../lib/api/types";
import { AuthContext } from "../../lib/auth/AuthProvider";
import { AssigneesApi } from "./assigneesApi";
import { CommentsApi } from "./commentsApi";
import { SubtasksApi } from "./subtasksApi";
import { TaskDetailsDrawer } from "./TaskDetailsDrawer";
import { TasksApi } from "./tasksApi";

vi.mock("./tasksApi", () => ({
  TasksApi: {
    get: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

vi.mock("./subtasksApi", () => ({
  SubtasksApi: {
    list: vi.fn(), create: vi.fn(), rename: vi.fn(), setCompleted: vi.fn(), remove: vi.fn(),
  },
}));

vi.mock("./commentsApi", () => ({
  CommentsApi: {
    list: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn(),
  },
}));

vi.mock("./assigneesApi", () => ({
  AssigneesApi: {
    list: vi.fn(), addByEmail: vi.fn(), remove: vi.fn(),
  },
}));

const detail: TarefaDetalhe = {
  id: 19,
  titulo: "Publicar página inicial",
  descricao: "Validar conteúdo e imagens finais.",
  prazo: "2026-11-02T00:00:00.000Z",
  posicao: 0,
  status: "EM_ANDAMENTO",
  listaId: 4,
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false },
    },
  });

  function Wrapper({ children }: React.PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={{
          status: "authenticated",
          user: { id: 7, nome: "Klaus", email: "klaus@dominio.com" },
          login: async () => ({ id: 7, nome: "Klaus", email: "klaus@dominio.com" }),
          register: async () => ({ id: 7, nome: "Klaus", email: "klaus@dominio.com" }),
          logout: async () => undefined,
        }}>
          <ToastProvider>{children}</ToastProvider>
        </AuthContext.Provider>
      </QueryClientProvider>
    );
  }

  return { Wrapper, queryClient };
}

describe("TaskDetailsDrawer", () => {
  it("shows only the known assignment summary to a collaborator without fetching owner details", async () => {
    const { Wrapper } = createWrapper();
    render(<TaskDetailsDrawer mode="collaborator" taskId={19} summary={{ titulo: "Publicar página inicial", status: "EM_ANDAMENTO", prazo: "2026-11-02" }} onClose={() => undefined} />, { wrapper: Wrapper });
    expect(await screen.findByText("Publicar página inicial")).toBeVisible();
    expect(screen.getByText("02/11/2026")).toBeVisible();
    expect(screen.queryByLabelText("Título da tarefa")).not.toBeInTheDocument();
    expect(TasksApi.get).not.toHaveBeenCalled();
  });
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(TasksApi.get).mockResolvedValue(detail);
    vi.mocked(TasksApi.update).mockResolvedValue(detail);
    vi.mocked(TasksApi.remove).mockResolvedValue(undefined);
    vi.mocked(SubtasksApi.list).mockResolvedValue([]);
    vi.mocked(CommentsApi.list).mockResolvedValue([]);
    vi.mocked(AssigneesApi.list).mockResolvedValue([]);
  });

  it("loads full details only after a card opens and keeps relation sections independent", async () => {
    const { Wrapper } = createWrapper();
    const { rerender } = render(
      <TaskDetailsDrawer mode="owner" onClose={vi.fn()} taskId={null} />,
      { wrapper: Wrapper },
    );

    expect(TasksApi.get).not.toHaveBeenCalled();
    expect(SubtasksApi.list).not.toHaveBeenCalled();
    expect(CommentsApi.list).not.toHaveBeenCalled();
    expect(AssigneesApi.list).not.toHaveBeenCalled();
    rerender(<TaskDetailsDrawer mode="owner" onClose={vi.fn()} taskId={19} />);

    expect(await screen.findByDisplayValue("Publicar página inicial")).toBeVisible();
    expect(screen.getByDisplayValue("Validar conteúdo e imagens finais.")).toBeVisible();
    expect(screen.getByDisplayValue("2026-11-02")).toBeVisible();
    expect(screen.getByLabelText(/status da tarefa/i)).toHaveValue("EM_ANDAMENTO");
    expect(TasksApi.get).toHaveBeenCalledWith(19);
    expect(SubtasksApi.list).toHaveBeenCalledWith(19);
    expect(CommentsApi.list).toHaveBeenCalledWith(19);
    expect(AssigneesApi.list).toHaveBeenCalledWith(19);
    expect(screen.getByRole("heading", { name: "Subtarefas" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Comentários" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Responsáveis" })).toBeVisible();
  });

  it("updates only changed owner fields, including explicit status and cleared deadline", async () => {
    const user = userEvent.setup();
    const updated = {
      ...detail,
      titulo: "Publicar nova página inicial",
      prazo: null,
      status: "CONCLUIDO" as const,
    };
    vi.mocked(TasksApi.update).mockResolvedValue(updated);
    const { Wrapper } = createWrapper();
    render(<TaskDetailsDrawer mode="owner" onClose={vi.fn()} taskId={19} />, { wrapper: Wrapper });

    const title = await screen.findByLabelText(/título da tarefa/i);
    await user.clear(title);
    await user.type(title, "Publicar nova página inicial");
    await user.selectOptions(screen.getByLabelText(/status da tarefa/i), "CONCLUIDO");
    await user.clear(screen.getByLabelText(/prazo da tarefa/i));
    await user.click(screen.getByRole("button", { name: /salvar alterações/i }));

    await waitFor(() => expect(TasksApi.update).toHaveBeenCalledWith(19, {
      titulo: "Publicar nova página inicial",
      prazo: null,
      status: "CONCLUIDO",
    }));
  });

  it("deletes from the owner drawer only after cascade confirmation", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const { Wrapper } = createWrapper();
    render(<TaskDetailsDrawer mode="owner" onClose={onClose} taskId={19} />, { wrapper: Wrapper });

    await user.click(await screen.findByRole("button", { name: /excluir tarefa/i }));
    const dialog = screen.getByRole("dialog", { name: /excluir tarefa publicar página inicial/i });
    expect(within(dialog).getByText(/subtarefas, comentários e responsáveis/i)).toBeVisible();
    await user.click(within(dialog).getByRole("button", { name: /^excluir tarefa$/i }));

    await waitFor(() => expect(TasksApi.remove).toHaveBeenCalledWith(19));
    expect(onClose).toHaveBeenCalled();
  });
});
