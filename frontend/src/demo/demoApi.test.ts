import { describe, expect, it, vi } from "vitest";
import { createDemoFetch } from "./demoApi";

const call = async (fetcher: typeof fetch, path: string, method = "GET", body?: unknown) => {
  const response = await fetcher(path, { method, ...(body ? {body: JSON.stringify(body)} : {}) });
  return { status: response.status, ...(await response.json()) };
};

describe("isolated demo API", () => {
  it("blocks unknown API calls without hitting a backend and leaves assets alone", async () => {
    const remote = vi.fn<typeof fetch>().mockResolvedValue(new Response("asset"));
    const fetcher = createDemoFetch(remote, "http://localhost:3002");
    expect((await call(fetcher, "/tarefas/1/unknown")).status).toBe(501);
    expect((await call(fetcher, "/quadros/1/listas/unknown")).status).toBe(501);
    expect((await call(fetcher, "/tarefas/1/subtarefas", "DELETE")).status).toBe(501);
    expect(remote).not.toHaveBeenCalled();
    await fetcher("/src/main.tsx");
    expect(remote).toHaveBeenCalledOnce();
  });
  it("uses backend envelopes and persists CRUD, ordering and cascade deletes in memory", async () => {
    const fetcher = createDemoFetch(vi.fn(), "http://localhost:3002");
    const board = await call(fetcher, "/quadros", "POST", {nome: "Teste", descricao: "Demo"});
    expect(board.status).toBe(201);
    expect(board.body.listas).toHaveLength(1);
    const list = await call(fetcher, `/quadros/${board.body.id}/listas`, "POST", {nome: "Entrega"});
    const task = await call(fetcher, `/listas/${board.body.listas[0].id}/tarefas`, "POST", {titulo: "Revisar", status: "A_FAZER"});
    await call(fetcher, `/tarefas/${task.body.id}/mover`, "PATCH", {listaId: list.body.id, posicao: 0});
    expect((await call(fetcher, `/quadros/${board.body.id}/listas`)).body[1].tarefas[0].titulo).toBe("Revisar");
    const sub = await call(fetcher, `/tarefas/${task.body.id}/subtarefas`, "POST", {titulo: "Checar"});
    expect((await call(fetcher, `/subtarefas/${sub.body.id}/concluir`, "PATCH", {concluida: true})).body.concluida).toBe(true);
    const comment = await call(fetcher, `/tarefas/${task.body.id}/comentarios`, "POST", {texto: "Pronto"});
    expect((await call(fetcher, `/comentarios/${comment.body.id}`, "PUT", {texto: "Revisado"})).body.texto).toBe("Revisado");
    const assignment = await call(fetcher, `/tarefas/${task.body.id}/atribuicoes`, "POST", {email: "marina@example.test"});
    expect(assignment.body.usuario.email).toBe("marina@example.test");
    expect((await call(fetcher, "/atribuicoes/minhas")).body.some((a: {tarefa: {id: number}}) => a.tarefa.id === task.body.id)).toBe(true);
    await call(fetcher, `/quadros/${board.body.id}`, "DELETE");
    expect((await call(fetcher, `/tarefas/${task.body.id}`)).status).toBe(404);
    expect((await call(fetcher, `/tarefas/${task.body.id}/subtarefas`)).status).toBe(404);
    expect((await call(createDemoFetch(vi.fn(), "http://localhost:3002"), `/quadros/${board.body.id}`)).status).toBe(404);
  });
  it("supports every existing mutation route and maintains contiguous list/task positions", async () => {
    const fetcher = createDemoFetch(vi.fn(), "http://localhost:3002");
    expect((await call(fetcher, "/quadros/1", "PUT", {nome: "Novo nome", descricao: null})).body.nome).toBe("Novo nome");
    expect((await call(fetcher, "/listas/1", "PUT", {nome: "Planejar"})).body.nome).toBe("Planejar");
    await call(fetcher, "/listas/3/mover", "PATCH", {posicao: 0});
    expect((await call(fetcher, "/quadros/1/listas")).body.map((l: {id: number}) => l.id)).toEqual([3, 1, 2]);
    await call(fetcher, "/tarefas/2/mover", "PATCH", {posicao: 0});
    expect((await call(fetcher, "/listas/1/tarefas")).body.map((t: {id: number}) => t.id)).toEqual([2, 1]);
    expect((await call(fetcher, "/tarefas/1", "PUT", {titulo: "Revisado", prazo: null, status: "CONCLUIDO"})).body).toMatchObject({titulo: "Revisado", prazo: null, status: "CONCLUIDO"});
    expect((await call(fetcher, "/subtarefas/1", "PUT", {titulo: "Novo passo"})).body.titulo).toBe("Novo passo");
    await call(fetcher, "/subtarefas/1", "DELETE");
    expect((await call(fetcher, "/tarefas/1/subtarefas")).body.map((s: {id: number}) => s.id)).toEqual([2]);
    await call(fetcher, "/comentarios/1", "DELETE");
    expect((await call(fetcher, "/tarefas/1/comentarios")).body).toEqual([]);
    await call(fetcher, "/tarefas/1/atribuicoes/1", "DELETE");
    expect((await call(fetcher, "/tarefas/1/atribuicoes")).body).toEqual([]);
    await call(fetcher, "/tarefas/2", "DELETE");
    expect((await call(fetcher, "/listas/1/tarefas")).body[0].posicao).toBe(0);
    await call(fetcher, "/listas/1", "DELETE");
    expect((await call(fetcher, "/tarefas/1")).status).toBe(404);
    expect((await call(fetcher, "/quadros/1/listas")).body.map((l: {posicao: number}) => l.posicao)).toEqual([0, 1]);
    expect((await call(fetcher, "/users/buscarUsuarioPorEmail/alex%40example.test")).body.email).toBe("alex@example.test");
    expect((await call(fetcher, "/users/register", "POST", {nome: "Visitante", email: "visitor@example.test", senha: "demo12345"})).status).toBe(201);
    expect((await call(fetcher, "/auth/login", "POST", {email: "visitor@example.test", senha: "demo12345"})).body.usuario.nome).toBe("Visitante");
  });
  it("keeps account and auth operations local and rejects calls after logout", async () => {
    const fetcher = createDemoFetch(vi.fn(), "http://localhost:3002");
    expect((await call(fetcher, "/auth/refresh", "POST", {refreshToken: "demo"})).body.accessToken).toContain("demo");
    expect((await call(fetcher, "/users/alterarSenha", "PUT", {senhaAtual: "demo12345", novaSenha: "new12345"})).status).toBe(200);
    await call(fetcher, "/auth/logout", "POST", {});
    expect((await call(fetcher, "/quadros")).status).toBe(401);
    await call(fetcher, "/auth/login", "POST", {email: "visitor@example.test", senha: "anything"});
    expect((await call(fetcher, "/users/buscarMeuPerfil")).body.email).toBe("visitor@example.test");
    await call(fetcher, "/users/apagarUsuario", "DELETE");
    expect((await call(fetcher, "/auth/refresh", "POST", {})).status).toBe(401);
  });
});


