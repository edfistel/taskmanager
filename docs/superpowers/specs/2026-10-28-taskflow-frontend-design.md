# TaskFlow Frontend — Design aprovado em conversa

Data: 2026-10-28  
Status: aprovado pelo usuário em 2026-10-28  
Branch de trabalho: `front`

## 1. Intenção e motivo

Criar um frontend completo, moderno, corporativo e responsivo para a API REST de gerenciamento de tarefas já existente neste repositório. A experiência deve funcionar como um Kanban, preservar integralmente o backend dos demais colaboradores e abrir em `http://localhost:3000`.

O produto terá o nome **TaskFlow** e usará um símbolo **T** como marca. A identidade combina azul-marinho, verde-água funcional e detalhes sutis de profundidade e gradiente. O frontend precisa oferecer temas claro e escuro com a mesma qualidade visual e ser confortável em desktop, tablet e celular.

## 2. Metas

- Entregar autenticação, dashboard, quadros Kanban, tarefas, listas, subtarefas, comentários, responsáveis, configurações e gerenciamento de conta usando os contratos reais da API.
- Manter todo código novo de aplicação dentro de `frontend/` e não alterar arquivos do backend em `src/`, `prisma/` ou o `package.json` raiz.
- Executar a interface em `localhost:3000` e o Express existente em uma porta interna diferente por meio de um iniciador criado dentro do frontend.
- Fornecer interações rápidas, animações discretas e drag-and-drop responsivo sem lag.
- Respeitar integralmente as permissões do backend para proprietário, responsável atribuído e usuário sem acesso.
- Entregar navegação e interações acessíveis por mouse, toque e teclado.
- Manter preferências visuais localmente sem exigir novos campos na API.

## 3. Não objetivos

- Não implementar ou alterar regras de negócio no backend.
- Não adicionar avatar/foto de perfil.
- Não adicionar login Google ou outro OAuth.
- Não adicionar recuperação de senha, anexos, etiquetas ou campos que não existam na API.
- Não conceder a responsáveis acesso ao quadro ou edição da tarefa além do que os endpoints atuais autorizam.
- Não publicar, fazer push, abrir Pull Request ou mesclar na `main` sem autorização específica do usuário ao final.

## 4. Antiobjetivos

O resultado será considerado inadequado mesmo que tecnicamente funcional se:

- houver travamentos perceptíveis durante drag-and-drop, filtros ou troca de tela;
- o tema claro for apenas uma inversão incompleta do tema escuro;
- ações aparecerem para usuários que não podem executá-las;
- o frontend simular funções inexistentes ou fizer promessas de recuperação após exclusão permanente;
- desktop funcionar bem, mas tablet ou celular exigirem zoom, apresentarem cortes ou dependerem de hover;
- arquivos do backend forem modificados para acomodar o frontend;
- a página inicial carregar todas as tarefas de todos os quadros apenas para produzir estatísticas.

## 5. Restrições confirmadas

- Backend: Node.js, Express, Prisma e PostgreSQL, já pronto.
- O backend atual escuta a porta `3000` de forma fixa e não possui CORS.
- O frontend também precisa ser acessado por `localhost:3000`.
- Todo trabalho permanece na branch `front` até revisão e autorização para envio.
- Acesso e refresh tokens são retornados no corpo JSON; não há cookies HttpOnly fornecidos pelo backend.
- O prazo da tarefa contém somente uma data, nunca horário.
- Um quadro sempre precisa manter pelo menos uma lista.
- O backend pode excluir dados relacionados em cascata.

## 6. Abordagens consideradas

### 6.1 Escolhida — SPA isolada com ponte local

Criar `frontend/` com React, TypeScript e Vite. O Vite ocupa a porta pública `3000`. Um script pertencente ao frontend importa o `app` Express existente de `src/app.js` e o inicia internamente em `3001`, sem editar o backend. O servidor do frontend encaminha as rotas da API para `3001`.

Vantagens:

- atende `localhost:3000`;
- não altera o backend;
- mantém navegador e API na mesma origem, evitando CORS;
- permite uma experiência moderna e desenvolvimento rápido;
- isola dependências e scripts do frontend em seu próprio `package.json`.

Trade-off: o iniciador local precisa coordenar dois processos, embora o usuário execute um único comando dentro de `frontend/`.

### 6.2 Rejeitada — frontend em `5173`, backend em `3000`

