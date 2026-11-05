import { describe, expect, it, vi } from "vitest";

import type { JsonTransport } from "../../lib/api/transport";
import { createTasksApi } from "./tasksApi";

describe("TasksApi", () => {
  it("uses the task detail, mutation and deletion routes from the backend", async () => {
    const transport = vi.fn().mockResolvedValue(undefined) as unknown as JsonTransport;
    const api = createTasksApi(transport);
    const input = {
      titulo: "Publicar página inicial",
      descricao: "Validar conteúdo final",
      prazo: "2026-11-02",
      status: "EM_ANDAMENTO" as const,
    };

    await api.get(19);
    await api.create(4, input);
    await api.update(19, { status: "CONCLUIDO", prazo: null });
    await api.move(19, { listaId: 8, posicao: 0 });
    await api.remove(19);

    expect(transport).toHaveBeenNthCalledWith(1, "/tarefas/19");
    expect(transport).toHaveBeenNthCalledWith(2, "/listas/4/tarefas", {
      method: "POST",
      json: input,
    });
    expect(transport).toHaveBeenNthCalledWith(3, "/tarefas/19", {
      method: "PUT",
      json: { status: "CONCLUIDO", prazo: null },
    });
    expect(transport).toHaveBeenNthCalledWith(4, "/tarefas/19/mover", {
      method: "PATCH",
      json: { listaId: 8, posicao: 0 },
    });
    expect(transport).toHaveBeenNthCalledWith(5, "/tarefas/19", {
      method: "DELETE",
    });
  });
});
