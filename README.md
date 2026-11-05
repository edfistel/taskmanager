# Task Manager API

Monorepositório com quatro serviços Node.js: `api-gateway`, `auth-service`, `user-service` e `task-service`.

## Requisitos

- Node.js e npm para execução local
- PostgreSQL local ou Docker para execução em containers

## Configuração

1. Disponibilize um banco PostgreSQL vazio chamado `taskmanager` no servidor real ou no provedor. A criação do banco físico depende do servidor/provedor; os schemas e tabelas da aplicação são criados pelos schemas Prisma com `db push`.

2. Copie cada `.env.exemplo` para `.env` na pasta do respectivo serviço. Todos usam o mesmo banco `taskmanager`: Gateway usa `public`, Auth usa `auth`, Users usa `users` e Tasks usa `tasks`. Substitua host, porta, usuário e senha pelos dados do seu PostgreSQL. Codifique caracteres especiais do usuário e da senha no formato URL. Use o mesmo `JWT_SECRET` e `INTERNAL_SERVICE_TOKEN` nos quatro serviços.

3. Instale as dependências, gere os clientes Prisma e crie os schemas/tabelas a partir dos quatro arquivos Prisma:

   ```bash
   npm --prefix services/api-gateway install
   npm --prefix services/auth-service install
   npm --prefix services/user-service install
   npm --prefix services/task-service install
   npm run db:generate:all
   npm run db:push:all
   ```

4. Inicie as quatro APIs juntas em modo de desenvolvimento:

   ```bash
   npm run dev:all
   ```

   Para iniciar sem Nodemon:

   ```bash
   npm run start:all
   ```

O gateway recebe chamadas públicas na porta `3000` e encaminha para os serviços internos: autenticação `3001`, usuários `3002` e tarefas `3003`. Cada API tem seu próprio `schema.prisma`, e o comando `db:push` cria as tabelas no schema correspondente do banco compartilhado.

Como alternativa para desenvolvimento, preencha os quatro `.env` e execute `docker compose up --build`. O Compose sobe um PostgreSQL em container com o banco `taskmanager`; cada API executa `prisma db push` usando seu schema. As credenciais definidas no Compose são apenas para desenvolvimento. O volume `taskmanager-data` mantém os dados entre reinicializações. Se esse volume foi criado pela configuração anterior, remova-o para recomeçar do zero; isso apaga os dados contidos nele. `db push` aplica o estado atual do schema Prisma diretamente e não cria arquivos de migration.

## Todas as rotas

As rotas públicas do sistema passam pelo gateway na porta `3000`. Ele encaminha autenticação para `auth-service`, perfil para `user-service` e quadros/tarefas para `task-service`. O gateway valida o JWT nas rotas privadas, e os serviços de usuários e tarefas também o validam antes de executar a operação. O refresh token é enviado no corpo de `/auth/refresh` e `/auth/logout`.

