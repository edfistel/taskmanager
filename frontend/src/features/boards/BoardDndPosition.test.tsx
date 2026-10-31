import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { ToastProvider } from "../../components/feedback/ToastProvider";
import { queryKeys } from "../../lib/api/queryKeys";
import type { ListaComTarefas } from "../../lib/api/types";
import { TasksApi } from "../tasks/tasksApi";
import { BoardApi } from "./boardApi";
import { BoardDndProvider } from "./BoardDndProvider";

let finishDrag: ((event: unknown) => void) | undefined;
let moveDrag: ((event: unknown) => void) | undefined;
let updateDrag: ((event: unknown) => void) | undefined;
let startDrag: ((event: unknown) => void) | undefined;
let renderedLists: ListaComTarefas[] = [];

vi.mock("@dnd-kit/react", () => ({
  DragDropProvider: ({ children, onDragEnd, onDragMove, onDragOver, onDragStart }: {
    children: ReactNode;
    onDragEnd(event: unknown): void;
    onDragMove?(event: unknown): void;
    onDragOver?(event: unknown): void;
    onDragStart?(event: unknown): void;
  }) => {
    finishDrag = onDragEnd;
    moveDrag = onDragOver;
    updateDrag = onDragMove;
    startDrag = onDragStart;
    return children;
  },
  DragOverlay: () => null,
  PointerSensor: { configure: vi.fn() },
}));

vi.mock("../tasks/tasksApi", () => ({
  TasksApi: { move: vi.fn() },
}));

vi.mock("./boardApi", () => ({
  BoardApi: { moveList: vi.fn() },
}));

function state(): ListaComTarefas[] {
  return [
    {
      id: 1,
      nome: "A Fazer",
      posicao: 0,
      quadroId: 7,
      tarefas: [{ id: 11, titulo: "Primeira", prazo: null, posicao: 0, status: "A_FAZER" }],
    },
    {
      id: 2,
      nome: "Em andamento",
      posicao: 1,
      quadroId: 7,
      tarefas: [
        { id: 21, titulo: "Uma", prazo: null, posicao: 0, status: "EM_ANDAMENTO" },
        { id: 22, titulo: "Duas", prazo: null, posicao: 1, status: "EM_ANDAMENTO" },
        { id: 23, titulo: "Três", prazo: null, posicao: 2, status: "EM_ANDAMENTO" },
      ],
    },
    { id: 3, nome: "Em revisão", posicao: 2, quadroId: 7, tarefas: [] },
  ];
}

function renderProvider() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const lists = state();
  renderedLists = lists;
  queryClient.setQueryData(queryKeys.lists(7), lists);
  render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BoardDndProvider boardId={7} lists={lists}>
          {(actions) => {
            renderedLists = actions.lists;
            return <div>Quadro</div>;
          }}
        </BoardDndProvider>
      </ToastProvider>
    </QueryClientProvider>,
  );
}

describe("BoardDndProvider final sortable position", () => {
  it("persists the live final task index and destination group", async () => {
    vi.mocked(TasksApi.move).mockResolvedValue({} as never);
    renderProvider();

    const source = { data: { kind: "task", taskId: 11, listId: 1, index: 0 } };
    const target = {
      data: { kind: "task", taskId: 22, listId: 2, index: 1 },
      shape: { center: { x: 600, y: 450 } },
    };

    act(() => startDrag?.({ operation: { source, target: source } }));
    act(() => moveDrag?.({
      operation: {
        position: { current: { x: 600, y: 500 } },
        source,
        target,
      },
    }));
    expect(renderedLists[1].tarefas.map((task) => task.id)).toEqual([21, 22, 11, 23]);
    act(() => finishDrag?.({ canceled: false, operation: { source, target } }));

    await waitFor(() => expect(TasksApi.move).toHaveBeenCalledWith(11, {
      listaId: 2,
      posicao: 2,
    }));
  });

  it("persists the live final column index after neighboring columns shift", async () => {
    vi.mocked(BoardApi.moveList).mockResolvedValue({} as never);
    renderProvider();

    const source = { data: { kind: "list", listId: 1, index: 0 } };
    const target = {
      data: { kind: "list", listId: 3, index: 2 },
      shape: { center: { x: 600, y: 250 } },
    };

    act(() => startDrag?.({ operation: { source, target: source } }));
    act(() => updateDrag?.({
      operation: {
        position: { current: { x: 700, y: 250 } },
        source,
        target,
      },
    }));
    expect(renderedLists.map((list) => list.id)).toEqual([2, 3, 1]);
    act(() => finishDrag?.({ canceled: false, operation: { source, target } }));

    await waitFor(() => expect(BoardApi.moveList).toHaveBeenCalledWith(1, 2));
  });
});