É mais simples durante desenvolvimento, mas viola o requisito de interface em `localhost:3000` e exigiria CORS para comunicação direta entre portas.

### 6.3 Rejeitada — Express entregando o build do React

Criaria um único processo na porta `3000`, mas exigiria alterar o backend, contrariando a restrição principal do projeto.

## 7. Arquitetura técnica

### 7.1 Stack

- React com TypeScript e Vite.
- React Router para rotas e proteção de áreas autenticadas.
- Uma biblioteca de cache de servidor, preferencialmente TanStack Query, para cache, invalidação, estados de carregamento e coordenação de requisições.
- `dnd-kit` ou equivalente pequeno e acessível para drag-and-drop com mouse, teclado e toque.
- CSS Modules ou folhas CSS organizadas por componente, apoiadas por tokens CSS globais. Não usar biblioteca visual pesada.
- Ícones vetoriais leves e consistentes; nenhuma imagem raster pesada é necessária para a interface.
- Vitest e Testing Library para testes do frontend. Fluxos principais devem possuir testes integrados de componentes; o build deve ser verificado separadamente.

A escolha exata de biblioteca de formulário e ícones fica para o implementador, desde que preserve o orçamento de desempenho e não introduza um framework visual completo.

### 7.2 Estrutura prevista

```text
frontend/
├── package.json
├── vite.config.ts
├── index.html
├── scripts/
│   ├── api-bridge.mjs
│   └── dev.mjs
├── src/
│   ├── app/
│   ├── components/
│   ├── features/
│   │   ├── auth/
│   │   ├── boards/
│   │   ├── tasks/
│   │   ├── assignments/
│   │   └── settings/
│   ├── lib/
│   │   ├── api/
│   │   ├── auth/
│   │   └── storage/
│   ├── styles/
│   └── main.tsx
└── tests/
```

Esta árvore é orientativa. O implementador pode ajustar a divisão interna sem mudar os limites de responsabilidade.

### 7.3 Ponte de portas

- O frontend público escuta em `3000`.
- `frontend/scripts/api-bridge.mjs` importa `../../src/app.js` e chama `listen(3001)`.
- Antes do import dinâmico do backend, a ponte resolve a raiz do repositório e garante que o processo use essa raiz como diretório de trabalho. Isso permite que `dotenv/config` continue lendo o `.env` raiz sem alteração em `src/config/database.js`.
- Se o `.env` ou as variáveis obrigatórias do backend estiverem ausentes, o iniciador encerra com uma mensagem clara em vez de abrir uma interface que não consegue acessar a API.
- O frontend encaminha estes prefixos para a API interna: `/health`, `/auth`, `/users`, `/quadros`, `/listas`, `/tarefas`, `/subtarefas`, `/comentarios` e `/atribuicoes`.
- `/` e as rotas da SPA pertencem ao frontend.
- O usuário inicia os dois processos por um único script, por exemplo `npm run dev` em `frontend/`.
- Nenhum arquivo do backend é alterado. O `src/server.js` original continua sendo a forma independente de iniciar apenas a API na porta `3000`.

## 8. Identidade visual e preferências

### 8.1 Marca

- Nome: TaskFlow.
- Símbolo: letra T em bloco arredondado.
- Cor funcional principal: verde-água.
- Base escura: azul-marinho profundo.
- Detalhes secundários: violeta discreto, usado com moderação.

### 8.2 Temas

- O primeiro acesso segue `prefers-color-scheme`.
- O usuário pode escolher Sistema, Claro ou Escuro na engrenagem.
- Tema claro usa branco azulado e cinzas frios, mantendo o verde para ação, seleção, foco e sucesso.
- Tema escuro usa azul-marinho, cartões elevados e gradientes muito discretos.
- Preferência salva localmente.

### 8.3 Preferências locais

- Densidade confortável como padrão.
- Densidade compacta como alternativa para quadros grandes.
- Redução de movimentos respeita `prefers-reduced-motion` e pode ser reforçada pelo usuário.
- Todas essas opções alteram somente apresentação e são salvas localmente.

## 9. Rotas e telas do frontend

Rotas propostas:

- `/login` — login e cadastro em uma experiência com abas.
- `/` — dashboard após autenticação.
- `/quadros/:quadroId` — quadro Kanban do proprietário.
- `/atribuicoes` — tarefas atribuídas ao usuário.
- Configurações abrem em painel/modal sobre a rota atual; não precisam de URL própria, mas podem usar estado de rota se isso melhorar navegação por histórico.