| Método | Caminho | Serviço | Acesso |
| --- | --- | --- | --- |
| `GET` | `/` e `/health` | API Gateway | Público |
| `POST` | `/auth/login` | Gateway → Auth | Público |
| `POST` | `/auth/refresh` | Gateway → Auth | Refresh token |
| `POST` | `/auth/logout` | Gateway → Auth | Refresh token |
| `POST` | `/users/register` | Gateway → Auth | Público; cadastro |
| `PUT` | `/users/alterarSenha` | Gateway → Auth | JWT válido |
| `GET` | `/users/buscarUsuarioPorEmail/:email` | Gateway → Users | JWT válido |
| `GET` | `/users/buscarMeuPerfil` | Gateway → Users | JWT válido |
| `DELETE` | `/users/apagarUsuario` | Gateway → Users | JWT válido |
| `POST`, `GET`, `PUT`, `DELETE` | `/quadros` e `/quadros/:id` | Gateway → Tasks | JWT válido |
| `POST`, `GET` | `/quadros/:quadroId/listas` | Gateway → Tasks | JWT válido |
| `PUT`, `PATCH`, `DELETE` | `/listas/:id` e `/listas/:id/mover` | Gateway → Tasks | JWT válido |
| `POST`, `GET` | `/listas/:listaId/tarefas` | Gateway → Tasks | JWT válido |
| `GET`, `PUT`, `PATCH`, `DELETE` | `/tarefas/:id` e `/tarefas/:id/mover` | Gateway → Tasks | JWT válido |
| `POST`, `GET` | `/tarefas/:tarefaId/subtarefas` | Gateway → Tasks | JWT válido |
| `PUT`, `PATCH`, `DELETE` | `/subtarefas/:id` | Gateway → Tasks | JWT válido |
| `POST`, `GET` | `/tarefas/:tarefaId/comentarios` | Gateway → Tasks | JWT válido |
| `PUT`, `DELETE` | `/comentarios/:id` | Gateway → Tasks | JWT válido |
| `GET` | `/atribuicoes/minhas` | Gateway → Tasks | JWT válido |
| `POST`, `GET` | `/tarefas/:tarefaId/atribuicoes` | Gateway → Tasks | JWT válido |
| `DELETE` | `/tarefas/:tarefaId/atribuicoes/:usuarioId` | Gateway → Tasks | JWT válido |

## Autenticação JWT pelo Postman

O Postman usa somente o gateway (`http://localhost:3000`). Ele encaminha login, cadastro, alteração de senha e sessão para o serviço de autenticação; perfil vai para usuários e recursos do gerenciador vão para tarefas.

Antes de começar, configure o mesmo `JWT_SECRET` nos serviços e inicie os quatro (`npm run dev:gateway`, `npm run dev:auth`, `npm run dev:user` e `npm run dev:task`). No Postman, crie e selecione um Environment, por exemplo `Task Manager Local`, com estas variáveis:

| Variável | Valor inicial |
| --- | --- |
| `baseUrl` | `http://localhost:3000` |
| `accessToken` | (vazio) |
| `refreshToken` | (vazio) |

Em todas as requisições abaixo, selecione **Body > raw > JSON** quando houver um corpo. Não configure autenticação Bearer nas etapas de cadastro, login, renovação ou logout.

### 1. Cadastrar o usuário

- Método e URL: `POST {{baseUrl}}/users/register`
- Aba **Authorization**: `No Auth`
- Corpo:

```json
{
  "nome": "Ana Souza",
  "email": "ana@example.com",
  "senha": "senha1234"
}
```

Envie a requisição. A resposta esperada é `201 Created`, com os dados públicos do usuário no campo `body`:

```json
{
  "success": true,
  "body": { "id": 1, "nome": "Ana Souza", "email": "ana@example.com" }
}
```

O e-mail precisa ser único e a senha deve ter pelo menos 8 caracteres. Se esse e-mail já estiver cadastrado, pule o cadastro e faça login.

### 2. Fazer login e guardar os tokens

- Método e URL: `POST {{baseUrl}}/auth/login`
- Aba **Authorization**: `No Auth`
- Corpo:

```json
{
  "email": "ana@example.com",
  "senha": "senha1234"
}
```

Uma resposta `200 OK` contém os tokens no nível principal do JSON:

```json
{
  "usuario": { "id": 1, "nome": "Ana Souza", "email": "ana@example.com" },
  "accessToken": "...",
  "refreshToken": "..."
}
```

Para o Postman salvar os tokens automaticamente, abra a aba **Scripts > Post-response** dessa requisição e adicione:

```javascript
const resposta = pm.response.json();
pm.environment.set("accessToken", resposta.accessToken);
pm.environment.set("refreshToken", resposta.refreshToken);
```

Envie o login novamente depois de adicionar o script. Confirme que o Environment `Task Manager Local` continua selecionado; sem um Environment selecionado, as variáveis não serão salvas nele.

### 3. Testar uma rota protegida

- Método e URL: `GET {{baseUrl}}/users/buscarMeuPerfil`
- Aba **Authorization**: selecione `Bearer Token` e, no campo **Token**, informe `{{accessToken}}`.
- Não precisa de corpo.

