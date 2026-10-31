# Verificação da integração com a main

## Referências comparadas

- Remoto: `edfistel/taskmanager`.
- `origin/main`: `009cf593cd8942d56f9ea6a15ac8eb906e990371`.
- `front` e `origin/front`: `e5c2144188088fff6603f0fdaf6c8bd45cc2c540`.
- Referências atualizadas com `git fetch origin` antes da comparação.

A main era ancestral da front, sem commits exclusivos na main. Foi criada uma worktree temporária separada, inicialmente em origin/main. A simulação `git merge --no-commit --no-ff front` terminou sem conflitos e sem criar commit. O conteúdo integrado coincidiu com a front publicada.

## Verificações

- Dependências instaladas do zero com `npm ci` na raiz e no frontend da cópia isolada.
- Na integração do commit publicado: 123 testes passaram e build concluído.
- API da cópia isolada iniciada em uma porta temporária, sem interferir na instância em uso; `/health` retornou 200 e banco conectado. Credenciais não foram copiadas para arquivos versionados.
- As correções posteriores de inicialização e cadastro também foram aplicadas à cópia isolada para uma segunda verificação: 129 testes passaram e build concluído. A identificação da pasta é conferida tanto no frontend quanto na ponte local da API.
- Na pasta original, `npm run dev` iniciou a interface em 3000 e a ponte da API em 3001; a segunda invocação reconheceu o projeto em execução; `/health` retornou banco conectado.
- Cadastro verificado visualmente em janelas estreitas e baixas. Não houve envio de formulários nem criação de contas durante essa revisão de layout.

## Itens para o responsável revisar no PR

- Scripts da raiz que iniciam frontend e API juntos.
- Ajuste anterior em `src/server.js`: porta padrão 3001, com suporte a PORT. A lógica de permissões, rotas, serviços e schema não mudou nesta comparação/correção.
- Cada máquina precisa instalar as dependências e preparar a `.env` local. A `.env` continua fora do Git.
- `npm audit` sinalizou uma vulnerabilidade alta transitiva em `body-parser`, do backend, identificada como GHSA-27r3-jxmh-p828. O package-lock.json da raiz tem exatamente o mesmo objeto Git na main e na front (`50e8d8e5bfaaa0af42ed1c25fc8cd9c1837481c3`); esse alerta já pertence às dependências existentes. Não foi executado `npm audit fix` nem alterada dependência do backend.
- O frontend instalado isoladamente não apresentou vulnerabilidades na auditoria realizada pelo npm ci.

As correções posteriores ao commit e5c2144 precisam de novo commit e push para entrarem no PR. Nenhum commit, push ou merge na main foi realizado por esta verificação. Se a main receber novas alterações, a comparação deve ser repetida antes do merge definitivo.

Posteriormente, foi acrescentado `postinstall` na raiz para que um único `npm install` instale backend e frontend. O lockfile da raiz recebeu apenas `hasInstallScript: true`, sem mudanças de versões. Esse fluxo também foi testado em outra cópia limpa, com 129 testes e build aprovados.