Rotas privadas exigem sessão. Usuário sem sessão é redirecionado a `/login`. Uma URL de recurso inacessível exibe estado genérico e oferece retorno ao início.

## 10. Autenticação e sessão

### 10.1 Cadastro

- Campos: nome de exibição, e-mail, senha e confirmação de senha.
- A confirmação existe somente no frontend.
- Regras: todos os campos da API obrigatórios; senha mínima de 8 caracteres.
- `POST /users/register` envia `{ nome, email, senha }`.
- Após cadastro bem-sucedido, o frontend realiza login automaticamente com as credenciais ainda em memória. Se a segunda chamada falhar, leva o usuário à aba Entrar com o e-mail preenchido e uma mensagem clara.

### 10.2 Login

- `POST /auth/login` envia `{ email, senha }`.
- Resposta contém `usuario`, `accessToken` e `refreshToken`.
- Access token fica em memória.
- Por padrão, refresh token fica em `sessionStorage`.
- Quando “Manter conectado” estiver marcado, refresh token fica em `localStorage`.
- Na restauração da página, o frontend usa o refresh token para obter um novo par de tokens; não restaura o access token antigo.
- Uma única renovação pode ficar em andamento por vez para evitar corrida de rotação de refresh token.
- Uma requisição que recebe `401` tenta renovação uma vez; falha na renovação encerra a sessão e retorna ao login.
- `POST /auth/logout` revoga o refresh token e limpa estado/cache local de sessão.

### 10.3 Limitação de segurança conhecida

O backend entrega refresh tokens por JSON em vez de cookie HttpOnly. O frontend não consegue eliminar o risco de armazenamento acessível a JavaScript. Deve evitar HTML não confiável, não usar `dangerouslySetInnerHTML` e limitar a persistência longa à escolha explícita “Manter conectado”.

## 11. Dashboard

A página inicial usa a hierarquia “Quadros primeiro”, escolhida pelo usuário.

- `GET /quadros` fornece id, nome, descrição e data de criação.
- A seção Meus quadros domina a página.
- `POST /quadros` abre modal com nome obrigatório (máximo de 100) e descrição opcional.
- A resposta de criação já inclui a lista inicial “A Fazer”.
- A seção Atribuídas a mim usa `GET /atribuicoes/minhas` como resumo menor.
- Não buscar todas as listas de todos os quadros para produzir contadores.
- Busca de quadros é local sobre a coleção já carregada.
- Cores de acento de cartões de quadro, se usadas, são derivadas deterministicamente do id/nome; não são apresentadas como dado persistido da API.

## 12. Quadro Kanban

### 12.1 Dados

- `GET /quadros/:quadroId` busca metadados do quadro.
- `GET /quadros/:quadroId/listas` busca listas ordenadas com cartões resumidos já incluídos.
- O frontend não precisa chamar `GET /listas/:id/tarefas` para cada lista durante o carregamento normal se a resposta de listas já contém as tarefas necessárias.
- Os cartões do quadro mostram somente dados presentes nessa resposta resumida: título, status e prazo.
- Descrição, responsáveis, comentários e progresso de subtarefas aparecem somente após abrir os detalhes. O frontend não faz requisições adicionais por cartão para enriquecer o quadro.

### 12.2 Listas

- Listas são colunas personalizáveis, não estados fixos.
- Criar: formulário inline no final do quadro, `POST /quadros/:quadroId/listas` com nome máximo de 100.
- Renomear: edição inline ou menu da coluna, `PUT /listas/:id`.
- Mover: drag-and-drop com `PATCH /listas/:id/mover` e nova posição.
- Excluir: `DELETE /listas/:id` com confirmação. A última lista não pode ser excluída; a UI antecipa isso quando sabe a contagem e também trata a validação do backend.

### 12.3 Tarefas e status

- As colunas e o status são conceitos separados.
- Mover cartão altera apenas `listaId` e `posicao` por `PATCH /tarefas/:id/mover`.
- O frontend nunca muda o status silenciosamente durante o arraste.
- O status aparece como etiqueta no cartão e é editado explicitamente nos detalhes.
- Status válidos: `A_FAZER`, `EM_ANDAMENTO`, `CONCLUIDO`.
- Criar tarefa: título obrigatório (máximo de 200), descrição, prazo e status opcionais.
- Nova tarefa entra no final da lista.

