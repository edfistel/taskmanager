import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { PropsWithChildren } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Atribuicao, Comentario, Subtarefa } from "../../lib/api/types";
import type { JsonTransport } from "../../lib/api/transport";
import { AssigneeSection } from "./AssigneeSection";
import { createAssigneesApi, AssigneesApi } from "./assigneesApi";
import { CommentSection } from "./CommentSection";
import { createCommentsApi, CommentsApi } from "./commentsApi";
import { SubtaskSection } from "./SubtaskSection";
import { createSubtasksApi, SubtasksApi } from "./subtasksApi";

vi.mock("./subtasksApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./subtasksApi")>();
  return {
    ...actual,
    SubtasksApi: {
      list: vi.fn(),
      create: vi.fn(),
      rename: vi.fn(),
      setCompleted: vi.fn(),
      remove: vi.fn(),
    },
  };
});

vi.mock("./commentsApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./commentsApi")>();
  return {
    ...actual,
    CommentsApi: {
      list: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
    },
  };
});

vi.mock("./assigneesApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./assigneesApi")>();
  return {
    ...actual,
    AssigneesApi: {
      list: vi.fn(),
      addByEmail: vi.fn(),
      remove: vi.fn(),
    },
  };
});

const subtasks: Subtarefa[] = [
  { id: 1, tarefaId: 19, titulo: "Revisar conteúdo", concluida: true },
  { id: 2, tarefaId: 19, titulo: "Otimizar imagens", concluida: false },
];

const comments: Comentario[] = [
  {
    id: 11,
    tarefaId: 19,
    texto: "A primeira revisão está pronta.",
    criadoEm: "2026-10-29T12:00:00.000Z",
    usuarioId: 7,
    usuario: { id: 7, nome: "Klaus" },
  },
  {
    id: 12,
    tarefaId: 19,
    texto: "Vou validar no tablet.",
    criadoEm: "2026-10-29T12:30:00.000Z",
    usuarioId: 8,
    usuario: { id: 8, nome: "Marina" },
  },
];

const assignees: Atribuicao[] = [
  {
    id: 31,
    tarefaId: 19,
    atribuidoEm: "2026-10-29T11:00:00.000Z",
    usuario: { id: 8, nome: "Marina Costa", email: "marina@dominio.com" },
  },
];

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false },
    },
  });

  function Wrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  return Wrapper;
}

describe("adaptadores das relações da tarefa", () => {
  it("envia cada ação para a rota e o corpo definidos pelo backend", async () => {
    const transport = vi.fn(async () => ({})) as unknown as JsonTransport;
    const subtasksApi = createSubtasksApi(transport);
    const commentsApi = createCommentsApi(transport);
    const assigneesApi = createAssigneesApi(transport);

    await subtasksApi.create(19, "Revisar conteúdo");
    await subtasksApi.rename(1, "Revisar textos finais");
    await subtasksApi.setCompleted(1, false);
    await commentsApi.create(19, "Conteúdo revisado.");
    await commentsApi.update(11, "Conteúdo e imagens revisados.");
    await assigneesApi.addByEmail(19, "marina@dominio.com");
    await assigneesApi.remove(19, 8);

    expect(transport).toHaveBeenNthCalledWith(1, "/tarefas/19/subtarefas", {
      method: "POST",
      json: { titulo: "Revisar conteúdo" },
    });
    expect(transport).toHaveBeenNthCalledWith(2, "/subtarefas/1", {
      method: "PUT",
      json: { titulo: "Revisar textos finais" },
    });
    expect(transport).toHaveBeenNthCalledWith(3, "/subtarefas/1/concluir", {
      method: "PATCH",
      json: { concluida: false },
    });
    expect(transport).toHaveBeenNthCalledWith(4, "/tarefas/19/comentarios", {
      method: "POST",
      json: { texto: "Conteúdo revisado." },
    });
    expect(transport).toHaveBeenNthCalledWith(5, "/comentarios/11", {
      method: "PUT",
      json: { texto: "Conteúdo e imagens revisados." },
    });
    expect(transport).toHaveBeenNthCalledWith(6, "/tarefas/19/atribuicoes", {
      method: "POST",
      json: { email: "marina@dominio.com" },
    });
    expect(transport).toHaveBeenNthCalledWith(7, "/tarefas/19/atribuicoes/8", {
      method: "DELETE",
    });
  });
});

