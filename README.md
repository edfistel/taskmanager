# Task Manager / TaskFlow

API REST para gerenciamento de usuários, quadros e tarefas, desenvolvida com Node.js, Express, PostgreSQL e Prisma.

## Requisitos

- Node.js >= 22.12 e npm
- PostgreSQL

## Configuração

1. Instale as dependências:

   ```bash
   npm install
   npm ci --prefix frontend
   ```

2. Se `.env` ainda não existir, copie `.env.exemplo` para `.env` na raiz e preencha os dados de um PostgreSQL em execução. Configure `DATABASE_URL` para as operações do Prisma e as variáveis `DB_USER`, `DB_HOST`, `DB_DATABASE`, `DB_PASSWORD` e `DB_PORT` para o mesmo banco usado pela aplicação. Configure também `JWT_SECRET` com uma chave aleatória secreta. Não substitua um `.env` existente.

3. Crie ou atualize as tabelas do banco:

   ```bash
   npm run migrate
   ```

4. Inicie o servidor:

   ```bash
   npm run dev
   ```

Abra **http://localhost:3000/**. O comando da raiz inicia a interface Vite na porta `3000` e a API interna na porta `3001`. Sem sessão, a interface redireciona para `/login`; a aba **Criar conta** cadastra o usuário e faz login automático. Após entrar, `/` mostra o painel e `/quadros/:quadroId` abre um quadro.

Não execute uma segunda API junto com `npm run dev`: o frontend já inicia a API. Pare com Ctrl+C qualquer execução antiga antes de reiniciar. A API na porta 3000 da configuração anterior respondia apenas JSON, por isso não exibia login/cadastro.

Para executar somente a API, use `npm run dev:api` (Nodemon) ou `npm start`, na porta `3001` por padrão; `PORT` permite alterar a porta apenas nesse modo. O frontend integrado utiliza a API fixa em `127.0.0.1:3001`, encaminhando as requisições pelo proxy sem precisar de CORS. Navegações HTML em rotas de páginas são atendidas pelo Vite.

Se faltar `.env`, o iniciador integrado informa as variáveis ausentes e encerra. Se `/health` indicar banco desconectado, confira o serviço PostgreSQL, as credenciais e as migrations. Login exige `JWT_SECRET` e as tabelas existentes; apenas abrir a tela não comprova autenticação.

## Todas as rotas

### Desenvolvimento da interface sem banco

Na raiz, execute `npm run dev:ui` para iniciar somente o frontend em http://localhost:3000/login, sem exigir `.env` ou iniciar uma API. Pare outro Vite nessa porta antes de executar o comando. Esse modo permite revisar login, cadastro, validações locais e apresentação; chamadas de cadastro/login ainda precisam da API e do PostgreSQL. Não cria contas nem sessões fictícias e não libera páginas protegidas.

Os testes (`npm test`) exercitam sessão, painel e Kanban com respostas simuladas. Eles não comprovam conexão nem persistência no banco. Consulte `docs/validacao-local.md` para os próximos passos.

Para navegar pelas páginas internas sem PostgreSQL, execute **`npm run dev:demo`** e abra **http://localhost:3002/**. A demonstração usa somente dados fictícios em memória, identificados por uma faixa na tela. É possível experimentar quadros, listas, tarefas, colaboração, atribuições e configurações. As alterações são restauradas ao recarregar. Use o botão de restaurar para reiniciar a prévia. Depois de sair da conta, o login demonstrativo aceita um e-mail válido e senha com pelo menos 8 caracteres; nenhuma credencial real é necessária.

O modo demonstrativo é exclusivo de desenvolvimento (`vite --mode demo`); o build de produção exclui seu código. O modo normal em `localhost:3000` continua exigindo a API e o banco para autenticar e salvar dados reais.

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
| `baseUrl` | `http://localhost:3001` |
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
src/
├── app.js                  # Configuração do Express e registro das rotas
├── server.js               # Inicialização da API na porta 3001 (ou PORT)
├── config/database.js      # Cliente Prisma e conexão com PostgreSQL
├── controllers/
│   └── authControllers.js
├── middlewares/
│   └── authMiddlewares.js  # Validação do access token JWT
├── routes/
│   ├── authRoutes.js
│   ├── users/
│   ├── quadro/
│   ├── lista/
│   ├── tarefa/
│   ├── subtarefa/
│   ├── comentario/
│   ├── atribuicao/
│   └── routes.js           # Raiz da API e verificação de saúde
├── service/authService.js
└── tools/                  # Tokens, validações e utilitários
prisma/
├── schema.prisma           # Modelos e relações do banco
└── migrations/             # Histórico de migrations
```

## Modelo de dados

O schema Prisma define usuários, tokens de atualização, quadros, listas, tarefas, subtarefas, comentários e atribuições de tarefas. As tarefas possuem os status `A_FAZER`, `EM_ANDAMENTO` e `CONCLUIDO`.

## Scripts disponíveis

| Comando | Descrição |
| --- | --- |
| `npm start` | Inicia o servidor com Node.js. |
| `npm run dev` | Inicia frontend (3000) e API (3001). |
| `npm run dev:api` | Inicia somente a API com Nodemon. |
| `npm test` | Executa a suíte de testes do frontend, incluindo sessão e autenticação. |
| `npm run build` | Verifica TypeScript e gera o build do frontend. |
| `npm run generate` | Gera o cliente Prisma. |
| `npm run migrate` | Executa migrations em ambiente de desenvolvimento. |
| `npm run reset` | Redefine o banco e reaplica as migrations; os dados existentes podem ser apagados. |