### 12.4 Drag-and-drop e desempenho

- Atualizar a interface localmente durante o arraste.
- Enviar somente uma chamada ao soltar.
- Em falha, reverter a posição e mostrar mensagem com opção de tentar novamente.
- Usar transformações CSS em vez de recalcular layout a cada movimento.
- Preservar uma alternativa acessível “Mover para...” por menu, especialmente no celular.
- No toque, iniciar arraste por pressão/gesto deliberado para não conflitar com rolagem.

## 13. Detalhes da tarefa

No desktop, abrir como painel lateral sobre o quadro. No tablet, painel sobreposto. No celular, tela cheia.

### 13.1 Carregamento

- O cartão já fornece título, prazo, status, posição e lista.
- Ao abrir, buscar em paralelo e somente nesse momento:
  - `GET /tarefas/:id` para dados completos quando o usuário é proprietário;
  - `GET /tarefas/:tarefaId/subtarefas`;
  - `GET /tarefas/:tarefaId/comentarios`;
  - `GET /tarefas/:tarefaId/atribuicoes`.
- Cada seção possui estado de carregamento próprio; falha em comentários não bloqueia subtarefas ou tarefa.

### 13.2 Campos e ações

- Editar título, descrição, prazo ou status por `PUT /tarefas/:id` somente para proprietário.
- Prazo usa `<input type="date">` estilizado. Mouse e teclado são permitidos. A interface apresenta data conforme a localidade, e a API recebe `AAAA-MM-DD`. “Limpar prazo” envia valor que remove o prazo conforme o contrato.
- Responsáveis são adicionados por e-mail diretamente com `POST /tarefas/:tarefaId/atribuicoes`.
- Não listar todos os usuários; não existe endpoint para isso.
- Após atribuição, a resposta fornece nome/e-mail para atualizar o chip do responsável.
- Subtarefas e comentários seguem as regras da seção de permissões.

## 14. Minhas atribuições

- Usa uma única chamada `GET /atribuicoes/minhas`.
- Dados disponíveis: tarefa, título, status, prazo, lista e quadro.
- Totais, busca, filtro por status/quadro/prazo e agrupamento por prazo são calculados localmente.
- A tela não tenta abrir o quadro de outra pessoa.
- Ao abrir uma atribuição, o frontend tenta `GET /tarefas/:id` uma vez. Se a chamada retornar os detalhes, o usuário é também proprietário e recebe o painel completo.
- Se os detalhes completos não forem autorizados, a tarefa permanece válida por ter vindo de `GET /atribuicoes/minhas`, e o frontend oferece o painel reduzido de colaboração usando somente subtarefas, comentários e responsáveis acessíveis.
- Descrição completa e edição da tarefa não são simuladas para o responsável que não é proprietário, porque `GET /tarefas/:id` e `PUT /tarefas/:id` exigem propriedade do quadro.

## 15. Modelo de permissões

### 15.1 Proprietário do quadro

- Acesso completo ao quadro, listas e tarefas.
- Pode editar/excluir tarefa, criar/renomear/excluir subtarefas, atribuir/remover responsáveis e excluir comentários de qualquer autor.
- Pode criar comentários e editar/excluir os próprios.

### 15.2 Responsável atribuído

- Vê a tarefa na área Minhas atribuições.
- Pode listar responsáveis, subtarefas e comentários.
- Pode marcar/reabrir subtarefas.
- Pode criar comentários, editar os próprios e excluir os próprios.
- Não pode editar título, descrição, prazo, status, lista ou responsáveis.
- Não pode criar, renomear ou excluir subtarefas.
- Não recebe acesso ao quadro completo.

### 15.3 Sem relação com a tarefa

- Não recebe nenhum dado.
- Para 404 decorrente de ausência ou falta de acesso, mostrar mensagem genérica: “A tarefa pode não existir ou você não possui permissão para acessá-la.”
- Não distinguir visualmente se o recurso existe, preservando privacidade.

## 16. Comentários e subtarefas

