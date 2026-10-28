# TaskFlow Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir o frontend completo do TaskFlow em `frontend/`, integrado à API existente sem alterar o backend, acessível em `http://localhost:3000` e responsivo em desktop, tablet e celular.

**Architecture:** Uma SPA React + TypeScript usa React Router em modo declarativo e TanStack Query para estado remoto. O Vite ocupa a porta pública `3000`; uma ponte pertencente ao frontend importa `src/app.js`, inicia o Express existente em `3001` e encaminha as rotas da API pela mesma origem. O estado visual usa tokens CSS e preferências locais; o estado de sessão coordena refresh rotativo single-flight.

**Tech Stack:** React, TypeScript, Vite, React Router, TanStack Query, dnd kit (`@dnd-kit/react`, `@dnd-kit/dom`, `@dnd-kit/helpers`), CSS Modules/tokens CSS, Vitest, Testing Library e jsdom.

**Spec:** `docs/superpowers/specs/2026-10-28-taskflow-frontend-design.md`

## Global Constraints

- Trabalhar somente na branch `front`; não fazer push, Pull Request ou merge sem autorização explícita ao final.
- Criar todo código novo de aplicação em `frontend/`; não alterar `src/`, `prisma/` nem o `package.json` raiz.
- Interface pública em `localhost:3000`; ponte interna da API em `localhost:3001`; nenhum CORS novo.
- A ponte deve mudar o diretório de trabalho para a raiz antes de importar `src/app.js`, preservando o `.env` raiz.
- Node.js `>=22.12.0`, compatível com o Vitest atual.
- Nome e marca: TaskFlow com símbolo T; verde-água funcional, azul-marinho, temas claro/escuro equivalentes.
- Sem avatar, OAuth, recuperação de senha, anexos, etiquetas ou edição de nome/e-mail.
- Cartões Kanban mostram somente título, status e prazo; não buscar detalhes por cartão.
- Coluna e status são independentes; mover não altera status.
- Densidade confortável é padrão; compacta é opcional; redução de movimento deve ser respeitada.
- Breakpoints: desktop `>=1200px`, tablet `768–1199px`, celular `<768px`.
- Nenhuma ação depende somente de hover; drag-and-drop precisa de teclado e alternativa “Mover para...”.
- Proprietário, responsável e usuário sem acesso recebem interfaces diferentes, conforme a API.
- Animações de `160–220ms`, preferencialmente `transform` e `opacity`; nenhuma biblioteca visual completa.
- Ao final de cada tarefa que altera uma tela (Tasks 4–7 e 9–13), iniciar a prévia local e apresentá-la ao usuário antes de avançar para a próxima tela; incorporar os ajustes aprovados na mesma tarefa.

## Review Focus

1. **Refresh rotativo concorrente:** várias respostas `401` simultâneas devem produzir exatamente uma chamada de refresh e repetir cada requisição no máximo uma vez. Coberto em Task 3.
2. **Drag-and-drop com falha:** movimento entre listas deve atualizar otimisticamente, reverter ordem/lista em erro e nunca alterar status. Coberto em Task 8.
3. **Permissão ambígua em Minhas atribuições:** proprietário atribuído a si mesmo recebe painel completo; responsável comum recebe colaboração reduzida; recurso estranho mostra mensagem genérica. Coberto em Task 11.
4. **Toque versus rolagem:** gesto móvel não pode iniciar drag acidentalmente; “Mover para...” deve executar a mesma operação sem gesto. Coberto em Tasks 8 e 13.
5. **Data sem fuso:** `2026-11-02` deve permanecer `2026-11-02` em qualquer timezone; limpar deve enviar remoção do prazo. Coberto em Task 7.

---

## File Structure Map

```text
frontend/
├── package.json                         # scripts e dependências isoladas
├── package-lock.json                    # lockfile do frontend
├── vite.config.ts                       # porta 3000, proxy e build
├── vitest.config.ts                     # ambiente jsdom e setup
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── index.html
├── scripts/
│   ├── paths.mjs                        # raiz do repo e configuração do proxy
│   ├── api-bridge.mjs                   # inicia o app Express em 3001
│   └── run-pair.mjs                     # coordena API + Vite dev/preview
├── src/
│   ├── main.tsx                         # providers e montagem
│   ├── app/
│   │   ├── App.tsx                      # RouterProvider/rotas
│   │   ├── routes.tsx                   # árvore declarativa e lazy routes
│   │   └── queryClient.ts               # defaults do TanStack Query
│   ├── lib/
│   │   ├── api/
│   │   │   ├── types.ts                 # contratos comuns e modelos da API
│   │   │   ├── errors.ts                # ApiError e normalização
│   │   │   ├── transport.ts             # fetch JSON público/autenticado
│   │   │   └── queryKeys.ts             # chaves de cache estáveis
│   │   ├── auth/
│   │   │   ├── tokenStorage.ts          # sessionStorage/localStorage
│   │   │   ├── sessionManager.ts        # login/bootstrap/refresh/logout
│   │   │   └── AuthProvider.tsx          # contexto React
│   │   ├── preferences/
│   │   │   ├── preferences.ts           # load/save/resolve
│   │   │   └── PreferencesProvider.tsx
│   │   └── date.ts                       # data de API sem deslocamento de fuso
│   ├── components/
│   │   ├── brand/TaskFlowLogo.tsx
│   │   ├── feedback/                     # ErrorState, EmptyState, Skeleton, Toast
│   │   ├── overlays/                     # Modal, Drawer, ConfirmDialog
│   │   └── layout/                       # AppShell, SideNav, MobileNav
│   ├── features/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── boards/
│   │   ├── tasks/
│   │   ├── assignments/
│   │   └── settings/
│   ├── styles/                           # tokens, reset, tema e utilitários
│   └── test/setup.ts
└── tests/                                # testes de integração entre features
```

