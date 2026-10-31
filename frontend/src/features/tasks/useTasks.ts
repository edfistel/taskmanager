import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "../../lib/api/queryKeys";
import type {
  AtualizarTarefaInput,
  CriarTarefaInput,
  ListaComTarefas,
  TarefaDetalhe,
} from "../../lib/api/types";
import { TasksApi } from "./tasksApi";

function useRefreshBoardLists(boardId: number) {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({
      queryKey: queryKeys.lists(boardId),
      exact: true,
    });
}

export function useCreateTask(boardId: number) {
  const refreshLists = useRefreshBoardLists(boardId);
  return useMutation({
    mutationFn: ({ listId, input }: { listId: number; input: CriarTarefaInput }) =>
      TasksApi.create(listId, input),
    onSuccess: refreshLists,
  });
}

export function useDeleteTask(boardId: number) {
  const refreshLists = useRefreshBoardLists(boardId);
  return useMutation({
    mutationFn: (taskId: number) => TasksApi.remove(taskId),
    onSuccess: refreshLists,
  });
}

export function useTaskDetails(taskId: number | null, enabled = true) {
  return useQuery({
    queryKey: queryKeys.task(taskId ?? 0),
    queryFn: () => TasksApi.get(taskId!),
    enabled: taskId !== null && enabled,
  });
}

function patchSummaryCards(
  current: ListaComTarefas[] | undefined,
  updated: TarefaDetalhe,
): ListaComTarefas[] | undefined {
  if (!current) return current;
  let changed = false;
  const next = current.map((list) => {
    const taskIndex = list.tarefas.findIndex((task) => task.id === updated.id);
    if (taskIndex < 0) return list;
    changed = true;
    const tarefas = [...list.tarefas];
    const summary = tarefas[taskIndex];
    tarefas[taskIndex] = {
      ...summary,
      titulo: updated.titulo,
      prazo: updated.prazo,
      status: updated.status,
    };
    return { ...list, tarefas };
  });
  return changed ? next : current;
}

export function useUpdateTask(taskId: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AtualizarTarefaInput) => TasksApi.update(taskId!, input),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.task(updated.id), updated);
      queryClient.setQueriesData<ListaComTarefas[]>(
        {
          predicate: (query) =>
            query.queryKey[0] === "boards" && query.queryKey[2] === "lists",
        },
        (current) => patchSummaryCards(current, updated),
      );
    },
  });
}

export function useDeleteTaskFromDetails(taskId: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => TasksApi.remove(taskId!),
    onSuccess: () => {
      if (taskId !== null) queryClient.removeQueries({ queryKey: queryKeys.task(taskId), exact: true });
      queryClient.setQueriesData<ListaComTarefas[]>(
        {
          predicate: (query) =>
            query.queryKey[0] === "boards" && query.queryKey[2] === "lists",
        },
        (current) => current?.map((list) => ({
          ...list,
          tarefas: list.tarefas.filter((task) => task.id !== taskId),
        })),
      );
    },
  });
}