- Comentários: texto obrigatório, máximo de 2000.
- Autor pode editar o próprio comentário.
- Autor ou proprietário do quadro pode excluir o comentário.
- Subtarefas: título obrigatório, máximo de 200.
- Proprietário cria, renomeia e exclui.
- Proprietário e responsável podem marcar como concluída ou reabrir.
- Progresso de subtarefas é calculado localmente a partir da lista retornada.

## 17. Configurações

Painel acessado pela engrenagem.

### 17.1 Aparência e movimento — armazenamento local

- Sistema/Claro/Escuro.
- Densidade confortável/compacta.
- Redução de movimentos.

### 17.2 Conta — API

- `GET /users/buscarMeuPerfil` mostra id, nome e e-mail.
- Nome e e-mail são somente leitura porque não há rota pública de edição.
- `PUT /users/alterarSenha` usa senha atual e nova senha; confirmação é local.
- Logout usa `/auth/logout`.
- Exclusão usa `DELETE /users/apagarUsuario`.

## 18. Exclusões e confirmações

- Quadro e conta: alto impacto. Exigir digitação do nome do quadro ou palavra explícita antes de habilitar a ação.
- Lista e tarefa: modal direto descrevendo o que será removido em cascata.
- Comentário e subtarefa: confirmação compacta próxima da ação.
- Não oferecer “Desfazer” após confirmação da API, pois não existe restauração.
- Exclusão de quadro remove listas, tarefas, subtarefas, comentários e atribuições.
- Exclusão de lista remove tarefas e dados dependentes.
- Exclusão de tarefa remove subtarefas, comentários e atribuições.
- Exclusão de conta remove quadros, comentários, atribuições, tokens e dados dependentes.

## 19. Responsividade

### 19.1 Faixas

- Desktop amplo: `>= 1200px`.
- Tablet/notebook menor: `768px–1199px`.
- Celular: `< 768px`.

### 19.2 Comportamentos

- Desktop: sidebar persistente, várias colunas visíveis, detalhes laterais.
- Tablet: sidebar compacta, rolagem horizontal do quadro, detalhes sobrepostos.
- Celular: navegação inferior, uma coluna principal por vez, detalhes/configurações/formulários em tela cheia.
- Nenhuma ação depende somente de hover.
- Áreas de toque devem ser confortáveis, visando ao menos 44 px quando possível.
- Drag-and-drop por toque deve coexistir com rolagem; menu “Mover para...” sempre disponível.
- Tabelas/matrizes viram cartões ou listas no celular.
- Login/cadastro ficam em coluna única em telas estreitas.

## 20. Estados de carregamento, vazio e erro

- Usar skeletons leves, nunca spinners de página inteira para carregamentos parciais.
- Estado sem quadros convida a criar o primeiro quadro e explica que ele nascerá com “A Fazer”.
- Estado sem atribuições informa que tarefas aparecerão quando outro proprietário usar o e-mail da conta.
- Erros de rede oferecem “Tentar novamente” sem perder o contexto.
- Mensagens devem normalizar os formatos heterogêneos do backend: `message`, `erro` ou `error`.
- Ações de criação/edição desabilitam apenas o botão submetido e preservam o formulário em erro.
- Sucesso usa feedback discreto e não bloqueante.
- Falha de sessão encerra acesso somente após tentativa controlada de renovação.

## 21. Desempenho

- Carregar por rota e dividir bundles quando fizer sentido.
- Nenhuma biblioteca visual completa.
- Animações entre 160 e 220 ms, usando `transform` e `opacity`.
- Respeitar redução de movimento.
- Evitar atualizações globais de estado durante drag-and-drop.
- Cachear consultas e invalidar somente recursos relacionados.
- Filtrar quadros e atribuições localmente quando a coleção já estiver disponível.
- Não pré-carregar detalhes, comentários ou subtarefas de todos os cartões.
- Não buscar descrições, responsáveis ou subtarefas individualmente para enriquecer cartões do quadro.
- Evitar blur intenso e sombras grandes em listas longas; aplicar profundidade principalmente ao item ativo/arrastado.
- Build deve ser inspecionado para dependências acidentais e avisos de tamanho.

## 22. Acessibilidade

- Foco visível em todos os controles.
- Formulários com labels reais e mensagens de erro associadas.
- Contraste revisado nos dois temas.
- Modais/painéis prendem foco de forma correta e retornam foco ao elemento de origem ao fechar.
- Drag-and-drop com suporte a teclado e alternativa por menu.
- Ícones têm rótulos acessíveis quando não acompanhados por texto.
- Status não depende somente de cor.
- Anúncios de sucesso/erro usam região apropriada para leitores de tela.

