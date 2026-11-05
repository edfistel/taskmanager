import { describe, expect, it } from "vitest";

import type { ListaComTarefas } from "../../lib/api/types";
import { reorderLists, reorderTask } from "./reorder";

function list(id: number, posicao: number, taskIds: number[]): ListaComTarefas {
  return {
    id,
    nome: `Lista ${id}`,
    posicao,
    quadroId: 7,
    tarefas: taskIds.map((taskId, index) => ({
      id: taskId,
      titulo: `Tarefa ${taskId}`,
      prazo: null,
      posicao: index,
      status: taskId === 2 ? "CONCLUIDO" : "A_FAZER",
    })),
  };
}

describe("board reorder helpers", () => {
  it("reorders lists immutably and keeps contiguous positions", () => {
    const state = [list(1, 0, []), list(2, 1, []), list(3, 2, [])];
    const snapshot = structuredClone(state);

    const result = reorderLists(state, { id: 3, toIndex: 0 });

    expect(result.map(({ id, posicao }) => ({ id, posicao }))).toEqual([
      { id: 3, posicao: 0 },
      { id: 1, posicao: 1 },
      { id: 2, posicao: 2 },
    ]);
    expect(state).toEqual(snapshot);
  });

  it("reorders tasks inside one list without changing status or input", () => {
    const state = [list(1, 0, [1, 2, 3]), list(2, 1, [4])];
    const snapshot = structuredClone(state);
    const originalTask = state[0].tarefas[1];

    const result = reorderTask(state, {
      taskId: 2,
      fromListId: 1,
      toListId: 1,
      toIndex: 0,
    });

    expect(result[0].tarefas.map(({ id, posicao }) => ({ id, posicao }))).toEqual([
      { id: 2, posicao: 0 },
      { id: 1, posicao: 1 },
      { id: 3, posicao: 2 },
    ]);
    expect(result[0].tarefas[0].status).toBe(originalTask.status);
    expect(result[1]).toBe(state[1]);
    expect(state).toEqual(snapshot);
  });

  it("moves a task across lists and renumbers both affected lists", () => {
    const state = [list(1, 0, [1, 2]), list(2, 1, [3, 4])];
    const originalTask = state[0].tarefas[1];

    const result = reorderTask(state, {
      taskId: 2,
      fromListId: 1,
      toListId: 2,
      toIndex: 0,
    });

    expect(result[0].tarefas.map(({ id, posicao }) => ({ id, posicao }))).toEqual([
      { id: 1, posicao: 0 },
    ]);
    expect(result[1].tarefas.map(({ id, posicao }) => ({ id, posicao }))).toEqual([
      { id: 2, posicao: 0 },
      { id: 3, posicao: 1 },
      { id: 4, posicao: 2 },
    ]);
    expect(result[1].tarefas[0].status).toBe(originalTask.status);
  });
});
