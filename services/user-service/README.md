# User Service

Responsável por todos os dados e operações de conta: cadastro, credenciais, autenticação da senha, perfil, alteração de senha e exclusão. Senhas são armazenadas com hash Argon2id. Os demais serviços consultam os dados de usuário por rotas internas, sem manter cópias da tabela de usuários.

## Porta e rotas

Por padrão, o serviço escuta na porta `3002`. Em uso normal, acesse pelo Gateway em `http://localhost:3000`.

| Método | Caminho | Acesso | Descrição |
| --- | --- | --- | --- |
| `GET` | `/health` | Público | Estado do serviço e conexão com o banco |
| `POST` | `/users/register` | Público | Cria a conta |
| `PUT` | `/users/alterarSenha` | JWT | Altera a senha da conta autenticada |
| `GET` | `/users/buscarMeuPerfil` | JWT | Retorna o perfil associado ao token |
| `GET` | `/users/buscarUsuarioPorEmail/:email` | JWT | Consulta um perfil pelo e-mail |
| `DELETE` | `/users/apagarUsuario` | JWT | Apaga a conta autenticada e sincroniza a remoção em Auth e Tasks |
| `POST` | `/internal/authenticate` | Header interno | Verifica credenciais para o Auth Service |
| `GET` | `/internal/users/:id` | Header interno | Consulta dados públicos para renovar a sessão |
| `POST` | `/internal/users/by-email` | Header interno | Consulta um usuário para atribuição de tarefa |
| `POST` | `/internal/users/by-ids` | Header interno | Consulta usuários para exibir comentários e atribuições |

As rotas internas exigem `x-internal-service-token` igual a `INTERNAL_SERVICE_TOKEN`. Não são chamadas pelo cliente final.

### Cadastro e alteração de senha

`POST /users/register` recebe `nome`, `email` e `senha`. Nome e e-mail são obrigatórios; a senha deve ter pelo menos 8 caracteres. E-mails são normalizados para minúsculas.

`PUT /users/alterarSenha` exige JWT e recebe `{ "senhaAtual": "...", "novaSenha": "..." }`. A nova senha precisa ter pelo menos 8 caracteres.

## Banco de dados

Usa o schema `users` no banco PostgreSQL compartilhado `taskmanager`. A tabela `Usuario` é a fonte única dos dados de usuário e contém id, nome, e-mail, hash da senha e data de criação. O banco físico deve existir antes de executar `db:push`.

## Configuração

Copie `.env.exemplo` para `.env` e ajuste:

| Variável | Uso |
| --- | --- |
| `DATABASE_URL` | Conexão PostgreSQL com `?schema=users` |
| `USER_SERVICE_PORT` | Porta HTTP; padrão `3002` |
| `JWT_SECRET` | Mesmo segredo usado pelo Auth para assinar access tokens |
| `INTERNAL_SERVICE_TOKEN` | Segredo compartilhado para chamadas internas |
| `AUTH_SERVICE_URL` | URL interna do Auth, usada para revogar refresh tokens ao excluir uma conta |
| `TASK_SERVICE_URL` | URL interna do Tasks, usada para remover os dados da conta na exclusão |

## Comandos

Execute a partir da raiz do monorepositório:

```bash
npm --prefix services/user-service install
npm run db:generate:user
npm run db:push:user
npm run dev:user
```

`npm run start:user` inicia sem Nodemon. Use `npm run dev:all` ou `npm run start:all` para iniciar todos os serviços.

Para administrar o schema Users, use `npm run db:format:user`, `npm run db:validate:user`, `npm run db:studio:user` ou `npm run db:reset:user`. `npm run db:push:user` sincroniza diretamente o schema; `db:reset:user` recria suas tabelas a partir do Prisma e apaga os dados existentes, sem executar migrations. O Studio abre na porta `5555`; como os serviços compartilham o banco, você também pode selecionar outro schema na interface. Os comandos `db:*:all` aplicam a operação aos quatro serviços; `npm run db:studio:all` abre uma única instância. Use `db:reset:*` apenas quando quiser apagar os dados.
