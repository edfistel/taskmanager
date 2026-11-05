import { authenticatedRequest } from "../../lib/auth/sessionManager";
import type { Lista, ListaComTarefas } from "../../lib/api/types";
import type { JsonTransport } from "../../lib/api/transport";

export function createBoardApi(transport: JsonTransport) {
  return {
    listLists: (boardId: number) =>
      transport<ListaComTarefas[]>(`/quadros/${boardId}/listas`),
    createList: (boardId: number, nome: string) =>
      transport<Lista>(`/quadros/${boardId}/listas`, {
        method: "POST",
        json: { nome },
      }),
    renameList: (id: number, nome: string) =>
      transport<Lista>(`/listas/${id}`, {
        method: "PUT",
        json: { nome },
      }),
    moveList: (id: number, posicao: number) =>
      transport<Lista>(`/listas/${id}/mover`, {
        method: "PATCH",
        json: { posicao },
      }),
    removeList: async (id: number): Promise<void> => {
      await transport(`/listas/${id}`, { method: "DELETE" });
    },
  };
}

export const BoardApi = createBoardApi(authenticatedRequest);
