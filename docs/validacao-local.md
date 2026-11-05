# Execução e validação local

## Preparar o ambiente

1. Instale as dependências da raiz e do frontend com `npm install`.
2. Instale as dependências dos quatro microsserviços com `npm run install:services`.
3. Copie o arquivo `.env.exemplo` para `.env` em cada pasta de `services/` e configure o PostgreSQL. Use os mesmos valores de `JWT_SECRET` e `INTERNAL_SERVICE_TOKEN` nos quatro serviços.
4. Gere os clientes Prisma e crie as tabelas:

   ```bash
   npm run db:generate:all
   npm run db:push:all
   ```

## Iniciar frontend e APIs

Execute na raiz:

```bash
npm run dev
```

Abra http://localhost:5173. O frontend encaminha as requisições HTTP para o Gateway em `http://localhost:3000`, que usa Auth em `3001`, Users em `3002` e Tasks em `3003`. O comando inicia os cinco processos juntos; Ctrl+C encerra a execução.

O iniciador verifica todas as portas antes de iniciar. Se uma estiver ocupada por outro processo, ele informa o conflito e não encerra esse processo. Se a mesma execução deste projeto já estiver ativa, informa a URL existente.

## Iniciar partes separadas

- `npm run dev:ui`: somente o Vite em http://localhost:5173. Para chamadas reais, o Gateway ainda precisa estar rodando.
- `npm run dev:all`: os quatro serviços de API, sem o frontend.
- `npm run dev:gateway`, `npm run dev:auth`, `npm run dev:user` ou `npm run dev:task`: um serviço específico.
- `npm run dev:demo`: frontend com dados fictícios em http://localhost:5174, sem banco.

O endpoint público de saúde do Gateway é `http://localhost:3000/health`. Ele também verifica a conexão com o banco. A suíte de testes do frontend usa respostas simuladas e não comprova a integração dos microsserviços com o PostgreSQL.
