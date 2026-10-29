import type {
  AtualizarTarefaInput,
  CriarTarefaInput,
  TarefaDetalhe,
} from "../../lib/api/types";
import type { JsonTransport } from "../../lib/api/transport";
import { authenticatedRequest } from "../../lib/auth/sessionManager";

export function createTasksApi(transport: JsonTransport) {
  return {
    get: (id: number) => transport<TarefaDetalhe>(`/tarefas/${id}`),
    create: (listId: number, input: CriarTarefaInput) =>
      transport<TarefaDetalhe>(`/listas/${listId}/tarefas`, {
        method: "POST",
        json: input,
      }),
    remove: async (id: number): Promise<void> => {
      await transport(`/tarefas/${id}`, { method: "DELETE" });
    },
    move: (id: number, input: { listaId?: number; posicao: number }) =>
      transport<TarefaDetalhe>(`/tarefas/${id}/mover`, {
        method: "PATCH",
        json: input,
      }),
    update: (id: number, input: AtualizarTarefaInput) =>
      transport<TarefaDetalhe>(`/tarefas/${id}`, {
        method: "PUT",
        json: input,
      }),
  };
}

export const TasksApi = createTasksApi(authenticatedRequest);