O Postman adiciona o prefixo `Bearer` automaticamente. A resposta `200 OK` deve trazer o perfil do usuário. Para outras rotas protegidas, use a mesma configuração Bearer com `{{accessToken}}`.

### Alterar a senha

- Método e URL: `PUT {{baseUrl}}/users/alterarSenha`
- Aba **Authorization**: `Bearer Token` com `{{accessToken}}`
- Corpo:

```json
{
  "senhaAtual": "senha1234",
  "novaSenha": "outraSenha123"
}
```

### 4. Renovar os tokens

O `accessToken` expira em 15 minutos. Para obter um novo par:

- Método e URL: `POST {{baseUrl}}/auth/refresh`
- Aba **Authorization**: `No Auth`
- Corpo:

```json
{
  "refreshToken": "{{refreshToken}}"
}
```

Em **Scripts > Post-response**, use o mesmo script da etapa de login. Ele substituirá as duas variáveis do Environment. Cada renovação revoga o refresh token anterior; use sempre o valor atualizado salvo em `{{refreshToken}}`.

### 5. Fazer logout

- Método e URL: `POST {{baseUrl}}/auth/logout`
- Aba **Authorization**: `No Auth`
- Corpo:

```json
{
  "refreshToken": "{{refreshToken}}"
}
```

O logout revoga o refresh token. O access token já emitido continua válido até expirar. Depois do logout, faça login novamente para obter tokens válidos.

### Qual token usar

- `accessToken`: informe em **Authorization > Bearer Token** para acessar rotas privadas. Ele é um JWT com validade de 15 minutos.
- `refreshToken`: envie como `refreshToken` no JSON de `{{baseUrl}}/auth/refresh` ou `{{baseUrl}}/auth/logout`. Não o use como Bearer token. A validade armazenada é de 7 dias, e cada renovação gera outro refresh token e revoga o anterior.
- Cadastro (`POST {{baseUrl}}/users/register`) e login (`POST {{baseUrl}}/auth/login`) são públicos. Alteração de senha, perfil, consulta de usuários, exclusão e as rotas de quadros, listas e tarefas exigem access token.

### Respostas comuns

| Status | Significado |
| --- | --- |
| `200 OK` | Login, consulta, atualização, renovação ou logout concluído. |
| `201 Created` | Usuário ou recurso criado. |
| `400 Bad Request` | Campos ausentes ou inválidos. |
| `401 Unauthorized` | Credenciais ou token ausentes, inválidos ou expirados. |
| `403 Forbidden` | Usuário autenticado sem permissão para a ação. |
| `404 Not Found` | Recurso não encontrado ou sem acesso. |
| `409 Conflict` | E-mail já cadastrado. |

## Estrutura do projeto

```text
services/
├── api-gateway/             # Ponto de entrada HTTP e encaminhamento
├── auth-service/            # Login, sessão, cadastro e credenciais
├── user-service/            # Perfil e operações de conta
└── task-service/            # Quadros, listas, tarefas e demais recursos
docker-compose.yml           # Execução local dos serviços e PostgreSQL
package.json                 # Comandos locais para os quatro serviços
services/run-all-apis.cjs    # Inicia ou encerra os quatro processos juntos
services/*/prisma/schema.prisma # Modelos e schema de cada API no PostgreSQL
```

Cada serviço possui um README com suas rotas, variáveis de ambiente e comandos: [API Gateway](services/api-gateway/README.md), [Auth Service](services/auth-service/README.md), [User Service](services/user-service/README.md) e [Task Service](services/task-service/README.md).

## Banco e schemas Prisma

O projeto usa o banco PostgreSQL `taskmanager`, com um schema Prisma por serviço. Os quatro `schema.prisma` apontam para o mesmo banco e definem onde ficam suas tabelas:

