import type { Atribuicao, Comentario, Lista, Quadro, Subtarefa, TarefaDetalhe, Usuario } from "../lib/api/types";

const now = () => new Date().toISOString();
const date = (days: number) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
const tokens = {accessToken: "taskflow-demo-access", refreshToken: "taskflow-demo-refresh"};
const apiPath = /^\/(auth|users|quadros|listas|tarefas|subtarefas|comentarios|atribuicoes)(\/|$)/;

/** A fresh in-memory API per page load. Never connects API requests to a server. */
export function createDemoFetch(fallback: typeof fetch, origin: string): typeof fetch {
  let user: Usuario = {id: 1, nome: "Marina Costa", email: "marina@example.test"};
  let authenticated = true;
  let deleted = false;
  let nextId = 100;
  const boards: Quadro[] = [
    {id: 1, nome: "Lançamento do produto", descricao: "Organize as próximas entregas da equipe Aurora.", criadoEm: now()},
    {id: 2, nome: "Ideias e melhorias", descricao: "Um espaço para experimentar o que vem a seguir.", criadoEm: now()},
    {id: 3, nome: "Rotina da equipe", descricao: "Pequenos passos para uma semana mais leve.", criadoEm: now()},
  ];
  let lists: Lista[] = [
    {id: 1, nome: "A fazer", posicao: 0, quadroId: 1}, {id: 2, nome: "Em andamento", posicao: 1, quadroId: 1}, {id: 3, nome: "Concluído", posicao: 2, quadroId: 1},
    {id: 4, nome: "Ideias", posicao: 0, quadroId: 2}, {id: 5, nome: "Esta semana", posicao: 0, quadroId: 3},
  ];
  let tasks: TarefaDetalhe[] = [
    {id: 1, titulo: "Revisar a experiência de boas-vindas", descricao: "Mapear os primeiros passos e simplificar o cadastro. Compartilhe sugestões nos comentários.", prazo: date(2), posicao: 0, status: "A_FAZER", listaId: 1},
    {id: 2, titulo: "Preparar materiais do lançamento", descricao: "Organizar textos e imagens para a próxima entrega.", prazo: date(5), posicao: 1, status: "A_FAZER", listaId: 1},
    {id: 3, titulo: "Validar o novo painel com a equipe", descricao: "Reunir feedback sobre navegação, filtros e clareza das tarefas.", prazo: date(0), posicao: 0, status: "EM_ANDAMENTO", listaId: 2},
    {id: 4, titulo: "Ajustar os detalhes da versão mobile", descricao: "Conferir os fluxos em telas menores.", prazo: date(-2), posicao: 1, status: "EM_ANDAMENTO", listaId: 2},
    {id: 5, titulo: "Definir prioridades da semana", descricao: "Prioridades alinhadas com toda a equipe.", prazo: date(-1), posicao: 0, status: "CONCLUIDO", listaId: 3},
    {id: 6, titulo: "Explorar atalhos para tarefas recorrentes", descricao: null, prazo: null, posicao: 0, status: "A_FAZER", listaId: 4},
    {id: 7, titulo: "Organizar a retrospectiva", descricao: "Separar aprendizados e próximos passos.", prazo: date(3), posicao: 0, status: "A_FAZER", listaId: 5},
  ];
  let subtasks: Subtarefa[] = [{id: 1, titulo: "Revisar os textos", concluida: true, tarefaId: 1}, {id: 2, titulo: "Testar a primeira navegação", concluida: false, tarefaId: 1}];
  let comments: Comentario[] = [{id: 1, texto: "Podemos testar uma versão mais curta dos primeiros passos?", criadoEm: now(), tarefaId: 1, usuarioId: 1, usuario: {id: 1, nome: user.nome}}];
  let assignments: Atribuicao[] = [{id: 1, atribuidoEm: now(), tarefaId: 1, usuario: {...user}}, {id: 2, atribuidoEm: now(), tarefaId: 3, usuario: {...user}}, {id: 3, atribuidoEm: now(), tarefaId: 7, usuario: {...user}}];
  const ok = (body: unknown = {}, status = 200) => new Response(JSON.stringify({success: true, body}), {status, headers: {"Content-Type": "application/json"}});
  const error = (status: number, message: string) => new Response(JSON.stringify({success: false, message}), {status, headers: {"Content-Type": "application/json"}});
  const ordered = <T extends {posicao: number}>(items: T[]) => [...items].sort((a, b) => a.posicao - b.posicao);
  const normalize = (items: {posicao: number}[]) => ordered(items).forEach((item, index) => {item.posicao = index;});
  const removeTask = (id: number) => {
    tasks = tasks.filter(t => t.id !== id);
    subtasks = subtasks.filter(s => s.tarefaId !== id);
    comments = comments.filter(c => c.tarefaId !== id);
    assignments = assignments.filter(a => a.tarefaId !== id);
  };
  const removeList = (id: number) => {tasks.filter(t => t.listaId === id).forEach(t => removeTask(t.id)); lists = lists.filter(l => l.id !== id);};
  return async (input, init = {}) => {
    const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url, origin);
    if (!apiPath.test(url.pathname)) return fallback(input, init);
    if (url.origin !== origin) return error(501, "A demonstração aceita somente a API local fictícia.");
    const path = url.pathname.replace(/\/$/, "");
    const method = (init.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase();
    const knownRoutes: Array<[RegExp, string[]]> = [
      [/^\/auth\/(login|refresh|logout)$/, ["POST"]],
      [/^\/users\/register$/, ["POST"]],
      [/^\/users\/(buscarMeuPerfil|buscarUsuarioPorEmail\/[^/]+)$/, ["GET"]],
      [/^\/users\/alterarSenha$/, ["PUT"]], [/^\/users\/apagarUsuario$/, ["DELETE"]],
      [/^\/atribuicoes\/minhas$/, ["GET"]],
      [/^\/quadros$/, ["GET", "POST"]], [/^\/quadros\/\d+$/, ["GET", "PUT", "DELETE"]],
      [/^\/quadros\/\d+\/listas$/, ["GET", "POST"]],
      [/^\/listas\/\d+$/, ["PUT", "DELETE"]], [/^\/listas\/\d+\/mover$/, ["PATCH"]],
      [/^\/listas\/\d+\/tarefas$/, ["GET", "POST"]],
      [/^\/tarefas\/\d+$/, ["GET", "PUT", "DELETE"]], [/^\/tarefas\/\d+\/mover$/, ["PATCH"]],
      [/^\/tarefas\/\d+\/(subtarefas|comentarios|atribuicoes)$/, ["GET", "POST"]],
      [/^\/tarefas\/\d+\/atribuicoes\/\d+$/, ["DELETE"]],
      [/^\/subtarefas\/\d+$/, ["PUT", "DELETE"]], [/^\/subtarefas\/\d+\/concluir$/, ["PATCH"]],
      [/^\/comentarios\/\d+$/, ["PUT", "DELETE"]],
    ];
    if (!knownRoutes.some(([pattern, methods]) => pattern.test(path) && methods.includes(method))) {
      return error(501, `Operação não disponível na demonstração: ${method} ${path}`);
    }
    let body: Record<string, unknown> = {};
    try {
      const raw = init.body ?? (input instanceof Request ? await input.clone().text() : null);
      if (raw) body = JSON.parse(String(raw));
    } catch {return error(400, "JSON inválido");}
    const name = (key: string) => typeof body[key] === "string" ? (body[key] as string).trim() : "";
    if (path === "/users/register" && method === "POST") {
      if (!name("nome") || !name("email") || name("senha").length < 8) return error(400, "Preencha nome, e-mail e uma senha com pelo menos 8 caracteres.");
      user = {id: 1, nome: name("nome"), email: name("email")}; deleted = false;
      return ok(user, 201);
    }
    if (path === "/auth/login" && method === "POST") {
      if (!name("email") || !name("senha")) return error(400, "Preencha e-mail e senha para entrar na demonstração.");
      user = {...user, email: name("email")}; authenticated = true; deleted = false;
      return ok({usuario: user, ...tokens});
    }
    if (path === "/auth/refresh" && method === "POST") return authenticated && !deleted ? ok(tokens) : error(401, "Sessão encerrada");
    if (path === "/auth/logout" && method === "POST") {authenticated = false; return ok();}
    if (!authenticated || deleted) return error(401, "Entre novamente na demonstração.");
    if (path === "/users/buscarMeuPerfil" && method === "GET") return ok(user);
    if (path.startsWith("/users/buscarUsuarioPorEmail/") && method === "GET") return ok({id: name("email") === user.email ? 1 : 2, nome: "Alex Lima", email: decodeURIComponent(path.split("/").at(-1)!)});
    if (path === "/users/alterarSenha" && method === "PUT") return name("novaSenha").length >= 8 && name("senhaAtual") ? ok() : error(400, "Informe a senha atual e uma nova senha com pelo menos 8 caracteres.");
    if (path === "/users/apagarUsuario" && method === "DELETE") {deleted = true; authenticated = false; return ok();}
    if (path === "/atribuicoes/minhas" && method === "GET") return ok(assignments.filter(a => a.usuario.id === user.id).flatMap(a => {
      const task = tasks.find(t => t.id === a.tarefaId); const list = lists.find(l => l.id === task?.listaId); const board = boards.find(b => b.id === list?.quadroId);
      return task && list && board ? [{atribuidoEm: a.atribuidoEm, tarefa: {...task, lista: {id: list.id, nome: list.nome, quadro: {id: board.id, nome: board.nome}}}}] : [];
    }));
    if (path === "/quadros") {
      if (method === "GET") return ok(boards);
      if (method === "POST") {
        if (!name("nome")) return error(400, "O nome do quadro é obrigatório.");
        const board = {id: nextId++, nome: name("nome"), descricao: name("descricao") || null, criadoEm: now()}; boards.push(board);
        const list = {id: nextId++, nome: "A Fazer", posicao: 0, quadroId: board.id}; lists.push(list);
        return ok({...board, listas: [list]}, 201);
      }
    }
    const parts = path.split("/").filter(Boolean); const [resource, idText, relation, childText] = parts; const id = Number(idText);
    if (resource === "quadros" && idText) {
      const board = boards.find(b => b.id === id); if (!board) return error(404, "Quadro não encontrado");
      if (!relation) {
        if (method === "GET") return ok(board);
        if (method === "PUT") {if ("nome" in body) board.nome = name("nome"); if ("descricao" in body) board.descricao = name("descricao") || null; return ok(board);}
        if (method === "DELETE") {lists.filter(l => l.quadroId === id).forEach(l => removeList(l.id)); boards.splice(boards.indexOf(board), 1); return ok();}
      }
      if (relation === "listas") {
        if (method === "GET") return ok(ordered(lists.filter(l => l.quadroId === id)).map(l => ({...l, tarefas: ordered(tasks.filter(t => t.listaId === l.id))})));
        if (method === "POST") {const list = {id: nextId++, nome: name("nome"), posicao: lists.filter(l => l.quadroId === id).length, quadroId: id}; lists.push(list); return ok(list, 201);}
      }
    }
    if (resource === "listas" && idText) {
      const list = lists.find(l => l.id === id); if (!list) return error(404, "Lista não encontrada");
      if (relation === "tarefas") {
        if (method === "GET") return ok(ordered(tasks.filter(t => t.listaId === id)));
        if (method === "POST") {const task: TarefaDetalhe = {id: nextId++, titulo: name("titulo"), descricao: name("descricao") || null, prazo: name("prazo") || null, status: (body.status ?? "A_FAZER") as TarefaDetalhe["status"], listaId: id, posicao: tasks.filter(t => t.listaId === id).length}; tasks.push(task); return ok(task, 201);}
      }
      if (!relation && method === "PUT") {list.nome = name("nome"); return ok(list);}
      if (!relation && method === "DELETE") {removeList(id); normalize(lists.filter(l => l.quadroId === list.quadroId)); return ok();}
      if (relation === "mover" && method === "PATCH") {
        const siblings = ordered(lists.filter(l => l.quadroId === list.quadroId && l.id !== id)); siblings.splice(Number(body.posicao), 0, list); siblings.forEach((l, index) => {l.posicao = index;}); return ok(list);
      }
    }
    if (resource === "tarefas" && idText) {
      const task = tasks.find(t => t.id === id); if (!task) return error(404, "Tarefa não encontrada");
      if (!relation) {
        if (method === "GET") return ok({...task, quadroId: lists.find(l => l.id === task.listaId)?.quadroId});
        if (method === "PUT") {for (const key of ["titulo", "descricao", "prazo", "status"] as const) if (key in body) Object.assign(task, {[key]: body[key] || null}); return ok(task);}
        if (method === "DELETE") {removeTask(id); normalize(tasks.filter(t => t.listaId === task.listaId)); return ok();}
      }
      if (relation === "mover" && method === "PATCH") {
        const target = lists.find(l => l.id === Number(body.listaId ?? task.listaId)); const source = lists.find(l => l.id === task.listaId);
        if (!target || target.quadroId !== source?.quadroId) return error(400, "Lista de destino inválida");
        const oldList = task.listaId; task.listaId = target.id;
        const siblings = ordered(tasks.filter(t => t.listaId === target.id && t.id !== id)); siblings.splice(Number(body.posicao), 0, task); siblings.forEach((t, index) => {t.posicao = index;}); if (oldList !== target.id) normalize(tasks.filter(t => t.listaId === oldList)); return ok(task);
      }
      if (relation === "subtarefas") {
        if (method === "GET") return ok(subtasks.filter(s => s.tarefaId === id));
        if (method === "POST") {const sub = {id: nextId++, titulo: name("titulo"), concluida: false, tarefaId: id}; subtasks.push(sub); return ok(sub, 201);}
      }
      if (relation === "comentarios") {
        if (method === "GET") return ok(comments.filter(c => c.tarefaId === id));
        if (method === "POST") {const comment = {id: nextId++, texto: name("texto"), criadoEm: now(), tarefaId: id, usuarioId: user.id, usuario: {id: user.id, nome: user.nome}}; comments.push(comment); return ok(comment, 201);}
      }
      if (relation === "atribuicoes") {
        if (method === "GET") return ok(assignments.filter(a => a.tarefaId === id));
        if (method === "POST") {const email = name("email"); const assignee = email === user.email ? {...user} : {id: nextId++, nome: email.split("@")[0] || "Alex Lima", email}; if (assignments.some(a => a.tarefaId === id && a.usuario.email === email)) return error(409, "Usuário já atribuído"); const assignment = {id: nextId++, atribuidoEm: now(), tarefaId: id, usuario: assignee}; assignments.push(assignment); return ok(assignment, 201);}
        if (method === "DELETE" && childText) {assignments = assignments.filter(a => !(a.tarefaId === id && a.usuario.id === Number(childText))); return ok();}
      }
    }
    if (resource === "subtarefas" && idText) {
      const sub = subtasks.find(s => s.id === id); if (!sub) return error(404, "Subtarefa não encontrada");
      if (relation === "concluir" && method === "PATCH") {sub.concluida = Boolean(body.concluida); return ok(sub);}
      if (!relation && method === "PUT") {sub.titulo = name("titulo"); return ok(sub);}
      if (!relation && method === "DELETE") {subtasks = subtasks.filter(s => s.id !== id); return ok();}
    }
    if (resource === "comentarios" && idText) {
      const comment = comments.find(c => c.id === id); if (!comment) return error(404, "Comentário não encontrado");
      if (!relation && method === "PUT") {comment.texto = name("texto"); return ok(comment);}
      if (!relation && method === "DELETE") {comments = comments.filter(c => c.id !== id); return ok();}
    }
    return error(501, `Operação não disponível na demonstração: ${method} ${path}`);
  };
}

