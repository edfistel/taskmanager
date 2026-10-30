# Validação local e continuidade

## Verificado sem banco

- 123 testes automatizados de frontend, incluindo autenticação, refresh concorrente, logout, isolamento de sessão, painel, listas, tarefas, atribuições, configurações, menu lateral e demonstração, passaram em 30/10/2026.
- Build TypeScript + Vite concluído.
- Formulários de login e cadastro renderizados no navegador.
- Navegação HTML para quadro atendida pela SPA; usuário sem sessão retorna ao login.
- Requisições JSON de quadros continuam encaminhadas para a API.

A suíte de frontend usa respostas simuladas. A persistência também foi validada posteriormente contra o PostgreSQL, conforme a seção de integração real abaixo.

## Trabalhar sem PostgreSQL

Execute `npm run dev:ui` na raiz para abrir a interface pública em http://localhost:3000/login. O comando não inicia API nem requer `.env`. Rotas protegidas continuam exigindo sessão. Use `npm test` para exercitar os componentes internos com as fixtures existentes.

## Estado atual do frontend

- A rota `/atribuicoes` já tem listagem, busca, filtros de status/quadro/prazo e abertura de detalhes com resolução de acesso. O contrato e as permissões também foram exercitados contra a API real.
- O painel já mostra totais e três atribuições recentes, com estados de vazio, carregamento e erro.
- Configurações implementadas: tema, densidade, redução de movimento, perfil somente leitura, troca de senha, saída e exclusão com confirmação digitada. Os contratos são testados com respostas simuladas.
- Páginas e configurações carregadas sob demanda; arquivo JavaScript principal caiu de aproximadamente 500 kB para 276 kB. Build sem aviso de chunk acima de 500 kB. A imagem original da marca foi preservada.
- Revisão no navegador em desktop (1440), tablet (1024) e celular (390), com dados fictícios. Criação de quadro/lista/tarefa, edição de status, subtarefa, comentário, atribuição, filtros, configurações, logout e login testados com mouse/teclado. Arrastar cartão entre listas e a alternativa “Mover para…” foram exercitados e preservaram o status.
- Corrigidos foco/Escape de modais empilhados, bloqueio de rolagem ao fundo, nomes acessíveis na navegação compacta e rolagem inicial ao trocar de página.
- Menu lateral com botão de recolher/expandir, logo preservado e textos ocultos no modo compacto; preferência local mantida entre páginas. Verificados mouse, teclado, alinhamento da área de conteúdo e navegação móvel.
- Cache limpo ao terminar/trocar a identidade; respostas autenticadas e refresh atrasados não atualizam a sessão seguinte.

## Demonstração navegável

Execute `npm run dev:demo` e abra http://localhost:3002. Dados fictícios, alterações em memória, sem banco. A faixa visível identifica o modo; recarregar ou restaurar reinicia os dados. O código demonstrativo não faz parte do build normal de produção. Capturas da revisão ficam em `.superpowers/previews/` (ignorada pelo Git).

Os testes e a revisão visual não garantem ausência absoluta de bugs. A demonstração continua separada dos dados reais.

## Integração real validada em 30/10/2026

1. `.env` local criada com conexão e JWT_SECRET aleatória; arquivo ignorado pelo Git.
2. Conexão na porta 5432 e consultas pelo Prisma confirmadas. Duas migrations já aplicadas, sem alterações de schema ou reset.
3. `npm run dev` iniciado com interface em http://localhost:3000 e API interna em 3001. `/health` confirmou banco conectado.
4. Teste de integração passou pelo proxy da interface: cadastro, e-mail duplicado, senha inválida, login e consulta de perfil.
5. Quadro/listas/tarefa criados e tarefa editada/movida. Nova leitura pela API e consulta independente pelo Prisma confirmaram título, status, lista e prazo salvos.
6. Subtarefas, comentários e atribuições exercitados com duas contas temporárias. Conta sem acesso recebeu 404; após atribuição, pôde colaborar sem obter os detalhes privativos do proprietário.
7. Refresh rotativo, bloqueio de reutilização de refresh revogado e logout confirmados.
8. Troca de senha e exclusão da conta temporária via API confirmadas, incluindo exclusão em cascata dos registros de teste.
9. Limpeza restrita às contas desta execução, identificadas por IDs e e-mails aleatórios únicos; dados existentes preservados.

O script local de verificação está em `.superpowers/check-real-db.mjs` (ignorado pelo Git); ele gera credenciais temporárias em memória e não exibe segredos. A interface normal foi deixada aberta em `/login` para cadastro ou entrada da conta do usuário. O modo de demonstração permanece em 3002.
