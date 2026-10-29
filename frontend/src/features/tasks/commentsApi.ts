import type { Comentario } from "../../lib/api/types";
import type { JsonTransport } from "../../lib/api/transport";
import { authenticatedRequest } from "../../lib/auth/sessionManager";

export function createCommentsApi(transport: JsonTransport) {
  return {
    list: (taskId: number) => transport<Comentario[]>(`/tarefas/${taskId}/comentarios`),
    create: (taskId: number, texto: string) =>
      transport<Comentario>(`/tarefas/${taskId}/comentarios`, {
        method: "POST",
        json: { texto },
      }),
    update: (id: number, texto: string) =>
      transport<Comentario>(`/comentarios/${id}`, {
        method: "PUT",
        json: { texto },
      }),
    remove: async (id: number): Promise<void> => {
      await transport(`/comentarios/${id}`, { method: "DELETE" });
    },
  };
}

export const CommentsApi = createCommentsApi(authenticatedRequest);
