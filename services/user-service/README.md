# User Service

Responsável pelas operações de perfil e conta. As credenciais ficam no Auth Service; este serviço mantém os dados de perfil no schema `users` e uma projeção pública do usuário para consulta e associação com os recursos.

## Porta e rotas

Por padrão, o serviço escuta na porta `3002`. Em uso normal, acesse pelo Gateway em `http://localhost:3000`. As rotas abaixo, exceto health e operações internas, exigem `Authorization: Bearer <accessToken>`.

| Método | Caminho | Acesso | Descrição |
| --- | --- | --- | --- |
| `GET` | `/health` | Público | Estado do serviço e conexão com o banco |
| `GET` | `/users/buscarMeuPerfil` | JWT | Retorna o perfil associado ao token |
| `GET` | `/users/buscarUsuarioPorEmail/:email` | JWT | Consulta um perfil pelo e-mail |
| `DELETE` | `/users/apagarUsuario` | JWT | Apaga a conta autenticada e sincroniza a remoção nos serviços dependentes |
| `POST` | `/internal/users` | Header interno | Provisiona uma projeção de usuário; chamado pelo Auth |
| `DELETE` | `/internal/users/:id` | Header interno | Remove a projeção; chamado pelo Auth ou pelo próprio fluxo de exclusão |

As rotas internas exigem `x-internal-service-token` igual a `INTERNAL_SERVICE_TOKEN`. Não são chamadas pelo cliente final.

## Banco de dados

Usa o schema `users` no banco PostgreSQL compartilhado `taskmanager`. O Prisma define o modelo `Usuario` com id, nome, e-mail e data de criação. O id corresponde ao usuário criado no Auth Service. O banco físico deve existir antes de executar `db:push`.

## Configuração

Copie `.env.exemplo` para `.env` e ajuste:

| Variável | Uso |
| --- | --- |
| `DATABASE_URL` | Conexão PostgreSQL com `?schema=users` |
| `USER_SERVICE_PORT` | Porta HTTP; padrão `3002` |
| `JWT_SECRET` | Mesmo segredo usado pelo Auth para assinar access tokens |
| `INTERNAL_SERVICE_TOKEN` | Segredo compartilhado para chamadas internas |
| `AUTH_SERVICE_URL` | URL interna do Auth, usada na exclusão de conta |
| `TASK_SERVICE_URL` | URL interna do Tasks, usada na exclusão de conta |

## Comandos

Execute a partir da raiz do monorepositório:

```bash
npm --prefix services/user-service install
npm run generate:user
npm run db:push:user
npm run dev:user
```

`npm run start:user` inicia sem Nodemon. Use `npm run dev:all` ou `npm run start:all` para iniciar todos os serviços.
