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
| `DELETE` | `/internal/users/:id` | Remove os quadros, comentários e atribuições do usuário; header interno obrigatório |

O serviço valida o JWT também quando recebe chamadas diretas, além da validação feita pelo Gateway. Rotas `/internal` usam `x-internal-service-token` e são destinadas às chamadas entre serviços.

## Banco de dados

Usa o schema `tasks` no banco PostgreSQL compartilhado `taskmanager`. O Prisma define quadros, listas, tarefas, subtarefas, comentários e atribuições. Os recursos guardam `usuarioId` como um identificador escalar; os dados e credenciais do usuário pertencem somente ao User Service. Para exibir autores de comentários, listar atribuições e localizar usuários por e-mail, Tasks consulta as rotas internas do User Service.

## Configuração

Copie `.env.exemplo` para `.env` e ajuste:

| Variável | Uso |
| --- | --- |
| `DATABASE_URL` | Conexão PostgreSQL com `?schema=tasks` |
| `TASK_SERVICE_PORT` | Porta HTTP; padrão `3003` |
| `JWT_SECRET` | Mesmo segredo usado pelo Auth para assinar access tokens |
| `INTERNAL_SERVICE_TOKEN` | Segredo compartilhado para chamadas internas |
| `USER_SERVICE_URL` | URL interna do User Service; padrão `http://localhost:3002` |

## Comandos

Execute a partir da raiz do monorepositório:

```bash
npm --prefix services/task-service install
npm run db:generate:task
npm run db:push:task
npm run dev:task
```

`npm run start:task` inicia sem Nodemon. Use `npm run dev:all` ou `npm run start:all` para iniciar todos os serviços.

Para administrar o schema Tasks, use `npm run db:format:task`, `npm run db:validate:task`, `npm run db:studio:task` ou `npm run db:reset:task`. `npm run db:push:task` sincroniza diretamente o schema. O reset recria as tabelas pelo Prisma com `db push --force-reset` e apaga os dados do schema. O Studio abre na porta `5555`; como os serviços compartilham o banco, você também pode selecionar outro schema na interface. Os comandos `db:*:all` aplicam a operação aos quatro serviços; `npm run db:studio:all` abre uma única instância.
