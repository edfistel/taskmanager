import type { Atribuicao } from "../../lib/api/types";
import type { JsonTransport } from "../../lib/api/transport";
import { authenticatedRequest } from "../../lib/auth/sessionManager";

export function createAssigneesApi(transport: JsonTransport) {
  return {
    list: (taskId: number) => transport<Atribuicao[]>(`/tarefas/${taskId}/atribuicoes`),
    addByEmail: (taskId: number, email: string) =>
      transport<Atribuicao>(`/tarefas/${taskId}/atribuicoes`, {
        method: "POST",
        json: { email },
      }),
    remove: async (taskId: number, userId: number): Promise<void> => {
      await transport(`/tarefas/${taskId}/atribuicoes/${userId}`, { method: "DELETE" });
    },
  };
}

export const AssigneesApi = createAssigneesApi(authenticatedRequest);
