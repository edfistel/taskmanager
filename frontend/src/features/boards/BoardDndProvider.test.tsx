import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ToastProvider } from "../../components/feedback/ToastProvider";
import { queryKeys } from "../../lib/api/queryKeys";
import type { ListaComTarefas } from "../../lib/api/types";
import { TasksApi } from "../tasks/tasksApi";
import { BoardDndProvider, type BoardDndActions } from "./BoardDndProvider";
import { MoveTaskMenu } from "./MoveTaskMenu";

vi.mock("../tasks/tasksApi", () => ({
  TasksApi: { move: vi.fn() },
}));

vi.mock("./boardApi", () => ({
  BoardApi: { moveList: vi.fn() },
}));

function lists(): ListaComTarefas[] {
  return [
    {
      id: 1,
      nome: "A Fazer",
      posicao: 0,
      quadroId: 7,
      tarefas: [
        { id: 11, titulo: "Revisar contrato", prazo: null, posicao: 0, status: "A_FAZER" },
      ],
    },
    { id: 2, nome: "Em Andamento", posicao: 1, quadroId: 7, tarefas: [] },
  ];
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}

describe("BoardDndProvider", () => {
  it("keeps a dedicated drag preview layer mounted for stable visual feedback", () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <BoardDndProvider boardId={7} lists={lists()}>
            <div>Conteúdo do quadro</div>
          </BoardDndProvider>
        </ToastProvider>
      </QueryClientProvider>,
    );

    expect(container.querySelector("[data-dnd-overlay]")).toBeInTheDocument();
  });

  it("optimistically moves a task and restores the snapshot after an API error", async () => {
    const user = userEvent.setup();
    const request = deferred<never>();
    vi.mocked(TasksApi.move).mockReturnValue(request.promise);
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const snapshotBeforeDrag = lists();
    queryClient.setQueryData(queryKeys.lists(7), snapshotBeforeDrag);

    render(
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <BoardDndProvider boardId={7} lists={snapshotBeforeDrag}>
            {(actions) => {
              const renderedLists = (actions as BoardDndActions & { lists?: ListaComTarefas[] }).lists ?? [];
              return (
                <>
                  <span data-testid="destination-tasks">
                    {renderedLists[1]?.tarefas.map((task) => task.id).join(",") || "vazia"}
                  </span>
                  <button
                    onClick={() => void actions.moveTask({
                      taskId: 11,
                      fromListId: 1,
                      toListId: 2,
                      toIndex: 0,
                    }).catch(() => undefined)}
                    type="button"
                  >
                    Mover agora
                  </button>
                </>
              );
            }}
          </BoardDndProvider>
        </ToastProvider>
      </QueryClientProvider>,
    );

    await user.click(screen.getByRole("button", { name: /mover agora/i }));
    await waitFor(() => expect(screen.getByTestId("destination-tasks")).toHaveTextContent("11"));
    expect(TasksApi.move).toHaveBeenCalledWith(11, { listaId: 2, posicao: 0 });

    request.reject(new Error("Falha simulada"));
    await waitFor(() => expect(screen.getByTestId("destination-tasks")).toHaveTextContent("vazia"));
    expect(queryClient.getQueryData(queryKeys.lists(7))).toEqual(snapshotBeforeDrag);
  });

  it("groups task actions in one menu and keeps the keyboard-friendly move fallback", async () => {
    const user = userEvent.setup();
    const onMove = vi.fn().mockResolvedValue(undefined);
    const onOpen = vi.fn();
    const onDelete = vi.fn();
    const onOpenChange = vi.fn();
    const state = lists();

    render(
      <MoveTaskMenu
        lists={state}
        onDelete={onDelete}
        onMove={onMove}
        onOpen={onOpen}
        onOpenChange={onOpenChange}
        task={state[0].tarefas[0]}
      />,
    );

    expect(screen.queryByRole("button", { name: /mover tarefa revisar contrato/i })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /opções da tarefa revisar contrato/i }));
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    await user.click(screen.getByRole("menuitem", { name: /abrir detalhes/i }));
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(onOpen).toHaveBeenCalledWith(state[0].tarefas[0]);

    await user.click(screen.getByRole("button", { name: /opções da tarefa revisar contrato/i }));
    await user.click(screen.getByRole("menuitem", { name: /mover para/i }));
    await user.selectOptions(screen.getByLabelText(/lista de destino/i), "2");
    await user.selectOptions(screen.getByLabelText(/posição/i), "0");
    await user.click(screen.getByRole("button", { name: /^mover tarefa$/i }));

    expect(onMove).toHaveBeenCalledWith({
      taskId: 11,
      fromListId: 1,
      toListId: 2,
      toIndex: 0,
    });

    await user.click(screen.getByRole("button", { name: /opções da tarefa revisar contrato/i }));
    await user.click(screen.getByRole("menuitem", { name: /excluir tarefa/i }));
    expect(onDelete).toHaveBeenCalledWith(state[0].tarefas[0]);
  });
});
