# Auth Service

Responsável por validar sessões, emitir e renovar tokens e fazer logout. As contas e credenciais são mantidas exclusivamente pelo User Service; o Auth consulta esse serviço para validar o login e guarda apenas refresh tokens no schema `auth`.

## Porta e rotas

Por padrão, o serviço escuta na porta `3001`. Em uso normal, chame estas rotas pelo Gateway em `http://localhost:3000`.

| Método | Caminho | Acesso | Descrição |
| --- | --- | --- | --- |
| `GET` | `/health` | Público | Estado do serviço e conexão com o banco |
| `POST` | `/auth/login` | Público | Valida credenciais no User Service e emite tokens |
| `POST` | `/auth/refresh` | Público | Rotaciona o refresh token e emite outro par |
| `POST` | `/auth/logout` | Público | Revoga o refresh token informado |
| `DELETE` | `/internal/users/:id` | Header interno | Revoga os refresh tokens; chamado pelo User Service ao excluir uma conta |

As operações internas exigem `x-internal-service-token` igual a `INTERNAL_SERVICE_TOKEN`.

### Login

`POST /auth/login` recebe `{ "email": "pessoa@example.com", "senha": "senha1234" }`. A resposta inclui `usuario`, `accessToken` (validade de 15 minutos) e `refreshToken` (validade de 7 dias). Envie o access token como `Authorization: Bearer <accessToken>` nas rotas protegidas.

### Renovação e logout

`POST /auth/refresh` e `POST /auth/logout` recebem `{ "refreshToken": "..." }`. A renovação revoga o token anterior e retorna um novo `accessToken` e `refreshToken`.

## Banco de dados

Usa o schema `auth` no banco PostgreSQL compartilhado `taskmanager`. O Prisma define somente `RefreshToken`; `usuarioId` identifica o usuário no User Service e não é uma relação com uma tabela local. O banco físico deve existir antes de executar `db:push`.

## Configuração

Copie `.env.exemplo` para `.env` e ajuste:

| Variável | Uso |
| --- | --- |
| `DATABASE_URL` | Conexão PostgreSQL com `?schema=auth` |
| `AUTH_PORT` | Porta HTTP; padrão `3001` |
| `JWT_SECRET` | Chave compartilhada com Gateway, Users e Tasks |
| `INTERNAL_SERVICE_TOKEN` | Segredo compartilhado para chamadas entre serviços |
| `USER_SERVICE_URL` | URL interna do serviço Users, usada para validar credenciais e consultar usuários |

## Comandos

Execute a partir da raiz do monorepositório:

```bash
npm --prefix services/auth-service install
npm run db:generate:auth
npm run db:push:auth
npm run dev:auth
```

`npm run start:auth` inicia sem Nodemon. Use `npm run dev:all` ou `npm run start:all` para iniciar todos os serviços.

Para administrar o schema Auth, use `npm run db:format:auth`, `npm run db:validate:auth`, `npm run db:studio:auth` ou `npm run db:reset:auth`. `npm run db:push:auth` sincroniza diretamente o schema; `db:reset:auth` recria suas tabelas a partir do Prisma e apaga os dados existentes, sem executar migrations.