Arquivos por feature ficam junto de seus testes (`*.test.ts`/`*.test.tsx`). Componentes devem permanecer focados; nenhum arquivo de página deve acumular API, estado de sessão e apresentação ao mesmo tempo.

### Task 1: Frontend Scaffold and Same-Origin Local Bridge

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/package-lock.json`
- Create: `frontend/tsconfig.json`
- Create: `frontend/tsconfig.app.json`
- Create: `frontend/tsconfig.node.json`
- Create: `frontend/vite.config.ts`
- Create: `frontend/vitest.config.ts`
- Create: `frontend/index.html`
- Create: `frontend/scripts/paths.mjs`
- Create: `frontend/scripts/paths.test.ts`
- Create: `frontend/scripts/api-bridge.mjs`
- Create: `frontend/scripts/run-pair.mjs`
- Create: `frontend/src/main.tsx`
- Create: `frontend/src/app/App.tsx`
- Create: `frontend/src/test/setup.ts`
- Modify: `.gitignore`

**Interfaces:**
- Produces: `repoRootFrom(importMetaUrl: string): string`
- Produces: `PROXY_PREFIXES: readonly string[]`
- Produces: `makeProxyConfig(target: string): Record<string, { target: string; changeOrigin: boolean }>`
- Produces: scripts `npm run dev`, `npm run build`, `npm run preview`, `npm test`

- [ ] **Step 1: Write the failing bridge configuration test**

Create `frontend/scripts/paths.test.ts` with tests that assert:

```ts
expect(repoRootFrom(import.meta.url)).toMatch(/taskmanager$/)
expect(PROXY_PREFIXES).toEqual([
  "/health", "/auth", "/users", "/quadros", "/listas",
  "/tarefas", "/subtarefas", "/comentarios", "/atribuicoes",
])
expect(makeProxyConfig("http://127.0.0.1:3001")["/auth"].target)
  .toBe("http://127.0.0.1:3001")
```

- [ ] **Step 2: Run the focused test and verify failure**

Run: `cd frontend; npm test -- scripts/paths.test.ts`  
Expected: FAIL because `paths.mjs` exports do not exist.

- [ ] **Step 3: Scaffold dependencies and implement the bridge contracts**

Use current packages confirmed by their official docs. `vite.config.ts` must set `server.port = 3000`, `server.strictPort = true`, `server.proxy = makeProxyConfig(...)`, and equivalent preview settings. `api-bridge.mjs` resolves/chdirs to the repository root before dynamically importing `src/app.js`, then listens on `127.0.0.1:3001`. `run-pair.mjs` starts the bridge and Vite, forwards termination signals, and exits non-zero if either child fails.

- [ ] **Step 4: Add a minimal TaskFlow placeholder and test setup**

`App.tsx` renders the T mark and “TaskFlow”. `src/test/setup.ts` imports jest-dom matchers. Add `.vitest/`, `frontend/dist/` and frontend coverage artifacts to `.gitignore` without removing `.superpowers/`.

- [ ] **Step 5: Verify scaffold, proxy contracts and production build**

Run: `cd frontend; npm test -- scripts/paths.test.ts; npm run build`  
Expected: focused test PASS; TypeScript and Vite build succeed; output appears only in `frontend/dist/`.

- [ ] **Step 6: Commit locally**

```bash
git add .gitignore frontend
git commit -m "chore(frontend): scaffold TaskFlow and local API bridge"
```

### Task 2: Typed API Transport and Error Normalization

**Files:**
- Create: `frontend/src/lib/api/types.ts`
- Create: `frontend/src/lib/api/errors.ts`
- Create: `frontend/src/lib/api/errors.test.ts`
- Create: `frontend/src/lib/api/transport.ts`
- Create: `frontend/src/lib/api/transport.test.ts`
- Create: `frontend/src/lib/api/queryKeys.ts`
- Create: `frontend/src/app/queryClient.ts`

**Interfaces:**
- Produces: domain types `Usuario`, `Quadro`, `ListaComTarefas`, `TarefaResumo`, `TarefaDetalhe`, `Subtarefa`, `Comentario`, `Atribuicao`, `MinhaAtribuicao`, `StatusTarefa`
- Produces: `class ApiError extends Error { status: number; payload: unknown }`
- Produces: `extractApiMessage(payload: unknown, fallback: string): string`
- Produces: `requestJson<T>(path: string, options?: RequestJsonOptions): Promise<T>`
- Produces: `createAuthenticatedTransport(base: JsonTransport, session: SessionPort): JsonTransport`
- Produces: `queryClient` com retry controlado e cache sem refetch agressivo em foco
- Consumes later: `SessionPort = { getAccessToken(): string | null; refresh(): Promise<string | null>; expire(): void }`

- [ ] **Step 1: Write failing normalization and transport tests**

Cover `{message}`, `{erro}`, `{error}`, non-JSON 500, successful `{success:true,body}`, bearer header insertion, and exactly one retry after `401`.

```ts
expect(extractApiMessage({ erro: "Token inválido" }, "Falha"))
  .toBe("Token inválido")
