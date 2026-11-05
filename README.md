# Task Manager

Aplicação de gerenciamento de tarefas com frontend React/Vite e quatro APIs: `api-gateway`, `auth-service`, `user-service` e `task-service`.

## Requisitos

- Node.js >= 22.12 e npm
- PostgreSQL

## Configuração

1. Instale as dependências do repositório e dos serviços:

   ```bash
   npm install
   ```

   O `postinstall` da raiz instala o frontend. Instale as dependências dos microsserviços com:

   ```bash
   npm run install:services
   ```

2. Em cada pasta `services/api-gateway`, `services/auth-service`, `services/user-service` e `services/task-service`, copie `.env.exemplo` para `.env`. Configure o mesmo banco PostgreSQL e use os mesmos valores de `JWT_SECRET` e `INTERNAL_SERVICE_TOKEN` nos quatro arquivos. Não substitua arquivos `.env` existentes.

3. Gere os clientes Prisma e crie os schemas/tabelas:

   ```bash
   npm run db:generate:all
   npm run db:push:all
   ```

4. Inicie a aplicação completa:

   ```bash
   npm run dev
   ```

Abra **http://localhost:5173/**. O Vite serve a interface na porta `5173` e encaminha as chamadas HTTP ao API Gateway na porta `3000`. O Gateway encaminha para Auth (`3001`), Users (`3002`) e Tasks (`3003`). Sem sessão, a interface redireciona para `/login`; após entrar, `/` mostra o painel e `/quadros/:quadroId` abre um quadro.

`npm run dev` inicia o frontend e as quatro APIs. Para iniciar somente as APIs, use `npm run dev:all`; para iniciar somente a interface, use `npm run dev:ui`. Encerre o conjunto com Ctrl+C no terminal que iniciou `npm run dev`.

Se alguma porta entre `3000` e `3003`, ou a porta `5173`, estiver ocupada, o iniciador informa o conflito e não encerra processos automaticamente. O modo demonstrativo independente usa a porta `5174`.

## Todas as rotas

### Desenvolvimento da interface sem banco

Na raiz, execute `npm run dev:ui` para iniciar somente o frontend em http://localhost:5173/login, sem iniciar as APIs. Chamadas de cadastro/login ainda precisam que o Gateway e o PostgreSQL estejam disponíveis. Esse modo não cria contas nem sessões fictícias.

Os testes (`npm test`) exercitam sessão, painel e Kanban com respostas simuladas. Eles não comprovam conexão nem persistência no banco. Consulte `docs/validacao-local.md` para os próximos passos.

Para navegar pelas páginas internas sem PostgreSQL, execute **`npm run dev:demo`** e abra **http://localhost:5174/**. A demonstração usa somente dados fictícios em memória, identificados por uma faixa na tela. É possível experimentar quadros, listas, tarefas, colaboração, atribuições e configurações. As alterações são restauradas ao recarregar. Use o botão de restaurar para reiniciar a prévia. Depois de sair da conta, o login demonstrativo aceita um e-mail válido e senha com pelo menos 8 caracteres; nenhuma credencial real é necessária.

O modo demonstrativo é exclusivo de desenvolvimento (`vite --mode demo`); o build de produção exclui seu código. O modo normal em `localhost:5173` usa o Gateway e o banco para autenticar e salvar dados reais.

As rotas respondem em JSON. Use `Authorization: Bearer <accessToken>` nas rotas marcadas como privadas. O refresh token é enviado no corpo de `/auth/refresh` e `/auth/logout`.

