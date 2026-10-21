# Task Manager API

API REST para gerenciamento de usuários, quadros e tarefas, desenvolvida com Node.js, Express, PostgreSQL e Prisma.

## Requisitos

- Node.js e npm
- PostgreSQL

## Configuração

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Copie `.env.exemplo` para `.env` e preencha os dados do PostgreSQL. Configure `DATABASE_URL` para as operações do Prisma e as variáveis `DB_USER`, `DB_HOST`, `DB_DATABASE`, `DB_PASSWORD` e `DB_PORT` para a conexão usada pela aplicação.

3. Crie ou atualize as tabelas do banco:

   ```bash
   npm run migrate
   ```

4. Inicie o servidor:

   ```bash
   npm run dev
   ```

O servidor usa a porta `3000`. Para iniciar sem o Nodemon, execute `npm start`.

## Endpoints disponíveis

As rotas respondem em JSON.

| Método | Caminho | Descrição |
| --- | --- | --- |
| `GET` | `/` | Retorna o nome e a versão da API. |
| `GET` | `/health` | Verifica se a aplicação consegue consultar o banco de dados. |
| `GET` | `/users` | Retorna informações básicas da rota de usuários. |

## Estrutura do projeto

```text
src/
├── app.js                  # Configuração do Express e registro das rotas
├── server.js               # Inicialização do servidor na porta 3000
├── config/database.js      # Cliente Prisma e conexão com PostgreSQL
├── routes/
│   ├── routes.js           # Rota inicial e verificação de saúde
│   └── users/              # Rotas, serviço e repositório de usuários
└── tools/versao.js         # Leitura da versão definida em package.json
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
| `npm run dev` | Inicia o servidor com Nodemon. |
| `npm run generate` | Gera o cliente Prisma. |
| `npm run migrate` | Executa migrations em ambiente de desenvolvimento. |
| `npm run reset` | Redefine o banco e reaplica as migrations; os dados existentes podem ser apagados. |