| Serviço | Schema | Dados armazenados |
| --- | --- | --- |
| API Gateway | `public` | Versões do sistema, portas/estado das APIs e logs de tráfego (`ApiLog`). |
| Auth | `auth` | Credenciais e refresh tokens. |
| Users | `users` | Perfis de usuário. |
| Tasks | `tasks` | Quadros, tarefas e projeção pública dos usuários. |

`npm run db:push:all` executa `prisma db push` para cada serviço e cria/atualiza os schemas e tabelas descritos nos arquivos Prisma, sem criar histórico de migrations. Se preferir migrations, use `npm run db:migrate:all`; esse comando cria e aplica migrations para cada serviço. O serviço de tarefas mantém uma projeção local do usuário para atribuições e comentários; cadastro e exclusão sincronizam os dados por chamadas internas autenticadas.

## Observabilidade do Gateway

O Gateway consulta `/health` das APIs Auth, Users e Tasks a cada 10 segundos. Considera uma API ativa quando `/health` responde com HTTP 2xx. Registra porta, versão, estado, última verificação e eventos de indisponibilidade/recuperação. `GET /internal/status` retorna a versão ativa do sistema, quantas APIs estão registradas/ativas e os dados de cada serviço. Proteja a rota enviando o header `x-internal-service-token` com o mesmo `INTERNAL_SERVICE_TOKEN` configurado nos serviços, por exemplo: `curl -H "x-internal-service-token: SEU_TOKEN" http://localhost:3000/internal/status`.

Cada requisição encaminhada grava serviço, método HTTP, endpoint normalizado, status e duração no modelo `ApiLog`. O endpoint não inclui query string, e IDs numéricos/UUIDs e e-mails são substituídos por parâmetros; o Gateway não grava corpo, headers ou tokens. Logs e eventos de disponibilidade são removidos após 30 dias por padrão; ajuste `GATEWAY_LOG_RETENTION_DAYS` no `.env` do Gateway.

## Scripts disponíveis

| Comando | Descrição |
| --- | --- |
| `npm run dev:gateway` / `npm run start:gateway` | Inicia o Gateway público na porta `3000`. |
| `npm run dev:auth` / `npm run start:auth` | Inicia autenticação na porta `3001`. |
| `npm run dev:user` / `npm run start:user` | Inicia usuários na porta `3002`. |
| `npm run dev:task` / `npm run start:task` | Inicia tarefas na porta `3003`. |
| `npm run dev:all` / `npm run start:all` | Inicia as quatro APIs juntas. |
| `npm run db:format:<serviço>` / `npm run db:format:all` | Formata um ou todos os schemas Prisma. |
| `npm run db:validate:<serviço>` / `npm run db:validate:all` | Valida um ou todos os schemas Prisma. |
| `npm run db:generate:<serviço>` / `npm run db:generate:all` | Gera os clientes Prisma de um ou de todos os serviços. |
| `npm run db:migrate:<serviço>` / `npm run db:migrate:all` | Cria e aplica migrations com Prisma Migrate. |
| `npm run db:push:all` | Cria/atualiza os quatro schemas e tabelas pelo Prisma. |
| `npm run db:push:gateway`, `npm run db:push:auth`, `npm run db:push:user`, `npm run db:push:task` | Cria/atualiza o schema de uma API. |
| `npm run db:studio:<serviço>` | Abre o Prisma Studio na porta `5555`, conectado ao banco configurado para o serviço. |
| `npm run db:studio:all` | Abre uma instância do Prisma Studio na porta `5555`; use o seletor de schemas para alternar entre `public`, `auth`, `users` e `tasks`. Encerre com `Ctrl+C`. |
| `npm run db:reset:<serviço>` / `npm run db:reset:all` | Reinicia o(s) schema(s) alvo(s) reaplicando as migrations; apaga os dados e deve ser usado apenas em desenvolvimento. |

Os nomes válidos para `<serviço>` são `gateway`, `auth`, `user` e `task`. Os comandos `db:*:all` aplicam a operação aos quatro serviços; `db:studio:all` usa uma única conexão ao banco compartilhado e deixa a troca de schema disponível na interface.
