# Task Service

Responsável pelos quadros, listas, tarefas, subtarefas, comentários e atribuições. Cada recurso pertence a um usuário e as rotas de negócio exigem access token JWT válido.

## Porta e rotas

Por padrão, o serviço escuta na porta `3003`. Em uso normal, acesse os recursos pelo Gateway em `http://localhost:3000`. Envie `Authorization: Bearer <accessToken>` nas rotas privadas.

| Método | Caminho | Descrição |
| --- | --- | --- |
| `GET` | `/` | Nome e versão do serviço |
| `GET` | `/health` | Estado do serviço e conexão com o banco |
| `POST`, `GET` | `/quadros` | Cria ou lista os quadros do usuário autenticado |
| `GET`, `PUT`, `DELETE` | `/quadros/:id` | Consulta, atualiza ou apaga um quadro |
| `POST`, `GET` | `/quadros/:quadroId/listas` | Cria ou lista listas do quadro |
| `PUT`, `DELETE` | `/listas/:id` | Renomeia ou apaga uma lista |
| `PATCH` | `/listas/:id/mover` | Altera a posição da lista |
| `POST`, `GET` | `/listas/:listaId/tarefas` | Cria ou lista tarefas da lista |
| `GET`, `PUT`, `DELETE` | `/tarefas/:id` | Consulta, atualiza ou apaga uma tarefa |
| `PATCH` | `/tarefas/:id/mover` | Move uma tarefa entre posições/listas |
| `POST`, `GET` | `/tarefas/:tarefaId/subtarefas` | Cria ou lista subtarefas |
| `PUT`, `DELETE` | `/subtarefas/:id` | Renomeia ou apaga uma subtarefa |
| `PATCH` | `/subtarefas/:id/concluir` | Altera o estado de conclusão |
| `POST`, `GET` | `/tarefas/:tarefaId/comentarios` | Cria ou lista comentários |
| `PUT`, `DELETE` | `/comentarios/:id` | Edita ou apaga um comentário |
| `GET` | `/atribuicoes/minhas` | Lista tarefas atribuídas ao usuário autenticado |
| `POST`, `GET` | `/tarefas/:tarefaId/atribuicoes` | Atribui ou lista usuários atribuídos à tarefa |
| `DELETE` | `/tarefas/:tarefaId/atribuicoes/:usuarioId` | Remove uma atribuição |
| `POST` | `/internal/users` | Provisiona a projeção do usuário; header interno obrigatório |
| `DELETE` | `/internal/users/:id` | Remove a projeção do usuário; header interno obrigatório |

O serviço valida o JWT também quando recebe chamadas diretas, além da validação feita pelo Gateway. Rotas `/internal` usam `x-internal-service-token` e são destinadas às chamadas entre serviços.

## Banco de dados

Usa o schema `tasks` no banco PostgreSQL compartilhado `taskmanager`. O Prisma define quadros, listas, tarefas, subtarefas, comentários, atribuições, status e uma projeção de usuário para relacionar os recursos. O banco físico deve existir antes de executar `db:push`.

## Configuração

Copie `.env.exemplo` para `.env` e ajuste:

| Variável | Uso |
| --- | --- |
| `DATABASE_URL` | Conexão PostgreSQL com `?schema=tasks` |
| `TASK_SERVICE_PORT` | Porta HTTP; padrão `3003` |
| `JWT_SECRET` | Mesmo segredo usado pelo Auth para assinar access tokens |
| `INTERNAL_SERVICE_TOKEN` | Segredo compartilhado para chamadas internas |

## Comandos

Execute a partir da raiz do monorepositório:

```bash
npm --prefix services/task-service install
npm run generate:task
npm run db:push:task
npm run dev:task
```

`npm run start:task` inicia sem Nodemon. Use `npm run dev:all` ou `npm run start:all` para iniciar todos os serviços.
