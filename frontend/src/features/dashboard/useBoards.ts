import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "../../lib/api/queryKeys";
import { BoardsApi, type CreateBoardInput, type UpdateBoardInput } from "./boardsApi";

export function useBoards() {
  return useQuery({
    queryKey: queryKeys.boards.all,
    queryFn: BoardsApi.list,
  });
}

function useRefreshBoards() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({
      queryKey: queryKeys.boards.all,
      exact: true,
    });
}

export function useCreateBoard() {
  const refreshBoards = useRefreshBoards();
  return useMutation({
    mutationFn: (input: CreateBoardInput) => BoardsApi.create(input),
    onSuccess: refreshBoards,
  });
}

export function useUpdateBoard() {
  const refreshBoards = useRefreshBoards();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateBoardInput }) =>
      BoardsApi.update(id, input),
    onSuccess: refreshBoards,
  });
}

export function useDeleteBoard() {
  const refreshBoards = useRefreshBoards();
  return useMutation({
    mutationFn: (id: number) => BoardsApi.remove(id),
    onSuccess: refreshBoards,
  });
}