await expect(request).rejects.toMatchObject({ status: 403 })
expect(fetchMock).toHaveBeenCalledTimes(2) // original + one retry only
```

- [ ] **Step 2: Run tests and verify failure**

Run: `cd frontend; npm test -- src/lib/api/errors.test.ts src/lib/api/transport.test.ts`  
Expected: FAIL because normalization and transport are undefined.

- [ ] **Step 3: Define exact API model fields in `types.ts`**

Mirror public backend responses, including `StatusTarefa = "A_FAZER" | "EM_ANDAMENTO" | "CONCLUIDO"`; keep API dates as strings. Do not add avatar, labels, attachments, board color or card description fields to summary types.

- [ ] **Step 4: Implement `ApiError`, `requestJson`, authenticated wrapper and QueryClient**

The public transport parses JSON defensively. The authenticated wrapper adds `Authorization: Bearer`, calls `session.refresh()` once on `401`, retries once with the new token, and calls `session.expire()` if refresh fails. It must not retry `403`, `404` or a second `401`.

- [ ] **Step 5: Run focused and full tests**

Run: `cd frontend; npm test -- src/lib/api`  
Expected: all API tests PASS.

- [ ] **Step 6: Commit locally**

```bash
git add frontend/src/lib/api
git commit -m "feat(frontend): add typed API transport"
```

### Task 3: Session Manager and Rotating Refresh Tokens

**Files:**
- Create: `frontend/src/lib/auth/tokenStorage.ts`
- Create: `frontend/src/lib/auth/tokenStorage.test.ts`
- Create: `frontend/src/lib/auth/sessionManager.ts`
- Create: `frontend/src/lib/auth/sessionManager.test.ts`
- Create: `frontend/src/lib/auth/AuthProvider.tsx`
- Create: `frontend/src/lib/auth/useAuth.ts`

**Interfaces:**
- Produces: `TokenStorage.read(): string | null`
- Produces: `TokenStorage.write(token: string, persistence: "session" | "local"): void`
- Produces: `TokenStorage.clear(): void`
- Produces: `SessionManager.bootstrap(): Promise<void>`
- Produces: `SessionManager.login(input: {email:string; senha:string; remember:boolean}): Promise<Usuario>`
- Produces: `SessionManager.register(input: {nome:string; email:string; senha:string; remember:boolean}): Promise<Usuario>`
- Produces: `SessionManager.refresh(): Promise<string | null>`
- Produces: `SessionManager.logout(): Promise<void>`
- Produces: `SessionManager.getSnapshot(): AuthSnapshot`
- Produces: React `AuthProvider` and `useAuth()`
- Consumes: `requestJson`, `SessionPort`, `Usuario` from Task 2

- [ ] **Step 1: Write failing storage and session tests**

Tests must assert sessionStorage by default, localStorage only when remember is true, automatic login after registration, bootstrap refresh, logout cleanup, revoked refresh expiry, and the Review Focus concurrency rule:

```ts
const results = await Promise.all([manager.refresh(), manager.refresh(), manager.refresh()])
expect(refreshEndpoint).toHaveBeenCalledTimes(1)
expect(results).toEqual(["new-access", "new-access", "new-access"])
```

- [ ] **Step 2: Run tests and verify failure**

Run: `cd frontend; npm test -- src/lib/auth`  
Expected: FAIL because storage/session interfaces do not exist.

- [ ] **Step 3: Implement token storage with explicit persistence**

Use one stable storage key for refresh token plus persistence metadata. `clear()` removes both local and session copies. Never persist access token.

- [ ] **Step 4: Implement session manager and React provider**

Keep access token and user in memory. Implement a shared `refreshPromise` that rotates the refresh token once. `register()` calls `/users/register` then `/auth/login` using the credentials still in memory; if login fails, return a typed post-registration error that the UI can map to the login tab.

- [ ] **Step 5: Verify auth logic**

Run: `cd frontend; npm test -- src/lib/auth src/lib/api/transport.test.ts`  
Expected: all session and authenticated retry tests PASS.

- [ ] **Step 6: Commit locally**

```bash
git add frontend/src/lib/auth frontend/src/lib/api/transport.test.ts
git commit -m "feat(frontend): manage secure rotating sessions"
```

### Task 4: Design Tokens, Preferences, App Shell and Authentication UI

**Files:**
- Create: `frontend/src/styles/tokens.css`
- Create: `frontend/src/styles/global.css`
- Create: `frontend/src/styles/themes.css`
- Create: `frontend/src/lib/preferences/preferences.ts`
- Create: `frontend/src/lib/preferences/preferences.test.ts`
- Create: `frontend/src/lib/preferences/PreferencesProvider.tsx`
- Create: `frontend/src/components/brand/TaskFlowLogo.tsx`
- Create: `frontend/src/components/layout/AppShell.tsx`
- Create: `frontend/src/components/layout/SideNav.tsx`
- Create: `frontend/src/components/layout/MobileNav.tsx`
- Create: `frontend/src/components/layout/layout.module.css`
- Create: `frontend/src/components/overlays/Modal.tsx`
- Create: `frontend/src/components/overlays/Drawer.tsx`
- Create: `frontend/src/components/overlays/ConfirmDialog.tsx`
- Create: `frontend/src/components/overlays/ConfirmDialog.test.tsx`
- Create: `frontend/src/components/feedback/ToastProvider.tsx`
- Create: `frontend/src/features/auth/AuthPage.tsx`
- Create: `frontend/src/features/auth/ProtectedRoute.tsx`
- Create: `frontend/src/features/auth/LoginForm.tsx`
- Create: `frontend/src/features/auth/RegisterForm.tsx`
- Create: `frontend/src/features/auth/auth.module.css`
- Create: `frontend/src/features/auth/AuthPage.test.tsx`
- Create: `frontend/src/app/routes.tsx`
- Modify: `frontend/src/app/App.tsx`
- Modify: `frontend/src/main.tsx`

**Interfaces:**
- Produces: `Preferences = { theme: "system"|"light"|"dark"; density: "comfortable"|"compact"; reduceMotion: boolean }`
- Produces: `loadPreferences()`, `savePreferences(next)`, `resolveTheme(preference, systemDark)`
- Produces: `ProtectedRoute`, `AppShell`, `Modal`, `Drawer`, `ConfirmDialog`, `useToast()`
- Consumes: `AuthProvider`, `useAuth()` from Task 3

- [ ] **Step 1: Write failing preference and auth-page tests**

Assert system theme resolution, persistence, comfortable default, reduced-motion class, login payload, registration password confirmation, automatic route transition on success, protected redirect to `/login`, and typed/standard/compact confirmation behavior.

- [ ] **Step 2: Run tests and verify failure**

Run: `cd frontend; npm test -- src/lib/preferences src/features/auth/AuthPage.test.tsx`  
Expected: FAIL because providers and forms are missing.

- [ ] **Step 3: Implement tokens and preference provider**

Define semantic colors rather than component-specific hardcoded values. Set `data-theme`, `data-density` and reduced-motion state on the document root. Do not include a “mostrar descrições” preference.

- [ ] **Step 4: Implement accessible overlays and responsive shell**

`Modal`/`Drawer`/`ConfirmDialog` must label content, close on Escape, trap focus, restore focus on close and expose no hover-only action. `ConfirmDialog` supports `level: "compact"|"standard"|"typed"` and optional `confirmationText`. Desktop uses side navigation; mobile navigation is rendered for `<768px` through CSS, not user-agent detection.

- [ ] **Step 5: Implement login/register UI and routes**

Routes: `/login`, protected `/`, `/quadros/:quadroId`, `/atribuicoes`. Auth page uses tabs, TaskFlow T, theme toggle, inline errors and native form semantics. No Google, avatar or recovery controls.

- [ ] **Step 6: Verify behavior, accessibility basics and build**

Run: `cd frontend; npm test -- src/lib/preferences src/features/auth src/components/overlays/ConfirmDialog.test.tsx; npm run build`  
Expected: tests PASS and build succeeds.

- [ ] **Step 7: Commit locally**

```bash
git add frontend/src
git commit -m "feat(frontend): add TaskFlow shell themes and authentication UI"
```

### Task 5: Dashboard and Board Lifecycle

**Files:**
- Create: `frontend/src/features/dashboard/boardsApi.ts`
- Create: `frontend/src/features/dashboard/useBoards.ts`
- Create: `frontend/src/features/dashboard/DashboardPage.tsx`
- Create: `frontend/src/features/dashboard/BoardCard.tsx`
- Create: `frontend/src/features/dashboard/BoardFormDialog.tsx`
- Create: `frontend/src/features/dashboard/DeleteBoardDialog.tsx`
- Create: `frontend/src/features/dashboard/dashboard.module.css`
- Create: `frontend/src/features/dashboard/DashboardPage.test.tsx`
- Create: `frontend/src/components/feedback/EmptyState.tsx`
- Create: `frontend/src/components/feedback/ErrorState.tsx`
- Create: `frontend/src/components/feedback/Skeleton.tsx`
- Modify: `frontend/src/app/routes.tsx`

**Interfaces:**
- Produces: `BoardsApi.list(): Promise<Quadro[]>`
- Produces: `BoardsApi.get(id:number): Promise<Quadro>`
- Produces: `BoardsApi.create(input:{nome:string; descricao?:string|null}): Promise<QuadroCriado>`
- Produces: `BoardsApi.update(id:number,input:{nome?:string;descricao?:string|null}): Promise<Quadro>`
- Produces: `BoardsApi.remove(id:number): Promise<void>`
- Produces: query key `queryKeys.boards.all`
- Consumes: authenticated transport, AppShell, overlays and feedback components

- [ ] **Step 1: Write failing dashboard tests**

Cover loading skeleton, API error retry, empty-state CTA, board grid without fabricated task counts, client-side search, create modal, update, and typed-name delete confirmation.

```ts
expect(screen.queryByText(/tarefas no quadro/i)).not.toBeInTheDocument()
await user.type(nameInput, "Projeto Website")
expect(deleteButton).toBeEnabled()
```

- [ ] **Step 2: Run tests and verify failure**

Run: `cd frontend; npm test -- src/features/dashboard`  
Expected: FAIL because dashboard feature is missing.

- [ ] **Step 3: Implement boards API and query hooks**

Use TanStack Query object-style APIs. Invalidate only `queryKeys.boards.all` after create/update/delete. Derive accent color from stable board id/name without saving it.

- [ ] **Step 4: Implement dashboard UI**

“Meus quadros” is primary. “Atribuídas a mim” can render a small lazy summary via the assignments API introduced in Task 11; until then expose a typed placeholder boundary, not mock data. Board create explains that “A Fazer” will be created automatically.

- [ ] **Step 5: Verify dashboard feature**

Run: `cd frontend; npm test -- src/features/dashboard; npm run build`  
Expected: dashboard tests PASS and no TypeScript contract gaps.

- [ ] **Step 6: Commit locally**

```bash
git add frontend/src/features/dashboard frontend/src/components/feedback frontend/src/app/routes.tsx
git commit -m "feat(frontend): add board-first dashboard"
```

### Task 6: Board Loading and List Management

**Files:**
- Create: `frontend/src/features/boards/boardApi.ts`
- Create: `frontend/src/features/boards/useBoard.ts`
- Create: `frontend/src/features/boards/BoardPage.tsx`
- Create: `frontend/src/features/boards/BoardHeader.tsx`
- Create: `frontend/src/features/boards/KanbanColumn.tsx`
- Create: `frontend/src/features/boards/ListComposer.tsx`
- Create: `frontend/src/features/boards/ListMenu.tsx`
- Create: `frontend/src/features/boards/DeleteListDialog.tsx`
- Create: `frontend/src/features/boards/board.module.css`
- Create: `frontend/src/features/boards/BoardPage.test.tsx`
- Modify: `frontend/src/lib/api/queryKeys.ts`
- Modify: `frontend/src/app/routes.tsx`

**Interfaces:**
- Produces: `BoardApi.listLists(quadroId:number): Promise<ListaComTarefas[]>`
- Produces: `BoardApi.createList(quadroId:number,nome:string): Promise<Lista>`
- Produces: `BoardApi.renameList(id:number,nome:string): Promise<Lista>`
- Produces: `BoardApi.moveList(id:number,posicao:number): Promise<Lista>`
- Produces: `BoardApi.removeList(id:number): Promise<void>`
- Produces: query key `queryKeys.board(quadroId)` and `queryKeys.lists(quadroId)`
- Consumes: `BoardsApi.get`, AppShell, Drawer/Modal and feedback primitives

- [ ] **Step 1: Write failing board/list tests**

Cover parallel board metadata + list loading, ordered rendering by `posicao`, inline list creation at end, rename, deletion warning, and last-list prevention.

- [ ] **Step 2: Run tests and verify failure**

Run: `cd frontend; npm test -- src/features/boards/BoardPage.test.tsx`  
Expected: FAIL because BoardPage/list controls are missing.

- [ ] **Step 3: Implement board API and query boundaries**

`GET /quadros/:id` and `GET /quadros/:id/listas` start in parallel. Keep errors independent enough that metadata can still identify the page while list retry is offered.

- [ ] **Step 4: Implement list UI and lifecycle**

Horizontal columns, inline create, inline rename/menu, delete confirmation with task cascade copy. If only one list is present, disable delete and explain “O quadro precisa ter ao menos uma lista”; still normalize a backend 400 if state became stale.

- [ ] **Step 5: Verify board/list behavior**

Run: `cd frontend; npm test -- src/features/boards; npm run build`  
Expected: list tests PASS; board route compiles.

- [ ] **Step 6: Commit locally**

```bash
git add frontend/src/features/boards frontend/src/lib/api/queryKeys.ts frontend/src/app/routes.tsx
git commit -m "feat(frontend): add Kanban board and list management"
```

### Task 7: Task Cards, Creation, Dates and Deletion

**Files:**
- Create: `frontend/src/lib/date.ts`
- Create: `frontend/src/lib/date.test.ts`
- Create: `frontend/src/features/tasks/tasksApi.ts`
- Create: `frontend/src/features/tasks/useTasks.ts`
- Create: `frontend/src/features/tasks/TaskCard.tsx`
- Create: `frontend/src/features/tasks/TaskCreateDialog.tsx`
- Create: `frontend/src/features/tasks/DeleteTaskDialog.tsx`
- Create: `frontend/src/features/tasks/task.module.css`
- Create: `frontend/src/features/tasks/TaskCard.test.tsx`
- Create: `frontend/src/features/tasks/TaskCreateDialog.test.tsx`
- Modify: `frontend/src/features/boards/KanbanColumn.tsx`

**Interfaces:**
- Produces: `TasksApi.create(listaId:number,input:CriarTarefaInput): Promise<TarefaDetalhe>`
- Produces: `TasksApi.remove(id:number): Promise<void>`
- Produces: `normalizeApiDate(value:string|null|undefined): string | null`
- Produces: `formatApiDate(value:string, locale?:string): string`
- Produces: `TaskCard({task,onOpen})` rendering only title, status and prazo
- Consumes: list query keys and overlays from earlier tasks

- [ ] **Step 1: Write failing date and task-card tests**

Pin the Review Focus date case and the summary-field restriction:

```ts
expect(normalizeApiDate("2026-11-02")).toBe("2026-11-02")
expect(normalizeApiDate("")).toBeNull()
expect(formatApiDate("2026-11-02", "pt-BR")).toBe("02/11/2026")
expect(screen.queryByText(/descrição interna/i)).not.toBeInTheDocument()
expect(screen.queryByText(/2 de 4 subtarefas/i)).not.toBeInTheDocument()
```

- [ ] **Step 2: Run tests and verify failure**

Run: `cd frontend; npm test -- src/lib/date.test.ts src/features/tasks`  
Expected: FAIL because date utilities and task UI are missing.

- [ ] **Step 3: Implement date helpers without local-time conversion**

Validate the exact `AAAA-MM-DD` string and format with an explicit UTC-safe strategy so the calendar day never shifts. Native `<input type="date">` values pass through unchanged; empty clears the deadline.

- [ ] **Step 4: Implement task card, create dialog and deletion**

Create sends `{titulo, descricao, prazo, status}` to `/listas/:listaId/tarefas`. Use title max 200, optional description, native date input, three exact status values, list context and one disabled submit during mutation. Delete warns that subtasks, comments and assignments are removed.

- [ ] **Step 5: Verify focused tests and board integration**

Run: `cd frontend; npm test -- src/lib/date.test.ts src/features/tasks src/features/boards; npm run build`  
Expected: tests PASS and board renders summary cards without extra detail queries.

- [ ] **Step 6: Commit locally**

```bash
git add frontend/src/lib/date* frontend/src/features/tasks frontend/src/features/boards/KanbanColumn.tsx
git commit -m "feat(frontend): add task cards creation and deadlines"
```

### Task 8: Accessible Optimistic Drag-and-Drop

**Files:**
- Create: `frontend/src/features/boards/reorder.ts`
- Create: `frontend/src/features/boards/reorder.test.ts`
- Create: `frontend/src/features/boards/BoardDndProvider.tsx`
- Create: `frontend/src/features/boards/SortableColumn.tsx`
- Create: `frontend/src/features/boards/SortableTaskCard.tsx`
- Create: `frontend/src/features/boards/MoveTaskMenu.tsx`
- Create: `frontend/src/features/boards/BoardDndProvider.test.tsx`
- Modify: `frontend/src/features/boards/BoardPage.tsx`
- Modify: `frontend/src/features/tasks/tasksApi.ts`
- Modify: `frontend/src/features/boards/board.module.css`

**Interfaces:**
- Produces: `reorderLists(state:ListaComTarefas[], move:{id:number;toIndex:number}): ListaComTarefas[]`
- Produces: `reorderTask(state, move:{taskId:number;fromListId:number;toListId:number;toIndex:number}): ListaComTarefas[]`
- Produces: `TasksApi.move(id:number,input:{listaId?:number;posicao:number}): Promise<TarefaDetalhe>`
- Produces: `MoveTaskMenu({task,lists,onMove})`
- Consumes: `BoardApi.moveList`, list query cache and TaskCard

- [ ] **Step 1: Write failing pure-reorder and UI tests**

Assert same-list reorder, cross-list reorder, contiguous positions, immutable input, unchanged status, menu fallback, and Review Focus rollback:

```ts
expect(movedTask.status).toBe(originalTask.status)
expect(afterError).toEqual(snapshotBeforeDrag)
expect(moveApi).toHaveBeenCalledWith(task.id, { listaId: target.id, posicao: 0 })
```

- [ ] **Step 2: Run tests and verify failure**

Run: `cd frontend; npm test -- src/features/boards/reorder.test.ts src/features/boards/BoardDndProvider.test.tsx`  
Expected: FAIL because reorder/DnD implementation is missing.

- [ ] **Step 3: Implement pure reorder functions**

Return new arrays/objects only for affected lists and tasks; renumber positions from zero. Never derive or modify status from list name/index.

- [ ] **Step 4: Implement dnd kit provider and optimistic mutations**

Use the current `DragDropProvider`/`useSortable` APIs from `@dnd-kit/react`. Preserve default keyboard sensor. Configure pointer activation so touch requires a deliberate delay/tolerance. TanStack mutation `onMutate` snapshots and updates cache; `onError` restores; `onSettled` invalidates the specific list query.

- [ ] **Step 5: Implement “Mover para...” fallback**

Expose a menu on every task card with target list and position choice. It calls the same mutation as drag-and-drop and remains available on desktop, tablet, mobile and keyboard.

- [ ] **Step 6: Verify DnD behavior**

Run: `cd frontend; npm test -- src/features/boards; npm run build`  
Expected: all reorder, rollback, keyboard/menu and build checks PASS.

- [ ] **Step 7: Commit locally**

```bash
git add frontend/src/features/boards
git commit -m "feat(frontend): add accessible optimistic Kanban movement"
```

### Task 9: Owner Task Details and Editing

**Files:**
- Create: `frontend/src/features/tasks/TaskDetailsDrawer.tsx`
- Create: `frontend/src/features/tasks/TaskFields.tsx`
- Create: `frontend/src/features/tasks/TaskDetailsDrawer.test.tsx`
- Modify: `frontend/src/features/tasks/tasksApi.ts`
- Modify: `frontend/src/features/tasks/useTasks.ts`
- Modify: `frontend/src/features/tasks/task.module.css`
- Modify: `frontend/src/features/boards/BoardPage.tsx`

**Interfaces:**
- Produces: `TasksApi.get(id:number): Promise<TarefaDetalhe>`
- Produces: `TasksApi.update(id:number,input:AtualizarTarefaInput): Promise<TarefaDetalhe>`
- Produces: `TaskDetailsDrawer({taskId,mode:"owner"|"collaborator",onClose})`
- Produces: `TaskFields({task,editable,onSubmit})`
- Consumes: date helpers, overlays, query cache and TasksApi create/remove

- [ ] **Step 1: Write failing owner-detail tests**

Cover lazy open, title/description/prazo/status rendering, owner edits, explicit status change, date clear, delete flow and independent section placeholders for later relations.

- [ ] **Step 2: Run tests and verify failure**

Run: `cd frontend; npm test -- src/features/tasks/TaskDetailsDrawer.test.tsx`  
Expected: FAIL because drawer and update endpoint are missing.

- [ ] **Step 3: Implement get/update API and cache synchronization**

Opening a card is the first time `GET /tarefas/:id` is called. Update only changed fields and patch both the detail cache and matching summary card fields; never insert description into summary types.

- [ ] **Step 4: Implement responsive owner drawer**

Desktop: lateral; tablet: overlay; mobile: full screen. Fields use accessible labels, explicit save/error states, Escape close and focus restoration. Editing status is separate from column movement.

- [ ] **Step 5: Verify task-detail feature**

Run: `cd frontend; npm test -- src/features/tasks; npm run build`  
Expected: owner details tests PASS and build succeeds.

- [ ] **Step 6: Commit locally**

```bash
git add frontend/src/features/tasks frontend/src/features/boards/BoardPage.tsx
git commit -m "feat(frontend): add owner task detail editing"
```

### Task 10: Subtasks, Comments and Assignees

**Files:**
- Create: `frontend/src/features/tasks/subtasksApi.ts`
- Create: `frontend/src/features/tasks/commentsApi.ts`
- Create: `frontend/src/features/tasks/assigneesApi.ts`
- Create: `frontend/src/features/tasks/SubtaskSection.tsx`
- Create: `frontend/src/features/tasks/CommentSection.tsx`
- Create: `frontend/src/features/tasks/AssigneeSection.tsx`
- Create: `frontend/src/features/tasks/TaskRelations.test.tsx`
- Modify: `frontend/src/features/tasks/TaskDetailsDrawer.tsx`
- Modify: `frontend/src/lib/api/queryKeys.ts`

**Interfaces:**
- Produces: `SubtasksApi` with `list/create/rename/setCompleted/remove`
- Produces: `CommentsApi` with `list/create/update/remove`
- Produces: `AssigneesApi` with `list/addByEmail/remove`
- Produces: query keys `subtasks(taskId)`, `comments(taskId)`, `assignees(taskId)`
- Consumes: `mode` and authenticated user id from TaskDetailsDrawer/AuthProvider

- [ ] **Step 1: Write failing relation and permission tests**

Cover parallel lazy queries, section-local errors, subtask progress, owner CRUD, collaborator check/reopen only, comment author edit/delete, owner moderation, add assignee by exact email, duplicate/unknown email errors and owner-only removal.

- [ ] **Step 2: Run tests and verify failure**

Run: `cd frontend; npm test -- src/features/tasks/TaskRelations.test.tsx`  
Expected: FAIL because relation APIs/components are missing.

- [ ] **Step 3: Implement three API adapters and query keys**

Use the exact routes from the spec. Adding an assignee performs one POST with email; do not prefetch/list all users. Normalize returned public user data into a chip with initials.

- [ ] **Step 4: Implement relation sections with permission props**

Owner sees full controls. Collaborator sees assignees read-only, can toggle subtasks and can create/edit/delete only their own comments. A failed comments query must not hide loaded subtasks or task fields.

- [ ] **Step 5: Verify task relations**

Run: `cd frontend; npm test -- src/features/tasks; npm run build`  
Expected: relation tests PASS, including local progress and permission controls.

- [ ] **Step 6: Commit locally**

```bash
git add frontend/src/features/tasks frontend/src/lib/api/queryKeys.ts
git commit -m "feat(frontend): add task collaboration sections"
```

### Task 11: My Assignments and Three Permission States

**Files:**
- Create: `frontend/src/features/assignments/assignmentsApi.ts`
- Create: `frontend/src/features/assignments/useAssignments.ts`
- Create: `frontend/src/features/assignments/AssignmentsPage.tsx`
- Create: `frontend/src/features/assignments/AssignmentRow.tsx`
- Create: `frontend/src/features/assignments/AssignmentDetails.tsx`
- Create: `frontend/src/features/assignments/NoAccessState.tsx`
- Create: `frontend/src/features/assignments/assignments.module.css`
- Create: `frontend/src/features/assignments/AssignmentsPage.test.tsx`
- Create: `frontend/src/features/assignments/AssignmentDetails.test.tsx`
- Modify: `frontend/src/features/dashboard/DashboardPage.tsx`
- Modify: `frontend/src/app/routes.tsx`

**Interfaces:**
- Produces: `AssignmentsApi.mine(): Promise<MinhaAtribuicao[]>`
- Produces: `resolveAssignmentAccess(assignment:MinhaAtribuicao): Promise<"owner"|"collaborator">`
- Produces: client filters `filterAssignments(items, {status,quadroId,dueGroup,search})`
- Produces: `NoAccessState` generic copy from spec
- Consumes: `TasksApi.get`, `TaskDetailsDrawer`, relation APIs and AppShell

- [ ] **Step 1: Write failing assignments list tests**

Cover one initial request, totals derived locally, search/status/board/due filters, groups “Hoje/Próximas/Sem prazo”, empty state and no navigation to another owner’s board.

- [ ] **Step 2: Write the Review Focus permission tests**

```ts
// task came from /atribuicoes/minhas
expect(await resolveWithTaskGet(200)).toBe("owner")
expect(await resolveWithTaskGet(404)).toBe("collaborator")
// arbitrary direct resource, not present in assignments
expect(screen.getByText(/pode não existir ou você não possui permissão/i)).toBeVisible()
```

Also assert owner receives editable TaskDetailsDrawer and collaborator receives read-only fields plus allowed relation actions.

- [ ] **Step 3: Run tests and verify failure**

Run: `cd frontend; npm test -- src/features/assignments`  
Expected: FAIL because assignments feature is missing.

- [ ] **Step 4: Implement assignments API, local derivations and access resolution**

Only `GET /atribuicoes/minhas` runs at page load. On open, attempt `GET /tarefas/:id`: success means owner; expected 404 for an item already proven by assignments means collaborator. Do not globally reinterpret arbitrary 404s as collaboration access.

- [ ] **Step 5: Integrate assignments page and dashboard summary**

Replace Task 5’s typed summary boundary with real recent assignments. Keep dashboard secondary and page primary. On direct/no-access state, use generic privacy-preserving copy.

- [ ] **Step 6: Verify assignments and permission states**

Run: `cd frontend; npm test -- src/features/assignments src/features/dashboard; npm run build`  
Expected: list, owner/collaborator/no-access tests PASS.

- [ ] **Step 7: Commit locally**

```bash
git add frontend/src/features/assignments frontend/src/features/dashboard/DashboardPage.tsx frontend/src/app/routes.tsx
git commit -m "feat(frontend): add permission-aware assignments"
```

### Task 12: Settings, Account Security and Destructive Confirmations

**Files:**
- Create: `frontend/src/features/settings/accountApi.ts`
- Create: `frontend/src/features/settings/SettingsDrawer.tsx`
- Create: `frontend/src/features/settings/AppearanceSettings.tsx`
- Create: `frontend/src/features/settings/AccountSettings.tsx`
- Create: `frontend/src/features/settings/ChangePasswordForm.tsx`
- Create: `frontend/src/features/settings/DeleteAccountDialog.tsx`
- Create: `frontend/src/features/settings/settings.module.css`
- Create: `frontend/src/features/settings/SettingsDrawer.test.tsx`
- Modify: `frontend/src/components/layout/AppShell.tsx`

**Interfaces:**
- Produces: `AccountApi.profile(): Promise<Usuario>`
- Produces: `AccountApi.changePassword(input:{senhaAtual:string;novaSenha:string}): Promise<void>`
- Produces: `AccountApi.deleteAccount(): Promise<void>`
- Consumes: PreferencesProvider, AuthProvider logout/expire, ConfirmDialog and useToast

- [ ] **Step 1: Write failing settings and confirmation tests**

Cover theme/system switch, density default/compact, reduce motion, profile read-only, password confirmation/local min-8 validation, logout, typed account delete, typed board delete, list/task standard confirm and comment/subtask compact confirm.

- [ ] **Step 2: Run tests and verify failure**

Run: `cd frontend; npm test -- src/features/settings`  
Expected: FAIL because settings/account contracts are missing.

- [ ] **Step 3: Implement account API and settings sections**

Profile shows name/e-mail only. Change password sends only `senhaAtual` and `novaSenha`; confirmation never leaves the browser. Logout revokes refresh before local cleanup when possible, but local cleanup still occurs on network failure.

- [ ] **Step 4: Implement proportional confirmation primitives**

Typed confirmation for account/board, explanatory modal for list/task, compact popover/dialog for subtask/comment. Never show an undo toast after a confirmed DELETE.

- [ ] **Step 5: Verify settings and destructive behavior**

Run: `cd frontend; npm test -- src/features/settings src/components/overlays; npm run build`  
Expected: settings/preferences/security tests PASS.

- [ ] **Step 6: Commit locally**

```bash
git add frontend/src/features/settings frontend/src/components/overlays frontend/src/components/layout/AppShell.tsx
git commit -m "feat(frontend): add settings and safe account controls"
```

### Task 13: Responsive, Accessibility and End-to-End Quality Gate

**Files:**
- Create: `frontend/tests/app.integration.test.tsx`
- Create: `frontend/tests/accessibility.test.tsx`
- Create: `frontend/tests/session-expiry.test.tsx`
- Modify: `frontend/src/styles/global.css`
- Modify: `frontend/src/styles/themes.css`
- Modify: all feature CSS modules only where responsive fixes are required
- Modify: `frontend/src/components/feedback/ErrorState.tsx`
- Modify: `frontend/src/components/feedback/EmptyState.tsx`
- Modify: `frontend/src/components/feedback/ToastProvider.tsx`
- Modify: `frontend/package.json`
- Modify: `README.md`

**Interfaces:**
- Produces: documented `npm run dev`, `npm test`, `npm run build`, `npm run preview`
- Produces: complete responsive behavior at spec breakpoints
- Consumes: every preceding feature

- [ ] **Step 1: Write failing whole-app and session-expiry tests**

Cover login → dashboard → board → task drawer; revoked refresh → login; retryable network error preserving context; empty boards; empty assignments; generic no access; theme persistence across navigation.

- [ ] **Step 2: Write responsive/accessibility contract tests**

Assert semantic navigation labels, mobile “Mover para...” availability, modal focus return, Escape close, status text in addition to color, form error association and no inaccessible icon-only buttons.

- [ ] **Step 3: Run integration tests and verify failure**

Run: `cd frontend; npm test -- tests`  
Expected: FAIL on remaining integration, focus or responsive-control gaps.

- [ ] **Step 4: Apply responsive layout and feedback fixes**

At `>=1200px`: persistent sidebar, multiple columns, lateral drawer. At `768–1199px`: compact sidebar, horizontal columns, overlay drawer. At `<768px`: bottom nav, one primary column, full-screen details/settings/forms, touch-safe controls. Add skeleton/empty/error/retry states and 160–220ms motion with reduced-motion override.

- [ ] **Step 5: Verify the Review Focus touch fallback**

Component test: clicking “Mover para...” on a narrow viewport calls the same task move mutation without pointer drag. Manual browser check: vertical swipe scrolls until deliberate long press starts drag.

- [ ] **Step 6: Run the complete automated gate**

Run: `cd frontend; npm test; npm run build`  
Expected: every test PASS; build exits 0 without unresolved TypeScript errors.

- [ ] **Step 7: Start the integrated local app and verify all viewports**

Run: `cd frontend; npm run dev`  
Expected: one command starts frontend at `http://localhost:3000` and internal API at `127.0.0.1:3001`; `/health` is proxied. Manually inspect approximately 1440, 1024, 768 and 390 px in both themes, including login, dashboard, Kanban, task details, assignments and settings.