## 23. Contratos principais da API

| Área | Método e rota | Uso no frontend |
| --- | --- | --- |
| Cadastro | `POST /users/register` | Nome, e-mail e senha |
| Login | `POST /auth/login` | Criar sessão |
| Renovação | `POST /auth/refresh` | Rotação controlada do par de tokens |
| Logout | `POST /auth/logout` | Revogar refresh token |
| Perfil | `GET /users/buscarMeuPerfil` | Nome/e-mail somente leitura |
| Senha | `PUT /users/alterarSenha` | Senha atual e nova senha |
| Conta | `DELETE /users/apagarUsuario` | Exclusão confirmada |
| Quadros | `GET/POST /quadros` | Dashboard e criação |
| Quadro | `GET/PUT/DELETE /quadros/:id` | Metadados, edição e exclusão |
| Listas | `GET/POST /quadros/:quadroId/listas` | Kanban e criação de colunas |
| Lista | `PUT /listas/:id` | Renomear |
| Mover lista | `PATCH /listas/:id/mover` | Reordenar colunas |
| Excluir lista | `DELETE /listas/:id` | Exclusão confirmada |
| Tarefas | `GET/POST /listas/:listaId/tarefas` | Lista/criação quando necessário |
| Tarefa | `GET/PUT/DELETE /tarefas/:id` | Detalhes/edição/exclusão do proprietário |
| Mover tarefa | `PATCH /tarefas/:id/mover` | Reordenar ou trocar lista |
| Subtarefas | `/tarefas/:tarefaId/subtarefas`, `/subtarefas/:id` | CRUD e conclusão conforme permissão |
| Comentários | `/tarefas/:tarefaId/comentarios`, `/comentarios/:id` | CRUD conforme autoria/permissão |
| Minhas atribuições | `GET /atribuicoes/minhas` | Área pessoal |
| Responsáveis | `/tarefas/:tarefaId/atribuicoes` | Listar/adicionar/remover |

## 24. Testes e critérios de conclusão

### 24.1 Testes automatizados mínimos

- API client normaliza respostas e erros.
- Login, armazenamento de sessão e renovação single-flight.
- Cadastro com confirmação de senha e login automático.
- Proteção de rotas.
- Permissões de proprietário/responsável/sem acesso na apresentação de controles.
- Detecção de proprietário ao abrir uma tarefa vinda de Minhas atribuições e fallback para colaboração reduzida.
- Conversão e limpeza de prazo.
- Criação/edição/exclusão de quadro, lista e tarefa com atualização de cache.
- Movimento de lista/tarefa, rollback em erro e alternativa “Mover para...”.
- Subtarefas e comentários conforme permissão.
- Preferências de tema/densidade/movimento.
- Estados vazio, carregamento e erro.

### 24.2 Verificações manuais

- `npm run build` sem erros.
- Suite de testes sem falhas.
- Navegação completa nos temas claro e escuro.
- Viewports de referência: aproximadamente 1440 px, 1024 px, 768 px e 390 px.
- Mouse, teclado e toque para ações principais.
- Teste com redução de movimentos.
- Teste de sessão expirada e refresh revogado.
- Confirmação de que `git diff` não contém mudanças em `src/`, `prisma/` ou `package.json` raiz.
- Interface disponível em `http://localhost:3000` com API funcional pela ponte local.

## 25. Decisões deixadas ao implementador

- Biblioteca específica de formulários, desde que leve e compatível com os testes.
- Biblioteca específica de ícones.
- Divisão exata de componentes e features dentro de `frontend/src`.
- Microtextos secundários que não alterem permissões nem contratos.
- Estratégia de geração determinística de cores de acento de cartões de quadro.
- Detalhes internos do script que coordena Vite e a ponte da API, preservando um único comando para o usuário.

## 26. Entrega e Git

- Todo código definitivo do frontend fica na branch `front`.
- Protótipos em `.superpowers/` permanecem ignorados.
- Antes de qualquer push, apresentar ao usuário: arquivos alterados, comandos de verificação, resultado dos testes e resumo do diff.
- Com autorização, enviar a branch `front` ao GitHub e preparar Pull Request para `main`.
- Merge na `main` somente após revisão dos colaboradores e autorização explícita.
