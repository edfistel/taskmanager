# Auth Service

Responsável pelo cadastro de credenciais, login, emissão e renovação de tokens, logout e alteração de senha. Senhas são armazenadas com hash Argon2id. Ao cadastrar uma conta, o serviço provisiona a projeção do usuário nos serviços Users e Tasks.

## Porta e rotas

Por padrão, o serviço escuta na porta `3001`. Em uso normal, chame essas rotas pelo Gateway em `http://localhost:3000`.

| Método | Caminho | Acesso | Descrição |
| --- | --- | --- | --- |
| `GET` | `/health` | Público | Estado do serviço e conexão com o banco |
| `POST` | `/auth/login` | Público | Valida credenciais e emite access/refresh tokens |
| `POST` | `/auth/refresh` | Público | Rotaciona o refresh token e emite outro par |
| `POST` | `/auth/logout` | Público | Revoga o refresh token informado |
| `POST` | `/users/register` | Público | Cria a conta e provisiona Users e Tasks |
| `PUT` | `/users/alterarSenha` | Access token JWT | Altera a senha da conta autenticada |
| `DELETE` | `/internal/users/:id` | Header interno | Remove credenciais e tokens; chamado pelo Users |

### Login

`POST /auth/login` recebe:

```json
{
  "email": "pessoa@example.com",
  "senha": "senha1234"
}
```

A resposta inclui `usuario`, `accessToken` (validade de 15 minutos) e `refreshToken` (validade de 7 dias). Envie o access token como `Authorization: Bearer <accessToken>` nas rotas protegidas.

### Cadastro

`POST /users/register` recebe `nome`, `email` e `senha`. O nome e e-mail são obrigatórios; a senha deve ter pelo menos 8 caracteres. E-mails são normalizados para minúsculas. O serviço só conclui o cadastro se provisionar o usuário nos serviços dependentes.

### Renovação e logout

`POST /auth/refresh` e `POST /auth/logout` recebem `{ "refreshToken": "..." }`. A renovação revoga o token anterior e retorna um novo `accessToken` e `refreshToken`.

### Alterar senha

`PUT /users/alterarSenha` exige JWT e recebe `{ "senhaAtual": "...", "novaSenha": "..." }`. A nova senha precisa ter pelo menos 8 caracteres.

## Banco de dados

Usa o schema `auth` no banco PostgreSQL compartilhado `taskmanager`. O Prisma define `Usuario` (credenciais) e `RefreshToken` (sessões renováveis). O banco físico deve existir antes de executar `db:push`.

## Configuração

Copie `.env.exemplo` para `.env` e ajuste:

| Variável | Uso |
| --- | --- |
| `DATABASE_URL` | Conexão PostgreSQL com `?schema=auth` |
| `AUTH_PORT` | Porta HTTP; padrão `3001` |
| `JWT_SECRET` | Chave compartilhada com Gateway, Users e Tasks |
| `INTERNAL_SERVICE_TOKEN` | Segredo compartilhado para chamadas entre serviços |
| `USER_SERVICE_URL` | URL interna do serviço Users |
| `TASK_SERVICE_URL` | URL interna do serviço Tasks |

## Comandos

Execute a partir da raiz do monorepositório:

```bash
npm --prefix services/auth-service install
npm run db:generate:auth
npm run db:push:auth
npm run dev:auth
```

`npm run start:auth` inicia sem Nodemon. Use `npm run dev:all` ou `npm run start:all` para iniciar todos os serviços.

Para administrar o schema Auth, use `npm run db:format:auth`, `npm run db:validate:auth`, `npm run db:migrate:auth`, `npm run db:studio:auth` ou `npm run db:reset:auth`. `npm run db:push:auth` sincroniza diretamente o schema sem histórico de migrations. O Studio abre na porta `5555`; como os serviços compartilham o banco, você também pode selecionar outro schema na interface. Os comandos `db:*:all` aplicam a operação aos quatro serviços; `npm run db:studio:all` abre uma única instância. `db:reset:*` apaga os dados do schema e deve ser usado apenas quando isso for desejado.