describe("seções independentes da tarefa", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(SubtasksApi.list).mockResolvedValue(subtasks);
    vi.mocked(CommentsApi.list).mockResolvedValue(comments);
    vi.mocked(AssigneesApi.list).mockResolvedValue(assignees);
  });

  it("mantém subtarefas e responsáveis disponíveis quando comentários falham", async () => {
    vi.mocked(CommentsApi.list).mockRejectedValue(new Error("Comentários indisponíveis"));
    const Wrapper = createWrapper();

    render(
      <>
        <SubtaskSection mode="owner" taskId={19} />
        <CommentSection currentUserId={7} mode="owner" taskId={19} />
        <AssigneeSection mode="owner" taskId={19} />
      </>,
      { wrapper: Wrapper },
    );

    expect(await screen.findByText("Revisar conteúdo")).toBeVisible();
    expect(screen.getByText("1 de 2 concluídas")).toBeVisible();
    expect(await screen.findByText("Marina Costa")).toBeVisible();
    expect(await screen.findByRole("alert", { name: /comentários indisponíveis/i })).toBeVisible();
  });

  it("permite ao proprietário administrar subtarefas e responsáveis por e-mail exato", async () => {
    const user = userEvent.setup();
    const created: Subtarefa = { id: 3, tarefaId: 19, titulo: "Publicar", concluida: false };
    const added: Atribuicao = {
      id: 32,
      tarefaId: 19,
      atribuidoEm: "2026-10-29T13:00:00.000Z",
      usuario: { id: 9, nome: "Rafael Lima", email: "rafael@dominio.com" },
    };
    vi.mocked(SubtasksApi.create).mockResolvedValue(created);
    vi.mocked(SubtasksApi.rename).mockResolvedValue({ ...subtasks[1], titulo: "Comprimir imagens" });
    vi.mocked(SubtasksApi.remove).mockResolvedValue(undefined);
    vi.mocked(AssigneesApi.addByEmail).mockResolvedValue(added);
    vi.mocked(AssigneesApi.remove).mockResolvedValue(undefined);
    const Wrapper = createWrapper();

    render(
      <>
        <SubtaskSection mode="owner" taskId={19} />
        <AssigneeSection mode="owner" taskId={19} />
      </>,
      { wrapper: Wrapper },
    );

    await user.type(await screen.findByLabelText(/nova subtarefa/i), "Publicar");
    await user.click(screen.getByRole("button", { name: /adicionar subtarefa/i }));
    await waitFor(() => expect(SubtasksApi.create).toHaveBeenCalledWith(19, "Publicar"));
    expect(await screen.findByText("Publicar")).toBeVisible();

    await user.click(screen.getByRole("button", { name: /renomear otimizar imagens/i }));
    const renameInput = screen.getByLabelText(/novo título de otimizar imagens/i);
    await user.clear(renameInput);
    await user.type(renameInput, "Comprimir imagens");
    await user.click(screen.getByRole("button", { name: /salvar renomeação/i }));
    await waitFor(() => expect(SubtasksApi.rename).toHaveBeenCalledWith(2, "Comprimir imagens"));
    await user.click(await screen.findByRole("button", { name: /excluir comprimir imagens/i }));
    expect(SubtasksApi.remove).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: /confirmar exclusão/i }));
    await waitFor(() => expect(SubtasksApi.remove).toHaveBeenCalledWith(2));
    expect(screen.queryByText("Comprimir imagens")).not.toBeInTheDocument();

    await user.type(screen.getByLabelText(/e-mail do responsável/i), "rafael@dominio.com");
    await user.click(screen.getByRole("button", { name: /adicionar responsável/i }));
    await waitFor(() => expect(AssigneesApi.addByEmail).toHaveBeenCalledWith(19, "rafael@dominio.com"));
    expect(await screen.findByText("Rafael Lima")).toBeVisible();

    await user.click(screen.getByRole("button", { name: /remover marina costa/i }));
    await waitFor(() => expect(AssigneesApi.remove).toHaveBeenCalledWith(19, 8));
  });

  it("limita o colaborador a marcar subtarefas e gerenciar apenas seus comentários", async () => {
    const user = userEvent.setup();
    vi.mocked(SubtasksApi.setCompleted).mockResolvedValue({ ...subtasks[1], concluida: true });
    vi.mocked(CommentsApi.create).mockResolvedValue({
      id: 13,
      tarefaId: 19,
      texto: "Teste concluído.",
      criadoEm: "2026-10-29T13:30:00.000Z",
      usuarioId: 7,
      usuario: { id: 7, nome: "Klaus" },
    });
    vi.mocked(CommentsApi.update).mockResolvedValue({ ...comments[0], texto: "Revisão final pronta." });
    vi.mocked(CommentsApi.remove).mockResolvedValue(undefined);
    const Wrapper = createWrapper();

    render(
      <>
        <SubtaskSection mode="collaborator" taskId={19} />
        <CommentSection currentUserId={7} mode="collaborator" taskId={19} />
        <AssigneeSection mode="collaborator" taskId={19} />
      </>,
      { wrapper: Wrapper },
    );

    await user.click(await screen.findByRole("checkbox", { name: /marcar otimizar imagens como concluída/i }));
    await waitFor(() => expect(SubtasksApi.setCompleted).toHaveBeenCalledWith(2, true));
    expect(screen.queryByLabelText(/nova subtarefa/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /renomear otimizar imagens/i })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/e-mail do responsável/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /remover marina costa/i })).not.toBeInTheDocument();

    await user.type(screen.getByLabelText(/escrever comentário/i), "Teste concluído.");
    await user.click(screen.getByRole("button", { name: /^comentar$/i }));
    await waitFor(() => expect(CommentsApi.create).toHaveBeenCalledWith(19, "Teste concluído."));

    const ownComment = screen.getByText("A primeira revisão está pronta.").closest("li");
    const otherComment = screen.getByText("Vou validar no tablet.").closest("li");
    expect(ownComment).not.toBeNull();
    expect(otherComment).not.toBeNull();
    expect(within(ownComment!).getByRole("button", { name: /editar comentário de klaus/i })).toBeInTheDocument();
    expect(within(otherComment!).queryByRole("button", { name: /editar comentário de marina/i })).not.toBeInTheDocument();
    expect(within(otherComment!).queryByRole("button", { name: /excluir comentário de marina/i })).not.toBeInTheDocument();

    await user.click(within(ownComment!).getByRole("button", { name: /editar comentário de klaus/i }));
    const edit = screen.getByRole("textbox", { name: /^editar comentário$/i });
    await user.clear(edit);
    await user.type(edit, "Revisão final pronta.");
    await user.click(screen.getByRole("button", { name: /salvar comentário/i }));
    await waitFor(() => expect(CommentsApi.update).toHaveBeenCalledWith(11, "Revisão final pronta."));
    const updatedOwnComment = (await screen.findByText("Revisão final pronta.")).closest("li");
    await user.click(within(updatedOwnComment!).getByRole("button", { name: /excluir comentário de klaus/i }));
    expect(CommentsApi.remove).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: /confirmar exclusão/i }));
    await waitFor(() => expect(CommentsApi.remove).toHaveBeenCalledWith(11));
    expect(screen.queryByText("Revisão final pronta.")).not.toBeInTheDocument();
  });

  it("permite ao proprietário moderar comentários sem editar o texto de outro autor", async () => {
    const user = userEvent.setup();
    vi.mocked(CommentsApi.remove).mockResolvedValue(undefined);
    const Wrapper = createWrapper();
    render(<CommentSection currentUserId={7} mode="owner" taskId={19} />, { wrapper: Wrapper });

    const otherComment = (await screen.findByText("Vou validar no tablet.")).closest("li");
    expect(otherComment).not.toBeNull();
    expect(within(otherComment!).getByRole("button", { name: /excluir comentário de marina/i })).toBeInTheDocument();
    expect(within(otherComment!).queryByRole("button", { name: /editar comentário de marina/i })).not.toBeInTheDocument();
    await user.click(within(otherComment!).getByRole("button", { name: /excluir comentário de marina/i }));
    expect(CommentsApi.remove).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: /confirmar exclusão/i }));
    await waitFor(() => expect(CommentsApi.remove).toHaveBeenCalledWith(12));
    expect(screen.queryByText("Vou validar no tablet.")).not.toBeInTheDocument();
  });

  it("cancela exclusões compactas sem remover subtarefas ou comentários", async () => {
    const user = userEvent.setup();
    const Wrapper = createWrapper();
    render(
      <>
        <SubtaskSection mode="owner" taskId={19} />
        <CommentSection currentUserId={7} mode="owner" taskId={19} />
      </>,
      { wrapper: Wrapper },
    );

    const deleteSubtask = await screen.findByRole("button", { name: /excluir otimizar imagens/i });
    await user.click(deleteSubtask);
    await user.click(screen.getByRole("button", { name: /cancelar exclusão/i }));
    expect(screen.queryByRole("button", { name: /confirmar exclusão/i })).not.toBeInTheDocument();
    expect(deleteSubtask).toHaveFocus();
    expect(screen.getByText("Otimizar imagens")).toBeVisible();
    expect(SubtasksApi.remove).not.toHaveBeenCalled();

    const deleteComment = screen.getByRole("button", { name: /excluir comentário de marina/i });
    await user.click(deleteComment);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("button", { name: /confirmar exclusão/i })).not.toBeInTheDocument();
    expect(deleteComment).toHaveFocus();
    expect(screen.getByText("Vou validar no tablet.")).toBeVisible();
    expect(CommentsApi.remove).not.toHaveBeenCalled();
  });

  it("bloqueia exclusão duplicada enquanto aguarda e permite tentar novamente após erro", async () => {
    const user = userEvent.setup();
    let rejectRemoval!: (error: Error) => void;
    vi.mocked(CommentsApi.remove).mockImplementationOnce(() => new Promise<void>((_, reject) => {
      rejectRemoval = reject;
    })).mockResolvedValue(undefined);
    const Wrapper = createWrapper();
    render(<CommentSection currentUserId={7} mode="owner" taskId={19} />, { wrapper: Wrapper });

    await user.click(await screen.findByRole("button", { name: /excluir comentário de marina/i }));
    await user.click(screen.getByRole("button", { name: /confirmar exclusão/i }));
    expect(screen.getByRole("button", { name: /excluindo/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /cancelar exclusão/i })).toBeDisabled();
    expect(screen.getByText("Vou validar no tablet.")).toBeVisible();

    rejectRemoval(new Error("Não foi possível excluir agora."));
    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível excluir agora.");
    await user.click(screen.getByRole("button", { name: /confirmar exclusão/i }));
    await waitFor(() => expect(screen.queryByText("Vou validar no tablet.")).not.toBeInTheDocument());
    expect(CommentsApi.remove).toHaveBeenCalledTimes(2);
  });

  it.each([
    "Nenhum usuário cadastrado com este e-mail",
    "Este usuário já está atribuído à tarefa",
  ])("mostra o erro do backend ao atribuir por e-mail: %s", async (message) => {
    const user = userEvent.setup();
    vi.mocked(AssigneesApi.addByEmail).mockRejectedValue(new Error(message));
    const Wrapper = createWrapper();
    render(<AssigneeSection mode="owner" taskId={19} />, { wrapper: Wrapper });

    await user.type(await screen.findByLabelText(/e-mail do responsável/i), "pessoa@dominio.com");
    await user.click(screen.getByRole("button", { name: /adicionar responsável/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(message);
  });
});
