import type { Subtarefa } from "../../lib/api/types";
import type { JsonTransport } from "../../lib/api/transport";
import { authenticatedRequest } from "../../lib/auth/sessionManager";

export function createSubtasksApi(transport: JsonTransport) {
  return {
    list: (taskId: number) => transport<Subtarefa[]>(`/tarefas/${taskId}/subtarefas`),
    create: (taskId: number, titulo: string) =>
      transport<Subtarefa>(`/tarefas/${taskId}/subtarefas`, {
        method: "POST",
        json: { titulo },
      }),
    rename: (id: number, titulo: string) =>
      transport<Subtarefa>(`/subtarefas/${id}`, {
        method: "PUT",
        json: { titulo },
      }),
    setCompleted: (id: number, concluida: boolean) =>
      transport<Subtarefa>(`/subtarefas/${id}/concluir`, {
        method: "PATCH",
        json: { concluida },
      }),
    remove: async (id: number): Promise<void> => {
      await transport(`/subtarefas/${id}`, { method: "DELETE" });
    },
  };
}

export const SubtasksApi = createSubtasksApi(authenticatedRequest);
