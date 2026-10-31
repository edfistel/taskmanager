import type { ListaComTarefas, TarefaResumo } from "../../lib/api/types";

interface ListMove {
  id: number;
  toIndex: number;
}

export interface TaskMove {
  taskId: number;
  fromListId: number;
  toListId: number;
  toIndex: number;
}

function clampIndex(index: number, length: number): number {
  return Math.max(0, Math.min(index, Math.max(0, length)));
}

function renumberTasks(tasks: TarefaResumo[]): TarefaResumo[] {
  return tasks.map((task, index) =>
    task.posicao === index ? task : { ...task, posicao: index },
  );
}

export function reorderLists(
  state: ListaComTarefas[],
  move: ListMove,
): ListaComTarefas[] {
  const fromIndex = state.findIndex((list) => list.id === move.id);
  if (fromIndex < 0) return state;

  const next = [...state];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(clampIndex(move.toIndex, next.length), 0, moved);

  return next.map((list, index) =>
    list.posicao === index ? list : { ...list, posicao: index },
  );
}

export function reorderTask(
  state: ListaComTarefas[],
  move: TaskMove,
): ListaComTarefas[] {
  const sourceIndex = state.findIndex((list) => list.id === move.fromListId);
  const targetIndex = state.findIndex((list) => list.id === move.toListId);
  if (sourceIndex < 0 || targetIndex < 0) return state;

  const sourceList = state[sourceIndex];
  const taskIndex = sourceList.tarefas.findIndex((task) => task.id === move.taskId);
  if (taskIndex < 0) return state;

  if (sourceIndex === targetIndex) {
    const tasks = [...sourceList.tarefas];
    const [task] = tasks.splice(taskIndex, 1);
    tasks.splice(clampIndex(move.toIndex, tasks.length), 0, task);
    const next = [...state];
    next[sourceIndex] = { ...sourceList, tarefas: renumberTasks(tasks) };
    return next;
  }

  const targetList = state[targetIndex];
  const sourceTasks = [...sourceList.tarefas];
  const [task] = sourceTasks.splice(taskIndex, 1);
  const targetTasks = [...targetList.tarefas];
  targetTasks.splice(clampIndex(move.toIndex, targetTasks.length), 0, task);

  const next = [...state];
  next[sourceIndex] = { ...sourceList, tarefas: renumberTasks(sourceTasks) };
  next[targetIndex] = { ...targetList, tarefas: renumberTasks(targetTasks) };
  return next;
}
