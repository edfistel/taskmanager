import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "../../lib/api/queryKeys";
import { BoardsApi } from "../dashboard/boardsApi";
import { BoardApi } from "./boardApi";

export function useBoard(boardId: number) {
  const boardQuery = useQuery({
    queryKey: queryKeys.board(boardId),
    queryFn: () => BoardsApi.get(boardId),
    enabled: Number.isInteger(boardId) && boardId > 0,
  });

  const listsQuery = useQuery({
    queryKey: queryKeys.lists(boardId),
    queryFn: () => BoardApi.listLists(boardId),
    enabled: Number.isInteger(boardId) && boardId > 0,
    select: (lists) => [...lists].sort((first, second) => first.posicao - second.posicao),
  });

  return { boardQuery, listsQuery };
}

function useRefreshLists(boardId: number) {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({
      queryKey: queryKeys.lists(boardId),
      exact: true,
    });
}

export function useCreateList(boardId: number) {
  const refreshLists = useRefreshLists(boardId);
  return useMutation({
    mutationFn: (nome: string) => BoardApi.createList(boardId, nome),
    onSuccess: refreshLists,
  });
}

export function useRenameList(boardId: number) {
  const refreshLists = useRefreshLists(boardId);
  return useMutation({
    mutationFn: ({ id, nome }: { id: number; nome: string }) =>
      BoardApi.renameList(id, nome),
    onSuccess: refreshLists,
  });
}

export function useMoveList(boardId: number) {
  const refreshLists = useRefreshLists(boardId);
  return useMutation({
    mutationFn: ({ id, posicao }: { id: number; posicao: number }) =>
      BoardApi.moveList(id, posicao),
    onSuccess: refreshLists,
  });
}

export function useDeleteList(boardId: number) {
  const refreshLists = useRefreshLists(boardId);
  return useMutation({
    mutationFn: (id: number) => BoardApi.removeList(id),
    onSuccess: refreshLists,
  });
}
