# API Gateway

Entrada HTTP pública do Task Manager. O Gateway encaminha as requisições para os serviços de autenticação, usuários e tarefas. Nas rotas privadas, valida o access token JWT antes de encaminhar a chamada.

## Porta e rotas

Por padrão, o Gateway escuta na porta `3000`. As rotas públicas do sistema devem ser chamadas pela URL do Gateway, por exemplo `http://localhost:3000`.

| Método | Caminho | Destino | Acesso |
| --- | --- | --- | --- |
| `GET` | `/` | Gateway | Público; retorna nome e versão |
| `GET` | `/health` | Gateway | Público; verifica a conexão com o banco |
| `GET` | `/internal/status` | Gateway | Header `x-internal-service-token` obrigatório |
| `POST` | `/auth/login`, `/auth/refresh`, `/auth/logout` | Auth | Público; cada operação valida os dados recebidos |
| `POST` | `/users/register` | Auth | Público |
| `PUT` | `/users/alterarSenha` | Auth | Access token JWT |
| `GET`, `DELETE` | `/users/*` | Users | Access token JWT |
| Vários | `/quadros`, `/listas`, `/tarefas`, `/subtarefas`, `/comentarios`, `/atribuicoes` | Tasks | Access token JWT |

As rotas de recursos são descritas nos READMEs de [Auth](../auth-service/README.md), [Users](../user-service/README.md) e [Tasks](../task-service/README.md). Para rotas privadas, envie `Authorization: Bearer <accessToken>`.

## Observabilidade

O Gateway consulta `/health` dos serviços Auth, Users e Tasks a cada 10 segundos e registra estado, porta, URL, versão e eventos de disponibilidade. `GET /internal/status` retorna a versão do sistema e a quantidade/estado das APIs registradas; exige o header `x-internal-service-token` com o segredo compartilhado entre os serviços.

Chamadas encaminhadas são gravadas em `ApiLog` com serviço, método, endpoint normalizado, status HTTP e duração. O Gateway não armazena corpo, headers ou tokens da requisição. Logs e eventos antigos são removidos após 30 dias por padrão, configurável por `GATEWAY_LOG_RETENTION_DAYS`.

## Banco de dados

O Gateway usa o schema Prisma `public` no banco PostgreSQL compartilhado `taskmanager`. Ele mantém os modelos `ApiVersion`, `ApiService`, `ApiLog` e `ApiAvailabilityEvent`. O banco físico deve existir; o Prisma cria/atualiza o schema e as tabelas.

## Configuração

Copie `.env.exemplo` para `.env` e ajuste os valores:

| Variável | Uso |
| --- | --- |
| `DATABASE_URL` | Conexão PostgreSQL com `?schema=public` |
| `API_GATEWAY_PORT` | Porta HTTP do Gateway; padrão `3000` |
| `AUTH_SERVICE_URL` | URL interna do Auth; padrão `http://localhost:3001` |
| `USER_SERVICE_URL` | URL interna do Users; padrão `http://localhost:3002` |
| `TASK_SERVICE_URL` | URL interna do Tasks; padrão `http://localhost:3003` |
| `AUTH_SERVICE_PORT`, `USER_SERVICE_PORT`, `TASK_SERVICE_PORT` | Portas informadas no status do catálogo |
| `JWT_SECRET` | Mesmo segredo usado para emitir os tokens no Auth |
| `INTERNAL_SERVICE_TOKEN` | Segredo usado para proteger operações e status internos |
| `GATEWAY_LOG_RETENTION_DAYS` | Retenção de logs/eventos; padrão `30` dias |

## Comandos

Execute os comandos a partir da raiz do monorepositório:

```bash
npm --prefix services/api-gateway install
npm run generate:gateway
npm run db:push:gateway
npm run dev:gateway
```

`npm run start:gateway` inicia sem Nodemon. `npm run dev:all` e `npm run start:all` iniciam os quatro serviços pelo script `services/run-all-apis.cjs`.