| Método | Caminho | Acesso |
| --- | --- | --- |
| `GET` | `/` | Público |
| `GET` | `/health` | Público |
| `POST` | `/auth/login` | Público |
| `POST` | `/auth/refresh` | Refresh token |
| `POST` | `/auth/logout` | Refresh token |
| `POST` | `/users/register` | Público; cadastro |
| `GET` | `/users/buscarUsuarioPorEmail/:email` | Privado |
| `GET` | `/users/buscarMeuPerfil` | Privado |
| `DELETE` | `/users/apagarUsuario` | Privado |
| `PUT` | `/users/alterarSenha` | Privado |
| `POST` | `/quadros` | Privado |
| `GET` | `/quadros` | Privado |
| `GET` | `/quadros/:id` | Privado |
| `PUT` | `/quadros/:id` | Privado |
| `DELETE` | `/quadros/:id` | Privado |
| `POST` | `/quadros/:quadroId/listas` | Privado |
| `GET` | `/quadros/:quadroId/listas` | Privado |
| `PUT` | `/listas/:id` | Privado |
| `PATCH` | `/listas/:id/mover` | Privado |
| `DELETE` | `/listas/:id` | Privado |
| `POST` | `/listas/:listaId/tarefas` | Privado |
| `GET` | `/listas/:listaId/tarefas` | Privado |
| `GET` | `/tarefas/:id` | Privado |
| `PUT` | `/tarefas/:id` | Privado |
| `PATCH` | `/tarefas/:id/mover` | Privado |
| `DELETE` | `/tarefas/:id` | Privado |
| `POST` | `/tarefas/:tarefaId/subtarefas` | Privado |
| `GET` | `/tarefas/:tarefaId/subtarefas` | Privado |
| `PUT` | `/subtarefas/:id` | Privado |
| `PATCH` | `/subtarefas/:id/concluir` | Privado |
| `DELETE` | `/subtarefas/:id` | Privado |
| `POST` | `/tarefas/:tarefaId/comentarios` | Privado |
| `GET` | `/tarefas/:tarefaId/comentarios` | Privado |
| `PUT` | `/comentarios/:id` | Privado |
| `DELETE` | `/comentarios/:id` | Privado |
| `GET` | `/atribuicoes/minhas` | Privado |
| `POST` | `/tarefas/:tarefaId/atribuicoes` | Privado |
| `GET` | `/tarefas/:tarefaId/atribuicoes` | Privado |
| `DELETE` | `/tarefas/:tarefaId/atribuicoes/:usuarioId` | Privado |

## Autenticação JWT pelo Postman

O cadastro e as operações da conta ficam em `/users`. As rotas `/auth` cuidam do login e da sessão: use o `accessToken` nas rotas protegidas e envie o `refreshToken` apenas para renovar a sessão ou fazer logout.

Antes de começar, configure `JWT_SECRET` no `.env` com uma chave secreta e inicie a API (`npm run dev`). No Postman, crie e selecione um Environment, por exemplo `Task Manager Local`, com estas variáveis:

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
- `refreshToken`: envie como `refreshToken` no JSON de `/auth/refresh` ou `/auth/logout`. Não o use como Bearer token. A validade armazenada é de 7 dias, e cada renovação gera outro refresh token e revoga o anterior.
- `POST /users/register` (cadastro) e `/auth/login` são públicas. As rotas `/users/buscarUsuarioPorEmail/:email`, `/users/buscarMeuPerfil`, `/users/apagarUsuario`, `/users/alterarSenha` e as rotas de quadros, listas e tarefas exigem o access token.

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
frontend/                   # Interface React e proxy de desenvolvimento para o Gateway
services/
├── api-gateway/             # API pública na porta 3000
├── auth-service/            # Autenticação na porta 3001
├── user-service/            # Usuários na porta 3002
├── task-service/            # Quadros, listas e tarefas na porta 3003
├── run-all-apis.cjs         # Inicia os quatro serviços
└── run-db-studio.cjs        # Abre Prisma Studio
```

## Modelo de dados

O schema Prisma define usuários, tokens de atualização, quadros, listas, tarefas, subtarefas, comentários e atribuições de tarefas. As tarefas possuem os status `A_FAZER`, `EM_ANDAMENTO` e `CONCLUIDO`.

## Scripts disponíveis

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Inicia o frontend e as quatro APIs; UI em `5173`, Gateway em `3000`. |
| `npm run dev:ui` | Inicia somente a interface. |
| `npm run dev:all` / `npm start` | Inicia os quatro serviços sem o frontend. |
| `npm run dev:<serviço>` / `npm run start:<serviço>` | Inicia um serviço; nomes: `gateway`, `auth`, `user`, `task`. |
| `npm run build` | Verifica TypeScript e gera o build do frontend. |
| `npm test` | Executa os testes do frontend. |
| `npm run db:format:<serviço>` / `npm run db:format:all` | Formata um ou todos os schemas Prisma. |
| `npm run db:validate:<serviço>` / `npm run db:validate:all` | Valida um ou todos os schemas Prisma. |
| `npm run db:generate:<serviço>` / `npm run db:generate:all` | Gera um ou todos os clientes Prisma. |
| `npm run db:push:<serviço>` / `npm run db:push:all` | Cria/atualiza as tabelas descritas nos schemas Prisma. |
| `npm run db:migrate:<serviço>` / `npm run db:migrate:all` | Cria/aplica migrations Prisma. |
| `npm run db:studio:<serviço>` / `npm run db:studio:all` | Abre Prisma Studio para um serviço ou para o banco compartilhado. |
| `npm run db:reset:<serviço>` / `npm run db:reset:all` | Apaga e recria os dados/migrations; use com cuidado. |