- [ ] **Step 8: Verify backend isolation and repository state**

Run:

```bash
git diff -- src prisma package.json
git status --short
```

Expected: first command prints nothing; status contains only intended `frontend/`, docs, README and `.gitignore` changes.

- [ ] **Step 9: Update README frontend instructions**

Document prerequisites, `.env` staying at repo root, `cd frontend`, install, dev, test, build and preview commands. Explain that the original backend command remains unchanged and must not be run simultaneously with the integrated TaskFlow command because both public entrypoints use port 3000.

- [ ] **Step 10: Commit locally**

```bash
git add frontend README.md docs .gitignore
git commit -m "feat(frontend): complete responsive TaskFlow experience"
```

## Final Verification Before GitHub Handoff

- [ ] Run `cd frontend; npm test` and record the passing test count.
- [ ] Run `cd frontend; npm run build` and record build output/warnings.
- [ ] Run the integrated app and verify `/health`, login, dashboard, a board mutation and logout against the real backend/database when configured.
- [ ] Confirm desktop/tablet/mobile and light/dark screenshots or live review.
- [ ] Run `git diff --check`.
- [ ] Run `git diff -- src prisma package.json` and confirm no backend changes.
- [ ] Show the user `git status`, commit list and summary diff.
- [ ] Ask explicit authorization before `git push -u origin front`.
- [ ] After an authorized push, prepare a Pull Request from `front` to `main`; attach it to the task and do not merge without explicit authorization.

## Official Technical References

- Vite preview proxy: <https://vite.dev/config/preview-options>
- React Router declarative routing: <https://reactrouter.com/start/declarative/routing>
- TanStack Query React reference: <https://tanstack.com/query/latest/docs/framework/react/reference/functions/useQuery>
- dnd kit current React sensors: <https://dndkit.com/react/guides/sensors/>
- Vitest setup and Node floor: <https://vitest.dev/guide/>

## Self-Review Results

- **Spec coverage:** tasks map every design section to infrastructure, auth, themes, dashboard, board/list/task CRUD, drag-and-drop, relations, assignments/permissions, settings, destructive actions, responsiveness, accessibility, performance and Git handoff.
- **Step scan:** each task has a failing test, focused implementation, passing command and local commit; no implementation task depends on undefined feature interfaces.
- **Type consistency:** API domain types originate in Task 2; later APIs consume the same types and stable query keys.
- **Review Focus:** all five risks have explicit tests in Tasks 3, 7, 8, 11 and 13.
- **Proportion:** the plan specifies signatures, assertions and commands without transcribing component bodies.
